import React from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useSelector } from 'react-redux';
import AdminDashboard from './AdminDashboard';
import ReviewDashboard from './ReviewDashboard';
import SubmitterDashboard from './SubmitterDashboard';

const Dashboard = () => {
  const { user, loading, error } = useSelector((state) => state.auth);

  if (loading || !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Error loading dashboard: {error}</Alert>
      </Box>
    );
  }

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'reviewer':
        return <ReviewDashboard />;
      case 'submitter':
        return <SubmitterDashboard />;
      default:
        return (
          <Box p={3}>
            <Alert severity="warning">
              No dashboard available for your current role. Please contact an administrator.
            </Alert>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {renderDashboard()}
    </Box>
  );
};

export default Dashboard;
