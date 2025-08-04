import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchReviewRequests = createAsyncThunk(
  'review/fetchRequests',
  async (filters = {}, { rejectWithValue }) => {
    try {
      console.log('Fetching review requests with filters:', filters);
      // Use the correct API endpoint with /v1/requests prefix
      // Remove role filter to get all requests for review
      const response = await api.get('/v1/requests', { 
        params: {
          ...filters,
          status: filters.status || 'all',
          // Don't filter by role to ensure we get all requests
          limit: 100
        } 
      });
      console.log('Review requests API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching review requests:', error);
      return rejectWithValue(error.response?.data || 'Failed to fetch review requests');
    }
  }
);

export const claimRequest = createAsyncThunk(
  'review/claimRequest',
  async (requestId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      // Use the correct API endpoint with /v1/requests prefix
      const response = await api.patch(`/v1/requests/${requestId}/claim`, {
        reviewerId: auth.user.id,
        reviewerName: `${auth.user.firstName} ${auth.user.lastName}`
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to claim request');
    }
  }
);

export const updateRequestStatus = createAsyncThunk(
  'review/updateStatus',
  async ({ requestId, status, notes }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      // Use the correct API endpoint with /v1/requests prefix
      const response = await api.patch(`/v1/requests/${requestId}/status`, {
        status,
        notes,
        userId: auth.user.id,
        userName: auth.user.name || `${auth.user.firstName} ${auth.user.lastName}`
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update request status');
    }
  }
);

const initialState = {
  requests: [],
  loading: false,
  error: null,
  filters: {
    status: '',
    reviewerName: '',
    requestorName: '',
    searchQuery: '',
    sortBy: 'requestDate',
    sortOrder: 'desc',
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  metrics: {
    totalRequests: 0,
    avgApprovalTime: 0,
    monthlyRequests: [],
  },
};

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviewRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests;
        state.pagination.total = action.payload.total;
        if (action.payload.metrics) {
          state.metrics = action.payload.metrics;
        }
      })
      .addCase(fetchReviewRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(claimRequest.fulfilled, (state, action) => {
        const index = state.requests.findIndex(req => req.id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      .addCase(claimRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to claim request';
      })
      .addCase(updateRequestStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRequestStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.requests.findIndex(req => req._id === action.payload._id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      .addCase(updateRequestStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update request status';
      });
  },
});

// Selectors
export const selectReviewState = (state) => state.review;
export const selectReviewRequests = (state) => state.review.requests;
export const selectReviewLoading = (state) => state.review.loading;
export const selectReviewError = (state) => state.review.error;
export const selectReviewFilters = (state) => state.review.filters;
export const selectReviewPagination = (state) => state.review.pagination;
export const selectReviewMetrics = (state) => state.review.metrics;

export const { setFilters, setPagination, resetFilters } = reviewSlice.actions;

export default reviewSlice.reducer;
