/**
 * Developer Mode Utility
 * 
 * This utility provides development-only features like role simulation and access control overrides.
 * These features are automatically disabled in production builds.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Check if the app is running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Available roles in the application
 */
export const ROLES = {
  ADMIN: 'admin',
  REVIEWER: 'reviewer',
  SUBMITTER: 'submitter',
  DEVELOPER: 'developer', // Special role for development
};

// Role permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'admin:all',
    'review:all',
    'submit:all',
    'view:all'
  ],
  [ROLES.REVIEWER]: [
    'review:all',
    'submit:all',
    'view:all'
  ],
  [ROLES.SUBMITTER]: [
    'submit:all',
    'view:own'
  ],
  [ROLES.DEVELOPER]: [
    'admin:all',
    'review:all',
    'submit:all',
    'view:all',
    'dev:all'
  ]
};

// Default user data
const DEFAULT_USER = {
  _id: 'dev-user-12345',
  name: 'Developer',
  email: 'developer@example.com',
  role: ROLES.DEVELOPER,
  permissions: ROLE_PERMISSIONS[ROLES.DEVELOPER]
};

// Create a store for developer settings
export const useDeveloperStore = create(
  persist(
    (set) => ({
      // Current active role (overrides the user's actual role in development)
      activeRole: ROLES.DEVELOPER,
      // Whether role simulation is enabled
      isRoleSimulation: true,
      // Set the active role
      setActiveRole: (role) => set({ activeRole: role }),
      // Toggle role simulation
      toggleRoleSimulation: () => set((state) => ({
        isRoleSimulation: !state.isRoleSimulation
      })),
      // Reset to default developer settings
      resetDeveloperSettings: () => set({
        activeRole: ROLES.DEVELOPER,
        isRoleSimulation: true
      })
    }),
    {
      name: 'developer-settings', // name of the item in local storage
    }
  )
);

/**
 * Get the current user with simulated role if enabled
 * @param {Object} user - The actual user from auth state
 * @returns {Object} The user with potentially overridden role
 */
export const getEffectiveUser = (user) => {
  if (!isDevelopment) return user;
  
  const { activeRole, isRoleSimulation } = useDeveloperStore.getState();
  
  // If no user is logged in or role simulation is disabled, return as is
  if (!user || !isRoleSimulation) {
    return user || { ...DEFAULT_USER };
  }
  
  // Return user with simulated role and permissions
  return {
    ...DEFAULT_USER,
    ...user,
    role: activeRole,
    permissions: ROLE_PERMISSIONS[activeRole] || [],
    _isSimulated: true
  };
};

/**
 * Check if the current user has the required role
 * @param {Object} user - The user object from auth state
 * @param {string|Array} requiredRole - The role(s) to check against
 * @returns {boolean} True if user has the required role
 */
export const hasRole = (user, requiredRole) => {
  const effectiveUser = getEffectiveUser(user);
  if (!effectiveUser) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(effectiveUser.role);
  }
  
  return effectiveUser.role === requiredRole;
};

/**
 * Check if the current user has the required permission
 * @param {Object} user - The user object from auth state
 * @param {string} permission - The permission to check
 * @returns {boolean} True if user has the permission
 */
export const hasPermission = (user, permission) => {
  const effectiveUser = getEffectiveUser(user);
  if (!effectiveUser?.permissions) return false;
  
  // Check for wildcard permissions (e.g., 'admin:*' matches 'admin:all')
  const [category] = permission.split(':');
  return (
    effectiveUser.permissions.includes(permission) ||
    effectiveUser.permissions.includes(`${category}:*`) ||
    effectiveUser.permissions.includes('*:*')
  );
};

/**
 * Hook to use developer settings and controls
 * @returns {Object} Developer settings and controls
 */
export const useDeveloperControls = () => {
  // Always call hooks at the top level
  const {
    activeRole,
    isRoleSimulation,
    setActiveRole,
    toggleRoleSimulation,
    resetDeveloperSettings
  } = useDeveloperStore();

  // Then handle the development check
  if (!isDevelopment) {
    return {
      isDeveloper: false,
      activeRole: null,
      isRoleSimulation: false,
      availableRoles: [],
      setActiveRole: () => {},
      toggleRoleSimulation: () => {},
      resetDeveloperSettings: () => {}
    };
  }

  return {
    isDeveloper: true,
    activeRole,
    isRoleSimulation,
    availableRoles: Object.values(ROLES),
    setActiveRole,
    toggleRoleSimulation,
    resetDeveloperSettings
  };
};

/**
 * Get a simulated user for a specific role
 * @param {string} role - The role to simulate
 * @returns {Object} The simulated user object
 */
export const getSimulatedUser = (role = ROLES.DEVELOPER) => {
  if (!isDevelopment) {
    console.warn('getSimulatedUser() should only be used in development');
    return null;
  }
  
  return {
    ...DEFAULT_USER,
    role,
    permissions: ROLE_PERMISSIONS[role] || [],
    _isSimulated: true
  };
};
