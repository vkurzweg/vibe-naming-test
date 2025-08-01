import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, switchRole } from '../features/auth/authSlice';
import {
  AppBar as MuiAppBar,
  Box,
  Toolbar,
  Typography,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  Button,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  RateReview as ReviewerIcon,
  Send as SubmitterIcon,
  ArrowDropDown,
} from '@mui/icons-material';
import { isDevelopment } from '../utils/environment';

const AppBar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user and loading state from Redux
  const { user } = useSelector((state) => ({
    user: state.auth.user,
  }));

  const [anchorEl, setAnchorEl] = useState(null);
  const [roleAnchorEl, setRoleAnchorEl] = useState(null);
  const accountMenuOpen = Boolean(anchorEl);
  const roleMenuOpen = Boolean(roleAnchorEl);
  const currentRole = user?.role || 'submitter';

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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleClose();
  };

  const handleRoleChange = useCallback((newRole) => {
    if (isDevelopment) {
      dispatch(switchRole({ role: newRole }));
      window.location.reload();
    }
    handleClose();
  }, [dispatch]);

  // Get role configuration
  const getRoleConfig = (role) => {
    const roles = {
      admin: { label: 'Admin', icon: <AdminIcon fontSize="small" />, color: 'error' },
      reviewer: { label: 'Reviewer', icon: <ReviewerIcon fontSize="small" />, color: 'info' },
      submitter: { label: 'Submitter', icon: <SubmitterIcon fontSize="small" />, color: 'success' },
    };
    return roles[role] || { label: role, icon: null, color: 'default' };
  };

  const roleConfig = getRoleConfig(currentRole);
  const userInitial = user?.name?.[0]?.toUpperCase() || 'U';

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              textDecoration: 'none',
              mr: 3,
            }}
          >
            Naming Ops
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Role Switcher (Development Only) */}
          {isDevelopment && (
            <>
              <Tooltip title="Switch Role">
                <Chip
                  icon={roleConfig.icon}
                  label={roleConfig.label}
                  onClick={handleRoleMenu}
                  color={roleConfig.color}
                  size="small"
                  deleteIcon={<ArrowDropDown />}
                  onDelete={handleRoleMenu}
                  sx={{
                    cursor: 'pointer',
                    '& .MuiChip-deleteIcon': {
                      color: 'inherit',
                    },
                  }}
                />
              </Tooltip>
              <Menu
                anchorEl={roleAnchorEl}
                open={roleMenuOpen}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'role-switcher',
                  dense: true,
                }}
              >
                {['admin', 'reviewer', 'submitter'].map((role) => {
                  const config = getRoleConfig(role);
                  return (
                    <MenuItem
                      key={role}
                      selected={currentRole === role}
                      onClick={() => handleRoleChange(role)}
                      sx={{
                        minWidth: '120px',
                        '&.Mui-selected': {
                          backgroundColor: `${theme.palette.primary.light}20`,
                          '&:hover': {
                            backgroundColor: `${theme.palette.primary.light}30`,
                          },
                        },
                      }}
                    >
                      <ListItemIcon>{config.icon}</ListItemIcon>
                      <ListItemText primary={config.label} />
                    </MenuItem>
                  );
                })}
              </Menu>
            </>
          )}

          {/* User Menu */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleMenu}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={accountMenuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={accountMenuOpen ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                {userInitial}
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
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">{user?.name || 'User'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email || ''}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => navigate('/settings')}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
