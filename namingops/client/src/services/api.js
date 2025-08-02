import axios from 'axios';

// Ensure the URL ends with /api/v1
const BASE_URL = 'http://localhost:5000/api/v1';

console.log('API Base URL:', BASE_URL);

// Development mode setup
const isDevelopment = process.env.NODE_ENV === 'development';
const DEV_TOKEN = 'dev-token-12345';
const DEV_USER = {
  id: 'dev-user-1',
  name: 'Developer',
  email: 'dev@example.com',
  role: 'admin',
  token: DEV_TOKEN,
  _isDev: true
};

// In development, ensure we always have a user and token
if (isDevelopment) {
  localStorage.setItem('token', DEV_TOKEN);
  localStorage.setItem('user', JSON.stringify(DEV_USER));
  console.log('Development mode: Authentication disabled, using mock user:', DEV_USER);
}

// Create a single, centralized axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Disable auth in development
  withCredentials: !isDevelopment
});

// Request interceptor to handle authentication
api.interceptors.request.use(
  (config) => {
    // In development, skip auth headers entirely
    if (isDevelopment) {
      // Add a timestamp to prevent caching
      if (config.params) {
        config.params._t = Date.now();
      } else {
        config.params = { _t: Date.now() };
      }
      return config;
    }
    
    // In production, use the token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // In development, bypass all auth errors
    if (isDevelopment) {
      console.warn('Development: Bypassing error:', error.message);
      
      // For auth endpoints, return a mock successful response
      if (error.config?.url?.includes('auth')) {
        return Promise.resolve({
          data: {
            success: true,
            token: 'dev-mock-token-12345',
            user: {
              id: 'dev-user-id',
              email: 'dev@example.com',
              role: 'admin',
              name: 'Dev Admin'
            }
          }
        });
      }
      
      // For form configurations, return a default config
      if (error.config?.url?.includes('form-configurations')) {
        console.warn('Development: Returning mock form configuration');
        return Promise.resolve({
          data: [{
            _id: 'default-dev-config',
            name: 'Default Development Form',
            description: 'Default form configuration for development',
            isActive: true,
            fields: [
              {
                _id: '1',
                name: 'requestTitle',
                label: 'Request Title',
                fieldType: 'text',
                required: true
              },
              {
                _id: '2',
                name: 'description',
                label: 'Description',
                fieldType: 'textarea',
                required: true
              }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          }]
        });
      }
    }
    
    // For production or non-development handling
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
