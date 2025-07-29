import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchReviewRequests = createAsyncThunk(
  'review/fetchRequests',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/name-requests/review', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch review requests');
    }
  }
);

export const claimRequest = createAsyncThunk(
  'review/claimRequest',
  async (requestId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await axios.patch(`/api/name-requests/${requestId}/claim`, {
        reviewerId: auth.user.id,
        reviewerName: `${auth.user.firstName} ${auth.user.lastName}`
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to claim request');
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
