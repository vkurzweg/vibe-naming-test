import axios from 'axios';

// In development, use relative URLs to enable proxy functionality
// In production, use REACT_APP_API_URL or default to current origin
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? '' // Always use empty baseURL in development to enable proxy
  : (process.env.REACT_APP_API_URL || window.location.origin);

console.log('API Base URL:', BASE_URL);
console.log('Environment:', process.env.NODE_ENV);

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
    
    // In development mode, just log the request - let proxy handle routing
    if (process.env.NODE_ENV === 'development') {
      // Ensure URL doesn't start with http:// or https:// in development
      // This makes sure we're using the proxy correctly
      if (config.url && (config.url.startsWith('http://') || config.url.startsWith('https://'))) {
        console.warn('WARNING: Using absolute URL in development mode may bypass proxy:', config.url);
        // Extract the path from the URL to use relative path instead
        try {
          const urlObj = new URL(config.url);
          config.url = urlObj.pathname + urlObj.search;
          console.log('Converted to relative path:', config.url);
        } catch (e) {
          console.error('Failed to convert URL to relative path:', e);
        }
      }
      
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
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