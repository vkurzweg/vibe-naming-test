import axios from 'axios';

// Use REACT_APP_API_URL if set, otherwise default to http://localhost:5000
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

console.log('API Base URL:', BASE_URL);

// Create a single, centralized axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to handle authentication and path normalization
api.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Normalize API paths to prevent duplicate prefixes
    // If the path starts with /v1/ and we're in development mode, ensure it's correctly prefixed
    if (config.url?.startsWith('/v1/') && process.env.NODE_ENV === 'development') {
      // Remove any existing /api prefix from the baseURL to prevent duplication
      const baseUrlHasApiPrefix = BASE_URL.endsWith('/api');
      
      // Log the request details for debugging
      console.log(`API Request - Original URL: ${config.url}, Base URL: ${BASE_URL}, Has API Prefix: ${baseUrlHasApiPrefix}`);
      
      // If we're using the proxy (empty or localhost BASE_URL), ensure the path is correctly prefixed with /api
      if (BASE_URL === '' || BASE_URL === 'http://localhost:5000') {
        config.url = `/api${config.url}`;
        console.log(`API Request - Normalized URL: ${config.url}`);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;