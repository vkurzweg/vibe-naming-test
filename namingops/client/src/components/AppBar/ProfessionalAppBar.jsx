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
import NewRequestModal from '../Requests/NewRequestModal';

const ProfessionalAppBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const effectiveRole = useEffectiveRole();
  const devRoleContext = useContext(DevRoleContext);
  const isDev = process.env.NODE_ENV === 'development';
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRoleMenuOpen = (event) => {
    if (isDev) {
      setRoleMenuAnchor(event.currentTarget);
    }
  };

  const handleRoleMenuClose = () => {
    setRoleMenuAnchor(null);
  };

  const handleRoleChange = (newRole) => {
    if (devRoleContext?.setRole) {
      devRoleContext.setRole(newRole);
    }
    setRoleMenuAnchor(null);
  };

  const ROLES = ['submitter', 'reviewer', 'admin'];

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate('/login');
  };

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
    <AppBar position="sticky" elevation={2}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left side - Logo and Navigation */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 700,
              cursor: 'pointer',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            onClick={() => navigate('/')}
          >
            NamingHQ
          </Typography>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          {/* Quick Navigation */}
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              color="inherit"
              startIcon={<Dashboard />}
              onClick={() => navigate('/')}
              sx={{ textTransform: 'none' }}
            >
              Dashboard
            </Button>
            
            {(effectiveRole === 'submitter' || effectiveRole === 'reviewer' || effectiveRole === 'admin') && (
              <Button
                color="inherit"
                startIcon={<AddIcon />}
                onClick={() => setNewRequestModalOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                New Request
              </Button>
            )}
            
            {(effectiveRole === 'admin') && (
              <Button
                color="inherit"
                startIcon={<People />}
                onClick={() => navigate('/admin/users')}
                sx={{ textTransform: 'none' }}
              >
                Users
              </Button>
            )}
          </Box>
        </Box>

        {/* Right side - User controls */}
        <Box display="flex" alignItems="center" gap={1}>
          {/* Role Indicator */}
          <Tooltip title={isDev ? "Click to switch role (Dev Mode)" : `Current role: ${effectiveRole}`}>
            <Chip
              icon={getRoleIcon(effectiveRole)}
              label={effectiveRole?.charAt(0).toUpperCase() + effectiveRole?.slice(1)}
              color={getRoleColor(effectiveRole)}
              variant="outlined"
              size="small"
              onClick={isDev ? handleRoleMenuOpen : undefined}
              sx={{ 
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: isDev ? 'pointer' : 'default',
                '&:hover': isDev ? {
                  backgroundColor: 'action.hover',
                } : {},
              }}
            />
          </Tooltip>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleNotificationOpen}
            >
              <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {userInitial}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 8,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 220,
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
          {/* User Info */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'No email'}
            </Typography>
            <Chip
              icon={getRoleIcon(effectiveRole)}
              label={effectiveRole}
              color={getRoleColor(effectiveRole)}
              size="small"
              sx={{ mt: 1, textTransform: 'capitalize' }}
            />
          </Box>
          
          <Divider />
          
          {/* Menu Items */}
          <MenuItem onClick={() => navigate('/')}>
            <ListItemIcon>
              <Dashboard fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
          
          {effectiveRole === 'admin' && (
            <MenuItem onClick={() => navigate('/admin/users')}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Admin Settings</ListItemText>
            </MenuItem>
          )}
          
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
          PaperProps={{
            elevation: 8,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 300,
              maxWidth: 400,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </Box>
        </Menu>

        {/* Development Role Switching Menu */}
        {isDev && (
          <Menu
            anchorEl={roleMenuAnchor}
            open={Boolean(roleMenuAnchor)}
            onClose={handleRoleMenuClose}
            PaperProps={{
              elevation: 8,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                minWidth: 180,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
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
      </Toolbar>
      
      {/* Dynamic New Request Modal */}
      <NewRequestModal 
        open={newRequestModalOpen} 
        onClose={() => setNewRequestModalOpen(false)} 
      />
    </AppBar>
  );
};

export default ProfessionalAppBar;
