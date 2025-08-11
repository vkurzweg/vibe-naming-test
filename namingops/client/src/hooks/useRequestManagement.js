import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { useEffectiveRole } from './useEffectiveRole';
import { getMyRequests, getAllRequests } from '../features/requests/requestsSlice';
import { showSnackbar } from '../features/ui/uiSlice';

// Fetch user's requests
const fetchMyRequests = async () => {
  try {
    const response = await api.get('/api/v1/name-requests/my-requests');
    return response.data;
  } catch (error) {
    console.error('Error fetching my requests:', error);
    throw error;
  }
};

// Fetch all requests (admin/reviewer)
const fetchAllRequests = async () => {
  try {
    const response = await api.get('/api/v1/name-requests');
    return response.data;
  } catch (error) {
    console.error('Error fetching all requests:', error);
    throw error;
  }
};

// Unified status update mutation
const updateRequestStatus = async ({ requestId, status, reason, reviewerNotes }) => {
  if (!requestId) throw new Error("Request ID is undefined");
  if (!status) throw new Error("Status is required");
  try {
    const response = await api.put(`/api/v1/name-requests/${requestId}/status`, {
      status, 
      reason, 
      reviewerNotes
    });
    return response.data;
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
};

// Claim request
const claimRequest = async ({ requestId, reviewerId, reviewerName }) => {
  try {
    const response = await api.post(`/api/v1/name-requests/${requestId}/claim`, {
      reviewerId,
      reviewerName
    });
    return response.data;
  } catch (error) {
    console.error('Error claiming request:', error);
    throw error;
  }
};

// Cancel request (wrapper)
const cancelRequest = async ({ requestId, reason }) => {
  return updateRequestStatus({ requestId, status: 'cancelled', reason });
};

// Hold request (wrapper)
const holdRequest = async ({ requestId, reason }) => {
  return updateRequestStatus({ requestId, status: 'on_hold', reason });
};

// You can add more wrappers for other statuses if you want, e.g.:
const submitRequestStatus = async ({ requestId, reason }) => {
  return updateRequestStatus({ requestId, status: 'submitted', reason });
};
const brandReviewRequest = async ({ requestId, reason }) => {
  return updateRequestStatus({ requestId, status: 'brand_review', reason });
};
const legalReviewRequest = async ({ requestId, reason }) => {
  return updateRequestStatus({ requestId, status: 'legal_review', reason });
};
const approveRequest = async ({ requestId, reason }) => {
  return updateRequestStatus({ requestId, status: 'approved', reason });
};

// Update request data (form fields)
const updateRequestData = async ({ requestId, formData }) => {
  try {
    const response = await api.put(`/api/v1/name-requests/${requestId}`, formData);
    return response.data;
  } catch (error) {
    console.error('Error updating request data:', error);
    throw error;
  }
};

// Admin-specific functions
const deleteRequest = async (requestId) => {
  if (!requestId) throw new Error("Request ID is undefined");
  try {
    const response = await api.delete(`/api/v1/name-requests/${requestId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting request: ${error.message}`);
    throw error;
  }
};

const activateFormConfig = async (configId) => {
  if (!configId) throw new Error("Config ID is undefined");
  try {
    const response = await api.put(`/api/v1/form-configurations/${configId}/activate`);
    return response.data;
  } catch (error) {
    console.error(`Error activating form config: ${error.message}`);
    throw error;
  }
};

// Query keys for React Query
export const REQUEST_QUERY_KEYS = {
  all: ['requests'],
  myRequests: ['requests', 'my'],
  allRequests: ['requests', 'all'],
  request: (id) => ['requests', id],
  formConfigs: ['formConfigs'],
  activeFormConfig: ['formConfigs', 'active'],
};

// Hook for fetching user's requests
export const useMyRequests = () => {
  return useQuery({
    queryKey: REQUEST_QUERY_KEYS.myRequests,
    queryFn: fetchMyRequests,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Hook for fetching all requests (reviewers/admins)
export const useAllRequests = () => {
  return useQuery({
    queryKey: REQUEST_QUERY_KEYS.allRequests,
    queryFn: fetchAllRequests,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Hook for fetching a single request
export const useRequest = (requestId) => {
  return useQuery({
    queryKey: REQUEST_QUERY_KEYS.request(requestId),
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/name-requests/${requestId}`);
      return data;
    },
    enabled: !!requestId,
  });
};

// Hook for request management actions
const useRequestManagement = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  // Unified status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: updateRequestStatus,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.myRequests });
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.request(variables.requestId) });
      dispatch(showSnackbar({
        message: `Request status updated to ${variables.status}`,
        severity: 'success'
      }));
    },
    onError: (error) => {
      dispatch(showSnackbar({
        message: `Failed to update status: ${error.message}`,
        severity: 'error'
      }));
    }
  });

  // Claim request
  const claimMutation = useMutation({
    mutationFn: claimRequest,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.request(variables.requestId) });
      dispatch(showSnackbar({
        message: 'Request claimed successfully',
        severity: 'success'
      }));
    },
    onError: (error) => {
      dispatch(showSnackbar({
        message: `Failed to claim request: ${error.message}`,
        severity: 'error'
      }));
    }
  });

  // Cancel request
  const cancelMutation = useMutation({
    mutationFn: cancelRequest,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.myRequests });
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.request(variables.requestId) });
      dispatch(showSnackbar({
        message: 'Request cancelled successfully',
        severity: 'warning'
      }));
    },
    onError: (error) => {
      dispatch(showSnackbar({
        message: `Failed to cancel request: ${error.message}`,
        severity: 'error'
      }));
    }
  });

  // Hold request
  const holdMutation = useMutation({
    mutationFn: holdRequest,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.myRequests });
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.request(variables.requestId) });
      dispatch(showSnackbar({
        message: 'Request put on hold successfully',
        severity: 'info'
      }));
    },
    onError: (error) => {
      dispatch(showSnackbar({
        message: `Failed to hold request: ${error.message}`,
        severity: 'error'
      }));
    }
  });

  // Update request data
  const updateDataMutation = useMutation({
    mutationFn: updateRequestData,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.request(variables.requestId) });
      dispatch(showSnackbar({
        message: 'Request updated successfully',
        severity: 'success'
      }));
    },
    onError: (error) => {
      dispatch(showSnackbar({
        message: `Failed to update request: ${error.message}`,
        severity: 'error'
      }));
    }
  });

  // Delete request (Admin only)
  const deleteRequestMutation = useMutation({
    mutationFn: deleteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.all });
      dispatch(showSnackbar({
        message: 'Request deleted successfully',
        severity: 'success'
      }));
    },
    onError: (error) => {
      dispatch(showSnackbar({
        message: `Failed to delete request: ${error.message}`,
        severity: 'error'
      }));
    }
  });

  // Activate form configuration (Admin only)
  const activateFormConfigMutation = useMutation({
    mutationFn: activateFormConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.formConfigs });
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.activeFormConfig });
      dispatch(showSnackbar({
        message: 'Form configuration activated successfully',
        severity: 'success'
      }));
    },
    onError: (error) => {
      dispatch(showSnackbar({
        message: `Failed to activate form configuration: ${error.message}`,
        severity: 'error'
      }));
    }
  });

  // Return all the hooks and mutations for use in components
  return {
    // Mutations
    updateStatus: updateStatusMutation.mutate,
    claimRequest: claimMutation.mutate,
    cancelRequest: cancelMutation.mutate,
    holdRequest: holdMutation.mutate,
    updateRequestData: updateDataMutation.mutate,

    // Admin-specific mutations
    deleteRequest: deleteRequestMutation.mutate,
    activateFormConfig: activateFormConfigMutation.mutate,

    // Loading states
    isUpdatingStatus: updateStatusMutation.isPending,
    isClaiming: claimMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isHolding: holdMutation.isPending,
    isUpdatingData: updateDataMutation.isPending,
    isDeleting: deleteRequestMutation.isPending,
    isActivatingFormConfig: activateFormConfigMutation.isPending,

    // Error states
    updateStatusError: updateStatusMutation.error,
    claimError: claimMutation.error,
    cancelError: cancelMutation.error,
    holdError: holdMutation.error,
    updateDataError: updateDataMutation.error,
    deleteError: deleteRequestMutation.error,
    activateFormConfigError: activateFormConfigMutation.error,
  };
};

export default useRequestManagement;