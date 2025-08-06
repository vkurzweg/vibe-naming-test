// client/src/features/naming/namingSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api'; // Import the centralized api instance
import { format } from 'date-fns';
import { logout } from '../auth/authSlice';

// Async thunks using the centralized api instance
export const createNamingRequest = createAsyncThunk(
  'naming/createNamingRequest',
  async (requestData, { rejectWithValue }) => {
    console.log('Starting createNamingRequest with data:', JSON.stringify(requestData, null, 2));
    
    try {
      // Pass through the form data exactly as provided without adding defaults
      const payload = {
        // Use only what's provided in the request data
        formData: requestData.formData || {},
        user: requestData.user || {},
        status: requestData.status || 'pending',
        formConfigId: requestData.formConfigId,
        formConfigName: requestData.formConfigName
      };

      // Log the final payload being sent to the server
      console.log('Sending request to server with payload:', JSON.stringify(payload, null, 2));
      
      // Make the API request
      const response = await api.post('/api/v1/name-requests', payload);
      
      console.log('Request successful, response:', response.data);
      return response.data;
      
    } catch (error) {
      // Create a serializable error object
      const errorDetails = {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          // Only include headers that are needed and are serializable
          headers: {
            'content-type': error.response.headers?.['content-type'],
            'content-length': error.response.headers?.['content-length']
          }
        } : 'No response',
        request: error.request ? 'Request was made but no response received' : 'No request was made',
        config: {
          url: error.config?.url,
          method: error.config?.method,
          // Only include serializable parts of the config
          ...(error.config?.headers && {
            headers: Object.fromEntries(
              Object.entries(error.config.headers).filter(([key]) => 
                typeof key === 'string' && 
                typeof error.config.headers[key] === 'string'
              )
            )
          }),
          data: typeof error.config?.data === 'string' ? error.config.data : '[Non-string data]'
        },
        timestamp: new Date().toISOString()
      };
      
      console.error('API Error details:', JSON.stringify(errorDetails, null, 2));
      
      // Return a standardized error object with only serializable data
      const serializableError = {
        message: error.response?.data?.message || 'Failed to create naming request',
        status: error.response?.status,
        details: error.response?.data || error.message,
        validation: error.response?.data?.errors || (error.message.includes('Validation') ? [error.message] : []),
        timestamp: new Date().toISOString()
      };
      
      // Only include debug info in non-production
      if (process.env.NODE_ENV === 'development') {
        serializableError._debug = errorDetails;
      }
      
      return rejectWithValue(serializableError);
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

      // Use the correct API endpoint with /api/v1/requests prefix
      const response = await api.get(`/api/v1/requests?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching naming requests:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch naming requests',
        {
          status: error.response?.status,
          details: error.response?.data
        }
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
        // Make sure we're handling the response correctly
        if (action.payload && action.payload.data) {
          // If the response has a data property, use that
          state.requests.unshift(action.payload.data);
        } else if (action.payload) {
          // Otherwise use the payload directly
          state.requests.unshift(action.payload);
        }
        // Safely increment the total count
        if (state.pagination && typeof state.pagination.total === 'number') {
          state.pagination.total += 1;
        }
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