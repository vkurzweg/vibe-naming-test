import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Grid,
} from '@mui/material';
import {
  AccountCircle,
  Settings,
  Logout,
  Notifications,
} from '@mui/icons-material';
import { logout } from '../../features/auth/authSlice';
import { useEffectiveRole } from '../../hooks/useEffectiveRole';
import { DevRoleContext } from '../../context/DevRoleContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import SubmitRequestModal from '../Requests/SubmitRequestModal';
import { ThemeContext } from '../ThemeIntegration/EnhancedThemeProvider';
import { Container } from 'react-bootstrap';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';

const ProfessionalAppBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const effectiveRole = useEffectiveRole();
  const devRoleContext = useContext(DevRoleContext);
  const { isDarkMode } = useContext(ThemeContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [submitRequestModalOpen, setSubmitRequestModalOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleRoleChange = (role) => {
    if (devRoleContext?.setRole) {
      devRoleContext.setRole(role);
    }
    handleMenuClose();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#8c6bc7';
      case 'reviewer':
        return '#41c7cb';
      case 'submitter':
        return '#6EB4FF';
      default:
        return 'default';
    }
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';
  const isDevOrDemo = process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true';
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        // background: isDarkMode 
        //   ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        //   : 'transparent',
        background: 'transparent',
        border: 'none',
        // borderBottom: isDarkMode 
        //   ? '1px solid rgba(255, 255, 255, 0.1)'
        //   : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 0,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: isDarkMode ? 'inherit' : '#1a1a1a',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Container>
        <Toolbar 
          disableGutters 
          sx={{ 
            minHeight: '4rem',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <Grid container alignItems="center" spacing={2} sx={{ width: '100%' }}>
            {/* Logo */}
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src={isDarkMode ? "/cog_logo_darkmode.png" : "/cog_logo_lightmode.png"}
                  alt="Company Logo"
                  style={{ 
                    height: '2.8rem',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            </Grid>

            {/* Spacer for center alignment if needed */}
            <Grid item xs={false} sm={4} md={6} lg={8} />

            {/* Right side controls */}
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                {/* Theme Toggle with improved visibility */}
                <ThemeToggle 
                  sx={{ 
                    color: getRoleColor(effectiveRole),
                    padding: '0.5rem',
                    fontSize: '1.25rem',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  }} 
                />
                
                {/* User Menu */}
                <Tooltip title="Account">
                  <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleMenuOpen}
                    sx={{ 
                      padding: '0',
                      height: '2rem',
                      width: '2rem',
                      fontSize: '1.25rem',
                      marginRight: 0
                    }}
                    className="user-avatar"
                  >
                    <EmojiPeopleIcon
                      sx={{
                        width: '2rem',
                        height: '2rem',
                        color: getRoleColor(effectiveRole),
                        transition: 'color 0.2s',
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Toolbar>
          
        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
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

          {/* Role Switching Section - Only in Development */}
          {isDevOrDemo && (
            <>
              <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary' }}>
                Switch Role (Development Only)
              </Typography>
              
              <MenuItem 
                selected={effectiveRole === 'submitter'}
                onClick={() => handleRoleChange('submitter')}
              >
                <ListItemIcon>
                  <Box 
                    component="span" 
                    sx={{ 
                      width: '1rem', 
                      height: '1rem', 
                      borderRadius: '50%', 
                      bgcolor: '#2f79c3',
                      display: 'inline-block'
                    }} 
                  />
                </ListItemIcon>
                <ListItemText>Associate</ListItemText>
              </MenuItem>
              
              <MenuItem 
                selected={effectiveRole === 'reviewer'}
                onClick={() => handleRoleChange('reviewer')}
              >
                <ListItemIcon>
                  <Box 
                    component="span" 
                    sx={{ 
                      width: '1rem', 
                      height: '1rem', 
                      borderRadius: '50%', 
                      bgcolor: '#41c7cb',
                      display: 'inline-block'
                    }} 
                  />
                </ListItemIcon>
                <ListItemText>Reviewer</ListItemText>
              </MenuItem>
              
              <MenuItem 
                selected={effectiveRole === 'admin'}
                onClick={() => handleRoleChange('admin')}
              >
                <ListItemIcon>
                  <Box 
                    component="span" 
                    sx={{ 
                      width: '1rem', 
                      height: '1rem', 
                      borderRadius: '50%', 
                      bgcolor: '#8c6bc7',
                      display: 'inline-block'
                    }} 
                  />
                </ListItemIcon>
                <ListItemText>Admin</ListItemText>
              </MenuItem>
              
              <Divider />
            </>
          )}
          
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
          <MenuItem 
            onClick={!isDevOrDemo ? handleLogout : undefined}
            disabled={isDevOrDemo}
            sx={{
              opacity: isDevOrDemo ? 0.5 : 1,
              pointerEvents: isDevOrDemo ? 'none' : 'auto'
            }}
          >
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
        
        {/* Dynamic Submit Request Modal */}
        <SubmitRequestModal 
          open={submitRequestModalOpen} 
          onClose={() => setSubmitRequestModalOpen(false)} 
        />
      </Container>
    </AppBar>
  );
};

export default ProfessionalAppBar;
