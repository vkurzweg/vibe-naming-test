import api from './api';

// Development mode mock users
const devUsers = {
  admin: {
    _id: 'dev-admin-123',
    name: 'Development Admin',
    email: 'admin@example.com',
    role: 'admin',
    token: 'dev-token-123',
    _isDev: true
  },
  reviewer: {
    _id: 'dev-reviewer-123',
    name: 'Development Reviewer',
    email: 'reviewer@example.com',
    role: 'reviewer',
    token: 'dev-token-123',
    _isDev: true
  },
  submitter: {
    _id: 'dev-submitter-123',
    name: 'Development User',
    email: 'user@example.com',
    role: 'submitter',
    token: 'dev-token-123',
    _isDev: true
  }
};
const isDevOrDemo = process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true';
const authService = {
  // Register user
  register: async (userData) => {
    if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true') {
      // In development, just return a success response
      const newUser = { 
        ...userData, 
        _id: `dev-${Date.now()}`,
        _isDev: true
      };
      localStorage.setItem('token', 'dev-token-123');
      localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser, token: 'dev-token-123' };
    }
    
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login user
  login: async (credentials) => {
    if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true') {
      // In development, bypass the actual login and return a mock user
      const user = devUsers[credentials.role] || devUsers.admin;
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      return { user, token: user.token };
    }
    
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout user
  logout: () => {
    if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true') {
      // In development, just clear the local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return Promise.resolve();
    }
    
    // In production, call the actual logout endpoint
    return api.post('/auth/logout')
      .finally(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  },

  // Development-only: Switch roles
  switchRole: (role) => {
    if (!isDevOrDemo) {
    console.warn('Role switching is only available in development or demo mode');
    return Promise.reject('Role switching is only available in development or demo mode');
  }
    
    const user = devUsers[role] || devUsers.admin;
    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user));
    return Promise.resolve({ user, token: user.token });
  },

  // Google login
  googleLogin: async (tokenResponse) => {
    if (!isDevOrDemo) {
      // In development, return a mock admin user
      const user = devUsers.admin;
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      return { user, token: user.token };
    }
    
    try {
      const response = await api.post('/api/v1/auth/google', {
        credential: tokenResponse.credential,
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user
  updateUser: async (userData, token) => {
    try {
      const response = await api.put('/api/v1/auth/update', userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Change password
  changePassword: async (passwordData, token) => {
    try {
      const response = await api.put('/api/v1/auth/change-password', passwordData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default authService;