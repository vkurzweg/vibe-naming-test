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
import UnifiedContainer from '../components/UnifiedContainer'; // Import UnifiedContainer

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

  return (
    <Box sx={{ width: '100%' }}>
      <UnifiedContainer />
      
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
