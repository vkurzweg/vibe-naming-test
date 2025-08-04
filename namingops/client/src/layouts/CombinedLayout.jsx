import React from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import { useDispatch, useSelector } from 'react-redux';
import { useEffectiveRole } from '../hooks/useEffectiveRole';
import {
  Box,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import { hideSnackbar } from '../features/ui/uiSlice';

// Dashboards
import SubmitterDashboard from '../pages/dashboards/SubmitterDashboard';
import ReviewerDashboard from '../pages/dashboards/ReviewerDashboard';
import AdminDashboard from '../pages/dashboards/AdminDashboard';



const CombinedLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  
  // Get effective role (includes dev override)
  const currentRole = useEffectiveRole() || 'submitter';
  const snackbar = useSelector((state) => state.ui?.snackbar || { open: false, message: '', severity: 'info' });

  // Handle snackbar close
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(hideSnackbar());
  };

  // Render the correct dashboard based on role
  const renderDashboard = () => {
    switch (currentRole) {
      case 'submitter':
        return <SubmitterDashboard />;
      case 'reviewer':
        return <ReviewerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        // Fallback for any unexpected roles
        return <SubmitterDashboard />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>

      
      <Box sx={{ display: 'flex', width: '100%' }}>
        <Box sx={{ width: isMobile ? '100%' : '300px', p: 2, borderRight: `1px solid ${theme.palette.divider}` }}>
          {renderDashboard()} 
        </Box>
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Outlet /> {/* Render nested routes here */}
        </Box>
      </Box>

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
