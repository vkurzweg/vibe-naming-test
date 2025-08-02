import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';

const AdminDashboardOverview = () => {
  // Get all requests from Redux to calculate stats
  const allRequests = useSelector((state) => state.requests.requests);

  // Memoize derived state to prevent unnecessary recalculations
  const stats = useMemo(() => {
    return {
      totalRequests: allRequests.length,
      pendingRequests: allRequests.filter((r) => r.status === 'pending').length,
      approvedRequests: allRequests.filter((r) => r.status === 'approved').length,
      rejectedRequests: allRequests.filter((r) => r.status === 'rejected').length,
    };
  }, [allRequests]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Overview
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Manage form configurations, user permissions, and view overall request statistics.
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Requests</Typography>
              <Typography variant="h4">{stats.totalRequests}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending</Typography>
              <Typography variant="h4" color="primary">
                {stats.pendingRequests}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Approved</Typography>
              <Typography variant="h4" color="success.main">
                {stats.approvedRequests}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          component={RouterLink} 
          to="/admin/form-config" 
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
        <Button
          component={RouterLink}
          to="/archive"
          variant="outlined"
          startIcon={<SearchIcon />}
        >
          Approved Names Archive
        </Button>
        <Button
          component="a"
          href="/brand-guidelines"
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          startIcon={<InfoIcon />}
        >
          Naming Guidelines
        </Button>
      </Box>
    </Container>
  );
};

export default AdminDashboardOverview;
