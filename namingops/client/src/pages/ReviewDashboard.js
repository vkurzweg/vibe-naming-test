import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ReviewRequests from '../features/review/ReviewRequests';

const ReviewDashboard = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Review Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" paragraph>
        Review and manage naming requests
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <ReviewRequests />
      </Paper>
    </Box>
  );
};

export default ReviewDashboard;
