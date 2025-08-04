import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid, 
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Link as RouterLink, 
  useLocation, 
  useNavigate 
} from 'react-router-dom';
import { 
  AddCircleOutline, 
  Description, 
  Archive, 
  TrendingUp,
  Schedule,
  CheckCircle,
  Refresh
} from '@mui/icons-material';
import { getMyRequests, selectFilteredRequests, selectIsLoading } from '../../features/requests/requestsSlice';

const SubmitterDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requests = useSelector(selectFilteredRequests);
  const loading = useSelector(selectIsLoading);

  useEffect(() => {
    dispatch(getMyRequests());
  }, [dispatch]);

  // Calculate status counts
  const statusCounts = requests.reduce((acc, request) => {
    acc[request.status] = (acc[request.status] || 0) + 1;
    return acc;
  }, {});

  const totalRequests = requests.length;
  const pendingRequests = (statusCounts.submitted || 0) + (statusCounts.under_review || 0) + (statusCounts.final_review || 0);
  const approvedRequests = statusCounts.approved || 0;

  const handleRefresh = () => {
    dispatch(getMyRequests());
  };

  return (
    <Box sx={{ p: 2, height: '100vh', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          My Dashboard
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Bento Grid Layout */}
      <Grid container spacing={3}>
        {/* Primary Action - Submit Request */}
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              height: 200, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-2px)' }
            }}
            onClick={() => navigate('/submit-request')}
          >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <AddCircleOutline sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Submit New Request
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, textAlign: 'center' }}>
                Start a new naming request with our dynamic form
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 200 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1 }} />
                Request Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Requests: {totalRequests}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0}
                  sx={{ mt: 1, mb: 2 }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  icon={<Schedule />} 
                  label={`${pendingRequests} Pending`} 
                  color="warning" 
                  size="small" 
                />
                <Chip 
                  icon={<CheckCircle />} 
                  label={`${approvedRequests} Approved`} 
                  color="success" 
                  size="small" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* My Requests - Primary Focus */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 300 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Description sx={{ mr: 1 }} />
                  My Recent Requests
                </Typography>
                <Button 
                  component={RouterLink} 
                  to="/my-requests" 
                  variant="outlined" 
                  size="small"
                >
                  View All
                </Button>
              </Box>
              
              {loading ? (
                <LinearProgress />
              ) : requests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No requests yet. Submit your first request!
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {requests.slice(0, 5).map((request) => (
                    <Box 
                      key={request._id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        py: 1, 
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => navigate(`/requests/${request._id}`)}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {request.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip 
                        label={request.status?.replace('_', ' ').toUpperCase()} 
                        size="small" 
                        color={request.status === 'approved' ? 'success' : 'warning'}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Archive Access */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: 300, 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-2px)' }
            }}
            onClick={() => navigate('/archive')}
          >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Archive sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
              <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                Browse Archive
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Search and browse approved naming requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SubmitterDashboard;
