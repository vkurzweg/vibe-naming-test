import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid, 
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
  Divider,
  Stack,
  Paper,
  LinearProgress
} from '@mui/material';
import { 
  Link as RouterLink, 
  useNavigate 
} from 'react-router-dom';
import { 
  RateReview, 
  Search, 
  Settings, 
  People,
  Assignment,
  Schedule,
  CheckCircle,
  Warning,
  Refresh,
  TrendingUp,
  Dashboard,
  Build,
  Speed,
  Analytics
} from '@mui/icons-material';
import { fetchUserRequests, selectAllRequests, selectIsLoading } from '../../features/requests/requestsSlice';
import { format, parseISO } from 'date-fns';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requests = useSelector(selectAllRequests);
  const loading = useSelector(selectIsLoading);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(0);

  useEffect(() => {
    dispatch(fetchUserRequests());
  }, [dispatch]);

  // Filter requests based on status
  const getFilteredRequests = () => {
    let filtered = requests;
    
    // Apply status filter
    switch (statusFilter) {
      case 1: // New
        filtered = filtered.filter(r => r.status === 'submitted');
        break;
      case 2: // In Review
        filtered = filtered.filter(r => r.status === 'under_review');
        break;
      case 3: // Final Review
        filtered = filtered.filter(r => r.status === 'final_review');
        break;
      default: // All active
        filtered = filtered.filter(r => !['approved', 'canceled'].includes(r.status));
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredRequests = getFilteredRequests();

  // Calculate comprehensive stats
  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'submitted').length,
    inReview: requests.filter(r => r.status === 'under_review').length,
    finalReview: requests.filter(r => r.status === 'final_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    urgent: requests.filter(r => r.priority === 'urgent').length,
    onHold: requests.filter(r => r.status === 'on_hold').length
  };

  const handleRefresh = () => {
    dispatch(fetchUserRequests());
  };

  const handleStatusFilterChange = (event, newValue) => {
    setStatusFilter(newValue);
  };

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'auto', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            System Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive request management and system administration
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            component={RouterLink}
            to="/admin/form-config"
            variant="outlined"
            startIcon={<Settings />}
          >
            Form Config
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={loading} sx={{ bgcolor: 'white' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 200 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Analytics sx={{ mr: 1 }} />
                Request Pipeline
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.total} total requests
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {stats.new}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">New</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.total > 0 ? (stats.new / stats.total) * 100 : 0} 
                    sx={{ mt: 1, bgcolor: 'info.light' }}
                    color="info"
                  />
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {stats.inReview}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">In Review</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.total > 0 ? (stats.inReview / stats.total) * 100 : 0} 
                    sx={{ mt: 1, bgcolor: 'warning.light' }}
                    color="warning"
                  />
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    {stats.finalReview}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Final Review</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.total > 0 ? (stats.finalReview / stats.total) * 100 : 0} 
                    sx={{ mt: 1, bgcolor: 'secondary.light' }}
                    color="secondary"
                  />
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {stats.approved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Approved</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.total > 0 ? (stats.approved / stats.total) * 100 : 0} 
                    sx={{ mt: 1, bgcolor: 'success.light' }}
                    color="success"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 200 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
              <Speed sx={{ mr: 1 }} />
              Priority Actions
            </Typography>
            <Stack spacing={2}>
              {stats.urgent > 0 && (
                <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.dark' }}>
                    {stats.urgent} Urgent Requests
                  </Typography>
                  <Typography variant="body2" color="error.dark">
                    Require immediate attention
                  </Typography>
                </Box>
              )}
              <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                  {stats.new + stats.inReview} Active Reviews
                </Typography>
                <Typography variant="body2" color="warning.dark">
                  Pending reviewer assignment
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Workflow Area */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Request Management Workflow
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              component={RouterLink}
              to="/review-queue"
              variant="contained"
              startIcon={<RateReview />}
            >
              Full Queue
            </Button>
          </Stack>
        </Box>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onChange={handleStatusFilterChange} sx={{ mb: 3 }}>
          <Tab 
            label={<Badge badgeContent={filteredRequests.length} color="primary">All Active</Badge>} 
          />
          <Tab 
            label={<Badge badgeContent={stats.new} color="info">New Submissions</Badge>} 
          />
          <Tab 
            label={<Badge badgeContent={stats.inReview} color="warning">In Review</Badge>} 
          />
          <Tab 
            label={<Badge badgeContent={stats.finalReview} color="secondary">Final Review</Badge>} 
          />
        </Tabs>

        {/* Integrated Request List */}
        <Box sx={{ height: 'calc(100vh - 400px)', overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Typography>Loading requests...</Typography>
            </Box>
          ) : filteredRequests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No requests found
              </Typography>
              <Typography color="text.secondary">
                {searchQuery ? 'Try adjusting your search criteria' : 'All requests are up to date'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredRequests.map((request) => (
                <Grid item xs={12} md={6} lg={4} key={request._id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      height: '100%',
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => navigate(`/requests/${request._id}`)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1, mr: 1 }}>
                          {request.title}
                        </Typography>
                        <Chip 
                          label={request.status?.replace('_', ' ').toUpperCase()} 
                          size="small" 
                          color={
                            request.status === 'submitted' ? 'info' :
                            request.status === 'under_review' ? 'warning' :
                            request.status === 'final_review' ? 'secondary' : 'default'
                          }
                        />
                      </Box>
                      
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Submitted by: {request.user?.name || 'Unknown'}
                          </Typography>
                          {request.priority === 'urgent' && (
                            <Chip icon={<Warning />} label="Urgent" color="error" size="small" />
                          )}
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary">
                          {request.createdAt ? format(parseISO(request.createdAt), 'MMM d, yyyy \u2022 h:mm a') : 'Unknown date'}
                        </Typography>
                        
                        {request.assignedReviewer && (
                          <Typography variant="caption" color="text.secondary">
                            Assigned to: {request.assignedReviewer.name}
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
