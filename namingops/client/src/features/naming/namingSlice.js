// client/src/features/naming/namingSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api'; // Import the centralized api instance
import { format } from 'date-fns';
import { logout } from '../auth/authSlice';

// Async thunks using the centralized api instance
export const createNamingRequest = createAsyncThunk(
  'naming/createNamingRequest',
  async (requestData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/name-requests', requestData);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Return the error to be handled by the component
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to create naming request',
        status: error.response?.status,
        details: error.response?.data,
      });
    }
  }
);

export const fetchNamingRequests = createAsyncThunk(
  'naming/fetchNamingRequests',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/name-requests?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch naming requests'
      );
    }
  }
);

const namingSlice = createSlice({
  name: 'naming',
  initialState: {
    requests: [],
    currentRequest: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 1
    }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetStatus: (state) => {
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Create Naming Request
    builder
      .addCase(createNamingRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNamingRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = [action.payload, ...state.requests];
        state.pagination.total += 1;
      })
      .addCase(createNamingRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Naming Requests
      .addCase(fetchNamingRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNamingRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests.map(request => ({
          ...request,
          createdAt: format(new Date(request.createdAt), 'MMM d, yyyy'),
          dueDate: request.dueDate ? format(new Date(request.dueDate), 'MMM d, yyyy') : 'N/A'
        }));
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchNamingRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, resetStatus } = namingSlice.actions;

export default namingSlice.reducer;