// client/src/features/naming/namingSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { format } from 'date-fns';
import { logout } from '../auth/authSlice';

const API_URL = '/api/name-requests';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions if using them
});

// Development mode interceptor - no authentication required
api.interceptors.request.use(
  (config) => {
    // Add some default headers for development
    if (process.env.REACT_APP_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      // Always set the Authorization header in development
      config.headers = {
        ...config.headers,
        'Authorization': 'Bearer dev-mock-token-12345',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      console.log('Request headers:', JSON.stringify(config.headers, null, 2));
      return config;
    }
    
    // Production authentication logic
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    } else {
      console.warn('No authentication token found - this would redirect to login in production');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    const { status } = error.response || {};
    
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
        error: error.message
      });
      
      // In development, don't redirect, just log the error
      if (status === 401) {
        console.warn('Authentication required - this would redirect to login in production');
      }
      
      return Promise.reject(error);
    }
    
    // Production error handling
    if (status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login?sessionExpired=true';
    }
    
    return Promise.reject(error);
  }
);

// Async thunks
export const createNamingRequest = createAsyncThunk(
  'naming/createNamingRequest',
  async (requestData, { rejectWithValue, dispatch }) => {
    try {
      // Skip authentication check in development
      if (process.env.NODE_ENV !== 'development') {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!user?.token) {
          // If no token, reject with a 401 error
          return rejectWithValue({
            message: 'No authentication token found. Please log in.',
            status: 401
          });
        }
      }
      
      const response = await api.post(API_URL, requestData);
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

      const response = await api.get(`${API_URL}?${params.toString()}`);
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