import React from 'react';
import { Box, Container, Typography, Button, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';

// Mock data - replace with actual data from your API
const mockStats = [
  { label: 'Total Requests', value: 24, change: '+12%' },
  { label: 'In Review', value: 8, change: '+2' },
  { label: 'Approved', value: 14, change: '+5' },
  { label: 'Rejected', value: 2, change: '-1' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleNewRequest = () => {
    navigate('/submit-request');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.name || 'User'}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Here's what's happening with your naming requests.
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewRequest}
          sx={{ height: 'fit-content' }}
        >
          New Request
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {mockStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderRadius: 2,
                boxShadow: 1,
                '&:hover': {
                  boxShadow: 3,
                },
                transition: 'box-shadow 0.3s ease-in-out',
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {stat.label}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mr: 1 }}>
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  color={stat.change.startsWith('+') ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 'medium' }}
                >
                  {stat.change}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: 1,
          '&:hover': {
            boxShadow: 3,
          },
          transition: 'box-shadow 0.3s ease-in-out',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            Recent Activity
          </Typography>
          <Button color="primary" size="small">
            View All
          </Button>
        </Box>

        {/* Placeholder for activity feed */}
        <Box
          sx={{
            minHeight: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            p: 3,
          }}
        >
          <Typography>Activity feed will be displayed here</Typography>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              boxShadow: 1,
              '&:hover': {
                boxShadow: 3,
              },
              transition: 'box-shadow 0.3s ease-in-out',
            }}
          >
            <Typography variant="h6" component="h3" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/requests')}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                View All Requests
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/profile')}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                Update Profile
              </Button>
              {user?.role === 'admin' && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/users')}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Manage Users
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              boxShadow: 1,
              '&:hover': {
                boxShadow: 3,
              },
              transition: 'box-shadow 0.3s ease-in-out',
            }}
          >
            <Typography variant="h6" component="h3" gutterBottom>
              Getting Started
            </Typography>
            <Typography variant="body1" paragraph>
              Welcome to NamingOps! Here are some quick tips to get started:
            </Typography>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 8 }}>
                <Typography variant="body2">
                  Click "New Request" to submit a new naming request
                </Typography>
              </li>
              <li style={{ marginBottom: 8 }}>
                <Typography variant="body2">
                  Track the status of your requests in the "My Requests" section
                </Typography>
              </li>
              <li style={{ marginBottom: 8 }}>
                <Typography variant="body2">
                  Review pending requests if you're a reviewer or admin
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Update your profile with your preferences and contact information
                </Typography>
              </li>
            </ul>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
