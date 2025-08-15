import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffectiveRole } from '../hooks/useEffectiveRole';
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
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function AppBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Replace with your actual user selector
  const user = useSelector(state => state.auth.user);
  const effectiveRole = useEffectiveRole();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    handleMenuClose();
    navigate('/login');
  }, [dispatch, navigate]);

  const handleSwitchRole = useCallback(() => {
    dispatch(switchRole());
    handleMenuClose();
  }, [dispatch]);

  // Avatar fallback: initials or icon
  const getAvatarFallback = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return <AccountCircleIcon />;
  };

  return (
    <MuiAppBar
      position="static"
      elevation={0}
      sx={{
        background: 'transparent',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: (theme) => theme.palette.divider,
      }}
    >
      <Toolbar sx={{ minHeight: '3.5rem', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Logo or Title */}
        <Typography
          variant={isMobile ? "h6" : "h5"}
          sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '0.03em' }}
        >
          Naming HQ
        </Typography>
        {/* Role Chip (optional, remove if not needed) */}
        {effectiveRole && (
          <Chip
            label={effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)}
            color="primary"
            sx={{ mr: 2, fontWeight: 600, fontSize: '1rem', height: '2rem' }}
          />
        )}
        {/* Avatar and Menu */}
        <Box>
          <Tooltip title={user?.name || user?.email || 'Account'}>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar
                sx={{ width: '2.5rem', height: '2.5rem', bgcolor: 'grey.200' }}
                src={user?.picture || user?.photoURL || ''}
                alt={user?.name || user?.email || 'User'}
                imgProps={{ referrerPolicy: 'no-referrer' }}
              >
                {getAvatarFallback()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="subtitle2">{user?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSwitchRole}>
              <ListItemIcon>
                <SwapHorizIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Switch Role</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
}