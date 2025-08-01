/**
 * Environment utility functions
 * 
 * This file contains helper functions to determine the current environment
 * and handle environment-specific behavior.
 */

/**
 * Check if the app is running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if the app is running in production mode
 * @returns {boolean} True if in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get the current environment name
 * @returns {string} The current environment (development, test, production, etc.)
 */
export const getEnvironment = () => process.env.NODE_ENV || 'development';

/**
 * Get the API base URL based on the current environment
 * @returns {string} The base URL for API requests
 */
export const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/+$/, '');
  }
  
  return isDevelopment 
    ? 'http://localhost:5000/api' 
    : '/api';
};

/**
 * Get the default mock user for development
 * @returns {Object} Mock user object
 */
export const getMockUser = (role = 'admin') => {
  const roles = ['admin', 'reviewer', 'submitter'];
  const validRole = roles.includes(role) ? role : 'admin';
  
  return {
    id: `dev-user-${Date.now()}`,
    email: `${validRole}@example.com`,
    role: validRole,
    name: `Dev ${validRole.charAt(0).toUpperCase() + validRole.slice(1)}`,
    isAdmin: validRole === 'admin',
  };
};

export default {
  isDevelopment,
  isProduction,
  getEnvironment,
  getApiBaseUrl,
  getMockUser,
};
