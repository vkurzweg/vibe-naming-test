import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Container,
} from '@mui/material';
import {
  AccountCircle,
  Settings,
  Logout,
  Dashboard,
  Assignment,
  People,
  AdminPanelSettings,
  Notifications,
  Add as AddIcon,
  SwapHoriz,
} from '@mui/icons-material';
import { logout } from '../../features/auth/authSlice';
import { useEffectiveRole } from '../../hooks/useEffectiveRole';
import { DevRoleContext } from '../../context/DevRoleContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import SubmitRequestModal from '../Requests/SubmitRequestModal';
import { ThemeContext } from '../ThemeIntegration/EnhancedThemeProvider';

const ProfessionalAppBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const effectiveRole = useEffectiveRole();
  const devRoleContext = useContext(DevRoleContext);
  const { isDarkMode } = useContext(ThemeContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
  const [submitRequestModalOpen, setSubmitRequestModalOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleRoleMenuOpen = (event) => {
    setRoleMenuAnchor(event.currentTarget);
  };

  const handleRoleMenuClose = () => {
    setRoleMenuAnchor(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleRoleChange = (role) => {
    if (devRoleContext?.setRole) {
      devRoleContext.setRole(role);
    }
    handleRoleMenuClose();
  };

  const ROLES = ['admin', 'reviewer', 'submitter'];

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'reviewer':
        return 'warning';
      case 'submitter':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings fontSize="small" />;
      case 'reviewer':
        return <Assignment fontSize="small" />;
      case 'submitter':
        return <AccountCircle fontSize="small" />;
      default:
        return <AccountCircle fontSize="small" />;
    }
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'transparent',
        borderBottom: isDarkMode 
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 0,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: isDarkMode ? 'inherit' : '#1a1a1a',
      }}
    >
      <Toolbar 
        disableGutters 
        sx={{ 
          minHeight: '64px',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <Container fluid className="px-4">
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%'
          }}>
            {/* Logo and App Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img 
                src={isDarkMode ? "/cog_logo_darkmode.png" : "/cog_logo.png"}
                alt="Company Logo"
                style={{ 
                  height: '45px',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>

            {/* Right side - User controls with improved light mode visibility */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Theme Toggle with improved visibility */}
              <ThemeToggle 
                sx={{ 
                  color: isDarkMode ? 'inherit' : '#1a1a1a',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                }} 
              />
              
              {/* Notifications with improved visibility */}
              <Tooltip title="Notifications">
                <IconButton
                  color="inherit"
                  onClick={(e) => setNotificationAnchor(e.currentTarget)}
                  sx={{
                    color: isDarkMode ? 'inherit' : '#1a1a1a',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <Badge badgeContent={0} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              {/* Role Indicator */}
              <Tooltip title={process.env.NODE_ENV === 'development' ? 'Change Role (Development Only)' : 'Current Role'}>
                <Chip 
                  label={effectiveRole || 'Guest'} 
                  color={getRoleColor(effectiveRole)}
                  size="small"
                  icon={getRoleIcon(effectiveRole)}
                  sx={{ 
                    textTransform: 'capitalize',
                    cursor: process.env.NODE_ENV === 'development' ? 'pointer' : 'default'
                  }}
                  onClick={process.env.NODE_ENV === 'development' ? handleRoleMenuOpen : undefined}
                />
              </Tooltip>
              
              {/* User Menu */}
              <Tooltip title="Account">
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={handleMenuOpen}
                  size="small"
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    {userInitial}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* User Menu Dropdown */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email || 'user@example.com'}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => navigate('/profile')}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
            
            {/* Notifications Menu */}
            <Menu
              anchorEl={notificationAnchor}
              open={Boolean(notificationAnchor)}
              onClose={handleNotificationClose}
              onClick={handleNotificationClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Notifications
                </Typography>
              </Box>
              <Divider />
              <MenuItem>
                <ListItemText primary="New request submitted" secondary="2 minutes ago" />
              </MenuItem>
              <MenuItem>
                <ListItemText primary="Request approved" secondary="1 hour ago" />
              </MenuItem>
              <MenuItem>
                <ListItemText primary="System update completed" secondary="1 day ago" />
              </MenuItem>
              <Divider />
              <MenuItem>
                <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center' }}>
                  View all notifications
                </Typography>
              </MenuItem>
            </Menu>
            
            {/* Role Switcher Menu (Dev Only) */}
            {process.env.NODE_ENV === 'development' && (
              <Menu
                anchorEl={roleMenuAnchor}
                open={Boolean(roleMenuAnchor)}
                onClose={handleRoleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Switch Role (Dev)
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => handleRoleChange(null)}>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Use Auth Role</ListItemText>
                </MenuItem>
                {ROLES.map((role) => (
                  <MenuItem key={role} onClick={() => handleRoleChange(role)}>
                    <ListItemIcon>
                      {getRoleIcon(role)}
                    </ListItemIcon>
                    <ListItemText sx={{ textTransform: 'capitalize' }}>
                      {role}
                    </ListItemText>
                    {devRoleContext?.role === role && (
                      <SwapHoriz fontSize="small" color="primary" />
                    )}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </Box>
        </Container>
        
        {/* Dynamic Submit Request Modal */}
        <SubmitRequestModal 
          open={submitRequestModalOpen} 
          onClose={() => setSubmitRequestModalOpen(false)} 
        />
      </Toolbar>
    </AppBar>
  );
};

export default ProfessionalAppBar;
