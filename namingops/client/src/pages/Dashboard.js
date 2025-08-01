import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Container,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { login, updateUser } from '../features/auth/authSlice';
import { fetchActiveFormConfig } from '../features/admin/formConfigSlice';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';

const DebugUserInfo = () => {
  const { user } = useSelector((state) => state.auth);
  const localStorageUser = localStorage.getItem('user');
  const localStorageToken = localStorage.getItem('token');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>Debug Info (Development Only)</Typography>
      <Typography variant="body2">
        <strong>Redux User:</strong> {JSON.stringify(user, null, 2)}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>LocalStorage User:</strong> {localStorageUser || 'Not found'}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>Token:</strong> {localStorageToken ? 'Token exists' : 'No token found'}
      </Typography>
    </Box>
  );
};

// Role configuration with colors
const roleConfig = {
  admin: { 
    label: 'Admin', 
    color: 'error',
    lightColor: 'rgba(239, 83, 80, 0.1)',
  },
  reviewer: { 
    label: 'Reviewer', 
    color: 'info',
    lightColor: 'rgba(41, 182, 246, 0.1)',
  },
  submitter: { 
    label: 'Submitter', 
    color: 'success',
    lightColor: 'rgba(76, 175, 80, 0.1)',
  },
};

const getRoleConfig = (role) => roleConfig[role] || { 
  label: role, 
  color: 'default',
  lightColor: 'rgba(0, 0, 0, 0.05)'
};

const Dashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Get user and requests data from Redux
  const { user: currentUser, loading, error } = useSelector((state) => ({
    user: state.auth.user,
    loading: state.requests.loading,
    error: state.requests.error
  }));
  
  // Get all requests from Redux
  const allRequests = useSelector((state) => state.requests.requests);
  
  // Calculate current role - this will update whenever currentUser changes
  const currentRole = currentUser?.role || 'submitter';
  
  // Memoize derived state to prevent unnecessary recalculations
  const { userRequests, reviewRequests, stats } = useMemo(() => {
    return {
      userRequests: allRequests.filter(
        (request) => request.userId === currentUser?.id && request.status === 'pending'
      ),
      reviewRequests: currentRole === 'reviewer' 
        ? allRequests.filter((request) => request.status === 'pending')
        : [],
      stats: {
        totalRequests: allRequests.length,
        pendingRequests: allRequests.filter((r) => r.status === 'pending').length,
        approvedRequests: allRequests.filter((r) => r.status === 'approved').length,
        rejectedRequests: allRequests.filter((r) => r.status === 'rejected').length,
      }
    };
  }, [allRequests, currentUser?.id, currentRole]);
  
  // In development, handle role changes by updating Redux directly
  const handleRoleChange = useCallback((newRole) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const updatedUser = {
      ...currentUser,
      role: newRole,
      name: `Dev ${newRole.charAt(0).toUpperCase() + newRole.slice(1)}`,
      email: `${newRole}@example.com`,
      _isDev: true
    };
    
    // Update Redux store
    dispatch(login(updatedUser));
    
    // Persist to localStorage for page refreshes
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Force a re-render of all components
    window.dispatchEvent(new Event('storage'));
    
    console.log('Role changed to:', newRole);
  }, [currentUser, dispatch]);
  
  // Apply role-based background color to the dashboard
  useEffect(() => {
    if (!currentUser?.role) return;
    
    const config = getRoleConfig(currentUser.role);
    document.body.style.backgroundColor = config.lightColor;
    document.documentElement.style.setProperty('--role-bg-color', config.lightColor);
    document.documentElement.style.setProperty('--role-color', theme.palette[config.color]?.main || '#000');
    
    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.removeProperty('--role-bg-color');
      document.documentElement.style.removeProperty('--role-color');
    };
  }, [currentUser?.role, theme]);
  
  // In development, ensure we have a user
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !currentUser) {
      // Initialize with dev user if not already set
      const devUser = {
        id: 'dev-user-123',
        name: 'Dev User',
        email: 'dev@example.com',
        role: 'admin',
        token: 'dev-token-123',
        _isDev: true
      };
      
      // Initialize Redux state with dev user
      dispatch(login(devUser));
      localStorage.setItem('user', JSON.stringify(devUser));
    }
  }, [dispatch, currentUser]);

  console.log('Dashboard - Current user:', { user: currentUser, role: currentRole });

  if (process.env.NODE_ENV !== 'development' && (loading || !currentUser)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (process.env.NODE_ENV !== 'development' && error) {
    return (
      <Box p={3}>
        <Alert severity="error">Error loading dashboard: {error}</Alert>
      </Box>
    );
  }

  // Helper to get user data from nested structure if needed
  const getUserData = (userObj) => {
    if (!userObj) return null;
    // If user data is nested under a 'user' property, use that
    if (userObj.user && typeof userObj.user === 'object') {
      return userObj.user;
    }
    return userObj;
  };

  // Helper to get role from user object
  const getUserRole = (userData) => {
    if (!userData) return null;
    // Check both direct and nested role
    return userData.role || (userData.user && userData.user.role) || null;
  };

  // Common dashboard header
  const renderHeader = (title, description) => (
    <Box mb={4}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );

  // Render admin dashboard
  const renderAdminDashboard = () => (
    <Container maxWidth="lg">
      {renderHeader(
        'Admin Dashboard',
        'Manage form configurations and user permissions'
      )}
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Requests</Typography>
              <Typography variant="h4">{stats.totalRequests}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending</Typography>
              <Typography variant="h4" color="primary">
                {stats.pendingRequests}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Approved</Typography>
              <Typography variant="h4" color="success.main">
                {stats.approvedRequests}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Rejected</Typography>
              <Typography variant="h4" color="error.main">
                {stats.rejectedRequests}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
        <Button 
          component={RouterLink} 
          to="/admin/forms" 
          variant="contained" 
          color="primary"
          startIcon={<SettingsIcon />}
        >
          Form Configuration
        </Button>
        <Button 
          component={RouterLink} 
          to="/admin/users" 
          variant="outlined"
          startIcon={<PeopleIcon />}
        >
          User Management
        </Button>
      </Box>
    </Container>
  );

  // Render reviewer dashboard
  const renderReviewerDashboard = () => (
    <Container maxWidth="lg">
      {renderHeader(
        'Review Dashboard',
        'Review and approve pending naming requests'
      )}

      {reviewRequests.length > 0 ? (
        <Grid container spacing={3}>
          {reviewRequests.map((request) => (
            <Grid item xs={12} key={request.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{request.name}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Submitted by: {request.submittedBy} on {format(new Date(request.createdAt), 'PPpp')}
                  </Typography>
                  <Typography paragraph>{request.description}</Typography>
                  <Button 
                    component={RouterLink} 
                    to={`/requests/${request.id}`}
                    variant="outlined"
                    color="primary"
                    size="small"
                  >
                    Review Request
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No pending requests to review</Typography>
        </Paper>
      )}
    </Container>
  );

  // Role switcher component
  const RoleSwitcher = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleRoleSelect = (role) => {
      if (process.env.NODE_ENV === 'development') {
        handleRoleChange(role);
      } else {
        // In production, this would make an API call to update the role
        const newUser = {
          ...currentUser,
          role,
          name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
          email: `${role}@example.com`
        };
        dispatch(updateUser(newUser));
      }
      setAnchorEl(null);
    };

    return (
      <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>Development Tools</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            Switch Role (Current: {currentRole || 'none'})
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => handleRoleSelect('admin')}>Admin</MenuItem>
            <MenuItem onClick={() => handleRoleSelect('reviewer')}>Reviewer</MenuItem>
            <MenuItem onClick={() => handleRoleSelect('submitter')}>Submitter</MenuItem>
          </Menu>
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Box>
      </Box>
    );
  };

  // Render submitter dashboard
  const renderSubmitterDashboard = () => (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>New Naming Request</Typography>
              <Typography paragraph>Submit a new naming request for review.</Typography>
              <Button 
                component={RouterLink} 
                to="/submit-request" 
                variant="contained" 
                color="primary"
                startIcon={<AddIcon />}
              >
                New Request
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>My Pending Requests</Typography>
              {userRequests.length > 0 ? (
                <Box>
                  {userRequests.slice(0, 3).map((request) => (
                    <Box key={request.id} mb={2} pb={2} borderBottom="1px solid #eee">
                      <Typography variant="subtitle1">{request.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Submitted on {format(new Date(request.createdAt), 'PP')}
                      </Typography>
                    </Box>
                  ))}
                  {userRequests.length > 3 && (
                    <Button 
                      component={RouterLink} 
                      to="/my-requests" 
                      size="small" 
                      sx={{ mt: 1 }}
                    >
                      View All ({userRequests.length})
                    </Button>
                  )}
                </Box>
              ) : (
                <Typography>No pending requests</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );

  // Main render function
  const renderDashboard = () => {
    if (!currentUser || !currentRole) {
      console.error('No user role found:', { user: currentUser, currentRole });
      return (
        <Box p={3}>
          <Alert severity="error">
            User role not found. Please log in again.
          </Alert>
        </Box>
      );
    }

    const role = currentRole.toLowerCase();
    console.log('Rendering dashboard for role:', role, 'User:', currentUser);
    
    switch (role) {
      case 'admin':
        return renderAdminDashboard();
      case 'reviewer':
        return renderReviewerDashboard();
      case 'submitter':
        return renderSubmitterDashboard();
      default:
        console.warn('Unknown role:', role, 'User data:', currentUser);
        return (
          <Box p={3}>
            <Alert severity="warning">
              No dashboard available for role: {role}. Please contact an administrator.
            </Alert>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      {renderDashboard()}
    </Box>
  );
};

export default Dashboard;
