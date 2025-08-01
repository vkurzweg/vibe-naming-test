// Service for handling authentication-related API calls
import { store } from '../../app/store';

export const switchRole = async (newRole) => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Role switching is only available in development mode');
    return Promise.reject('Role switching is only available in development mode');
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

    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Return the updated user to be used by the Redux action
    return Promise.resolve(updatedUser);
  } catch (error) {
    console.error('Error switching role:', error);
    return Promise.reject(error);
  }
};

// Export other auth-related functions as needed
export default {
  switchRole,
};
