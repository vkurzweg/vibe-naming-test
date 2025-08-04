import React, { createContext, useState } from 'react';
import { Fab, Menu, MenuItem, Tooltip } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

// Roles available in the system
const ROLES = ['submitter', 'reviewer', 'admin'];

// Context will hold either null (no override) or one of the ROLES
export const DevRoleContext = createContext(null);

/**
 * DevRoleProvider wraps children only in development mode. In production it just returns children.
 * It exposes a small floating FAB that allows developers to switch roles on the fly.
 */
export const DevRoleProvider = ({ children }) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Hooks must always execute, but we will no-op in production
  // Default to 'submitter' so UI loads without manual selection
  const [role, setRole] = useState('submitter');
  const [anchorEl, setAnchorEl] = useState(null);

  // When not in dev just supply null override and render children
  if (!isDev) {
    return <DevRoleContext.Provider value={null}>{children}</DevRoleContext.Provider>;
  }
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSelectRole = (newRole) => {
    setRole(newRole);
    setAnchorEl(null);
  };

  return (
    <DevRoleContext.Provider value={role}>
      {children}
      {/* Discreet floating button bottom-left */}
      <Tooltip title="Dev Role">
        <Fab
          size="small"
          color="secondary"
          sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 2000, opacity: 0.6 }}
          onClick={handleOpenMenu}
        >
        <AdminPanelSettingsIcon fontSize="small" />
        </Fab>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleSelectRole(null)}>Auth Role</MenuItem>
        {ROLES.map((r) => (
          <MenuItem key={r} onClick={() => handleSelectRole(r)}>{r}</MenuItem>
        ))}
      </Menu>
    </DevRoleContext.Provider>
  );
};
