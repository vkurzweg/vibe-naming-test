import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout, switchRole } from '../features/auth/authSlice';
import {
  AppBar as MuiAppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
  Chip,
  Select,
  FormControl,
  InputLabel,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  AccountCircle,
  AdminPanelSettings as AdminIcon,
  RateReview as ReviewerIcon,
  Send as SubmitterIcon,
  ArrowDropDown,
} from '@mui/icons-material';
import { isDevelopment } from '../utils/environment';

const AppBar = ({ handleDrawerToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user and loading state from Redux
  const { user, isLoading } = useSelector((state) => ({
    user: state.auth.user,
    isLoading: state.auth.isLoading
  }));

  const [anchorEl, setAnchorEl] = useState(null);
  const [roleAnchorEl, setRoleAnchorEl] = useState(null);
  const accountMenuOpen = Boolean(anchorEl);
  const roleMenuOpen = Boolean(roleAnchorEl);

  // Get the current role from the Redux user
  const currentRole = user?.role || 'submitter';

  // Helper to get role from user object
  const getUserRole = (user) => {
    if (!user) return null;
    // Check both direct and nested role
    return user.role || (user.user && user.user.role) || null;
  };

  // Debug logging
  useEffect(() => {
    console.log('Auth state:', {
      user: user,
      currentRole: currentRole,
      roleConfig: currentRole ? getRoleConfig(currentRole) : 'No role config'
    });
  }, [user, currentRole]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleRoleMenu = (event) => {
    setRoleAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setRoleAnchorEl(null);
  };

  const handleRoleChange = useCallback((newRole) => {
    if (isDevelopment) {
      // In development, just update the role in the Redux store
      dispatch(switchRole({ role: newRole }));
      
      // Update the X-Mock-Role header for all future requests
      // api.defaults.headers.common['X-Mock-Role'] = newRole;
      
      // Force a refresh of the page to ensure all components update
      window.location.reload();
    }
    handleClose();
  }, [dispatch]);

  // Role configuration with colors and icons
  const roleConfig = {
    admin: { 
      label: 'Admin', 
      color: 'error',
      lightColor: 'rgba(239, 83, 80, 0.1)',
      icon: <AdminIcon fontSize="small" /> 
    },
    reviewer: { 
      label: 'Reviewer', 
      color: 'info',
      lightColor: 'rgba(41, 182, 246, 0.1)',
      icon: <ReviewerIcon fontSize="small" /> 
    },
    submitter: { 
      label: 'Submitter', 
      color: 'success',
      lightColor: 'rgba(76, 175, 80, 0.1)',
      icon: <SubmitterIcon fontSize="small" /> 
    },
  };

  const getRoleConfig = (role) => {
    if (!role) {
      // Default to admin role if no role is set
      return roleConfig.admin;
    }
    return roleConfig[role] || { 
      label: role, 
      color: 'default',
      lightColor: 'rgba(0, 0, 0, 0.1)'
    };
  };

  // Apply role-based background color to the document body
  useEffect(() => {
    if (currentRole) {
      const config = getRoleConfig(currentRole);
      document.body.style.backgroundColor = config.lightColor;
    }
    
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [currentRole]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - 240px)` },
        ml: { sm: `240px` },
        boxShadow: 'none',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.background.paper,
        color: (theme) => theme.palette.text.primary,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          NamingOps
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Role Switcher */}
          {currentRole ? (
            <>
              {/* Active Role Display */}
              <Box 
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mr: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: (theme) => `${getRoleConfig(currentRole).lightColor}80`,
                  border: (theme) => `1px solid ${theme.palette[getRoleConfig(currentRole).color]?.main}40`,
                }}
              >
                <Box 
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: (theme) => theme.palette[getRoleConfig(currentRole).color]?.main || theme.palette.text.primary,
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    mr: 0.5,
                  }}
                >
                  {getRoleConfig(currentRole).icon}
                  <Box component="span" sx={{ ml: 0.5 }}>{currentRole}</Box>
                </Box>
                
                {/* Role Dropdown Button */}
                <IconButton
                  onClick={handleRoleMenu}
                  size="small"
                  sx={{
                    p: 0.5,
                    ml: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ArrowDropDown fontSize="small" />
                </IconButton>
              </Box>

              {/* Role Dropdown Menu */}
              <Menu
                anchorEl={roleAnchorEl}
                open={roleMenuOpen}
                onClose={handleClose}
                onClick={handleClose}
              >
                {Object.entries(roleConfig)
                  .filter(([role]) => role !== currentRole)
                  .map(([role, config]) => (
                    <MenuItem 
                      key={role} 
                      onClick={() => handleRoleChange(role)}
                      dense
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            color: (theme) => theme.palette[config.color]?.main || 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {config.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText 
                        primary={config.label}
                        primaryTypographyProps={{
                          color: (theme) => theme.palette[config.color]?.main || 'inherit',
                        }}
                      />
                    </MenuItem>
                  ))}
              </Menu>
              
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            </>
          ) : (
            <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>
              No role assigned to user
            </Box>
          )}
          
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleMenu}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={accountMenuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={accountMenuOpen ? 'true' : undefined}
            >
              <Avatar
                sx={{ width: 32, height: 32 }}
                src={user?.avatar}
                alt={user?.name?.[0]?.toUpperCase() || 'U'}
              >
                {!user?.avatar && (user?.name?.[0]?.toUpperCase() || 'U')}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={accountMenuOpen}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {user?.name || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || 'user@example.com'}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={handleProfile}>
              <AccountCircle sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleSettings}>
              <SettingsIcon sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
