import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchActiveFormConfig, 
  clearFormConfigError 
} from '../features/admin/formConfigSlice';
import { createNamingRequest } from '../features/naming/namingSlice';
import { 
  setActiveView,
  showSnackbar,
  hideSnackbar
} from '../features/ui/uiSlice';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import {
  Box,
  Container,
  Typography,
  useTheme,
  useMediaQuery,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar,
  Alert,
  Button
} from '@mui/material';

// Icons
import {
  Add as AddIcon,
  Archive as ArchiveIcon,
  AdminPanelSettings as AdminIcon,
  RateReview as ReviewerIcon,
  Send as SubmitterIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Tune as TuneIcon
} from '@mui/icons-material';

// Features
import MyRequests from '../features/requests/MyRequests';
import SubmitRequest from '../pages/SubmitRequest';
import Archive from '../pages/Archive';
import FormConfigPage from '../pages/FormConfigPage';
import UsersPage from '../pages/UsersPage';
import ReviewQueue from '../pages/ReviewQueue';

const CombinedLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get state from Redux
  const { user } = useSelector((state) => state.auth);
  const currentRole = user?.role || 'submitter';
  const { activeFormConfig, loading: formConfigLoading } = useSelector((state) => state.formConfig || {});
  const snackbar = useSelector((state) => state.ui?.snackbar || { open: false, message: '', severity: 'info' });
  
  // Get the current view from the URL or default to 'my-requests'
  const getCurrentView = () => {
    const path = location.pathname.replace(/^\//, '');
    if (['my-requests', 'submit-request', 'review-queue', 'archive', 'admin'].includes(path)) {
      return path;
    }
    return 'my-requests';
  };

  const [currentView, setCurrentView] = useState(getCurrentView());
  
  // Update current view when URL changes
  useEffect(() => {
    setCurrentView(getCurrentView());
  }, [location.pathname]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    navigate(`/${newValue}`);
  };

  // Get available tabs based on user role
  const getAvailableTabs = () => {
    const tabs = [
      { value: 'my-requests', label: 'My Requests', roles: ['admin', 'submitter', 'reviewer'] },
      { value: 'submit-request', label: 'Submit Request', roles: ['admin', 'submitter'] },
      { value: 'review-queue', label: 'Review Queue', roles: ['admin', 'reviewer'] },
      { value: 'archive', label: 'Archive', roles: ['admin', 'reviewer', 'submitter'] },
    ];
    
    if (currentRole === 'admin') {
      tabs.push(
        { value: 'admin/form-config', label: 'Form Config', roles: ['admin'] },
        { value: 'admin/users', label: 'User Management', roles: ['admin'] }
      );
    }
    
    return tabs.filter(tab => tab.roles.includes(currentRole));
  };

  // Render the current view
  const renderView = () => {
    switch (currentView) {
      case 'my-requests':
        return <MyRequests />;
      case 'submit-request':
        return <SubmitRequest />;
      case 'review-queue':
        return <ReviewQueue />;
      case 'archive':
        return <Archive />;
      case 'admin/form-config':
        return <FormConfigPage />;
      case 'admin/users':
        return <UsersPage />;
      default:
        return <MyRequests />;
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(hideSnackbar());
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Main Content */}
      <Box sx={{ width: '100%', p: isMobile ? 1 : 3 }}>
        {/* Tabs for navigation */}
        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <Tabs
            value={currentView}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
              },
            }}
          >
            {getAvailableTabs().map((tab) => (
              <Tab 
                key={tab.value} 
                value={tab.value} 
                label={tab.label} 
                sx={{
                  minHeight: 64,
                  '&.Mui-selected': {
                    color: 'primary.main',
                    fontWeight: 600,
                  },
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* View Content */}
        <Box sx={{ mt: 2 }}>
          {formConfigLoading && currentView === 'submit-request' ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            renderView()
          )}
        </Box>
      </Box>

      {/* Global Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CombinedLayout;
