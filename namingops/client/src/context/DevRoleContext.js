import React, { createContext, useState } from 'react';

// Context will hold either null (no override) or { role, setRole }
export const DevRoleContext = createContext(null);

/**
 * DevRoleProvider wraps children only in development mode. In production it just returns children.
 * It exposes a small floating FAB that allows developers to switch roles on the fly.
 */
export const DevRoleProvider = ({ children }) => {
  const isDev = process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true';

  // Hooks must always execute, but we will no-op in production
  // Default to 'submitter' so UI loads without manual selection
  const [role, setRole] = useState('submitter');

  // When not in dev just supply null override and render children
  if (!isDev) {
    return <DevRoleContext.Provider value={null}>{children}</DevRoleContext.Provider>;
  }

  return (
    <DevRoleContext.Provider value={{ role, setRole }}>
      {children}
    </DevRoleContext.Provider>
  );
};
