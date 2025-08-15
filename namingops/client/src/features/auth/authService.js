// Service for handling authentication-related API calls
import api from '../../services/api'; // Adjust if your API service is elsewhere
import { store } from '../../app/store';

const isDevOrDemo = process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true';

// --- Register ---
const register = async (userData) => {
  const res = await api.post('/api/v1/auth/register', userData);
  // Expect { user, token, ... }
  if (isDevOrDemo) {
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }
  return res.data.user;
};

// --- Login ---
const login = async (userData) => {
  const res = await api.post('/api/v1/auth/login', userData);
  if (isDevOrDemo) {
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }
  return res.data.user;
};

// --- Logout ---
const logout = async () => {
  await api.post('/api/v1/auth/logout');
  localStorage.removeItem('user');
};

// --- Google OAuth Login ---
const googleLogin = async (tokenResponse) => {
  // tokenResponse: { credential: string, ... }
  const res = await api.post('/api/v1/auth/google', { token: tokenResponse.credential });
  // Expect { user, token, ... } and user.picture for avatar
  if (isDevOrDemo) {
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }
  return res.data.user;
};

// --- Update User ---
const updateUser = async (userData, token) => {
  const res = await api.put('/api/v1/auth/me', userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (isDevOrDemo) {
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }
  return res.data.user;
};

// --- Change Password ---
const changePassword = async (passwordData, token) => {
  await api.post('/api/v1/auth/change-password', passwordData, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// --- Role Switcher (Dev/Demo Only) ---
export const switchRole = async (newRole) => {
  if (!isDevOrDemo) {
    console.warn('Role switching is only available in development or demo mode');
    return Promise.reject('Role switching is only available in development or demo mode');
  }
  try {
    const currentState = store.getState();
    const currentUser = currentState.auth.user;
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }
    // Create updated user with new role
    const updatedUser = {
      ...currentUser,
      role: newRole,
      name: `Dev ${newRole.charAt(0).toUpperCase() + newRole.slice(1)}`,
      email: `${newRole}@example.com`,
      _isDev: true
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return Promise.resolve(updatedUser);
  } catch (error) {
    console.error('Error switching role:', error);
    return Promise.reject(error);
  }
};

const authService = {
  register,
  login,
  logout,
  googleLogin,
  updateUser,
  changePassword,
  switchRole,
};

export default authService;