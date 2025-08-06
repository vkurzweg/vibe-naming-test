import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { useEffectiveRole } from './useEffectiveRole';
import { getMyRequests, getAllRequests } from '../features/requests/requestsSlice';
import { showSnackbar } from '../features/ui/uiSlice';

// Enhanced API functions with better error handling and Redux integration
const fetchMyRequests = async () => {
  try {
    const response = await api.get('/api/v1/requests/my-requests', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch my requests: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data || data; // Handle different API response formats
  } catch (error) {
    console.error('Error fetching my requests:', error);
    throw error;
  }
};

const fetchAllRequests = async () => {
  try {
    const response = await api.get('/api/v1/requests', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch all requests: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching all requests:', error);
    throw error;
  }
};

const updateRequestStatus = async ({ requestId, status, reason, reviewerNotes }) => {
  try {
    const response = await api.put(`/api/v1/requests/${requestId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, reason, reviewerNotes }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update request status: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
};

const claimRequest = async ({ requestId, reviewerId, reviewerName }) => {
  try {
    const response = await api.post(`/api/v1/requests/${requestId}/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reviewerId, reviewerName }),
    });
    if (!response.ok) {
      throw new Error(`Failed to claim request: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error claiming request:', error);
    throw error;
  }
};

const holdRequest = async ({ requestId, reason }) => {
  try {
    const response = await api.post(`/api/v1/requests/${requestId}/hold`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      throw new Error(`Failed to hold request: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error holding request:', error);
    throw error;
  }
};

const cancelRequest = async ({ requestId, reason }) => {
  try {
    const response = await api.post(`/api/v1/requests/${requestId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      throw new Error(`Failed to cancel request: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error cancelling request:', error);
    throw error;
  }
};

const updateRequestData = async ({ requestId, formData }) => {
  try {
    const response = await api.put(`/api/v1/requests/${requestId}`, formData);
    return response.data;
  } catch (error) {
    console.error('Error updating request data:', error);
    throw error;
  }
};

// Query keys for React Query
export const REQUEST_QUERY_KEYS = {
  all: ['requests'],
  myRequests: ['requests', 'my'],
  allRequests: ['requests', 'all'],
  request: (id) => ['requests', id],
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
      const { data } = await api.get(`/api/v1/requests/${requestId}`);
      return data;
    },
    enabled: !!requestId,
  });
};

// Hook for request management actions
const useRequestManagement = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  // Update request status
  const updateStatusMutation = useMutation({
    mutationFn: updateRequestStatus,
    onSuccess: (data, variables) => {
      // Invalidate and refetch requests
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.all });
      
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

  // Hold request
  const holdMutation = useMutation({
    mutationFn: holdRequest,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.all });
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

  // Cancel request
  const cancelMutation = useMutation({
    mutationFn: cancelRequest,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEYS.all });
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

  // Return all the hooks and mutations for use in components
  return {
    // Mutations
    updateStatus: updateStatusMutation.mutate,
    claimRequest: claimMutation.mutate,
    cancelRequest: cancelMutation.mutate,
    holdRequest: holdMutation.mutate,
    updateRequestData: updateDataMutation.mutate,
    
    // Loading states
    isUpdatingStatus: updateStatusMutation.isPending,
    isClaiming: claimMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isHolding: holdMutation.isPending,
    isUpdatingData: updateDataMutation.isPending,
    
    // Error states
    updateStatusError: updateStatusMutation.error,
    claimError: claimMutation.error,
    cancelError: cancelMutation.error,
    holdError: holdMutation.error,
    updateDataError: updateDataMutation.error,
  };
};

// Export default hook
export default useRequestManagement;
