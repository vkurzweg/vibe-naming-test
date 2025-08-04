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
  Badge
} from '@mui/material';
import { 
  Link as RouterLink, 
  useNavigate 
} from 'react-router-dom';
import { 
  RateReview, 
  Search, 
  FilterList, 
  Assignment,
  Schedule,
  CheckCircle,
  Warning,
  Refresh,
  TrendingUp
} from '@mui/icons-material';
import { fetchUserRequests, selectAllRequests, selectIsLoading } from '../../features/requests/requestsSlice';

const ReviewerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requests = useSelector(selectAllRequests);
  const loading = useSelector(selectIsLoading);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(0); // 0: All, 1: New, 2: In Review, 3: Final Review

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
      default: // All active (not approved/canceled)
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

  // Calculate status counts
  const statusCounts = {
    new: requests.filter(r => r.status === 'submitted').length,
    inReview: requests.filter(r => r.status === 'under_review').length,
    finalReview: requests.filter(r => r.status === 'final_review').length,
    urgent: requests.filter(r => r.priority === 'urgent').length
  };

  const handleRefresh = () => {
    dispatch(fetchUserRequests());
  };

  const handleStatusFilterChange = (event, newValue) => {
    setStatusFilter(newValue);
  };

  return (
    <Box sx={{ p: 2, height: '100vh', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Review Dashboard
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {statusCounts.new}
              </Typography>
              <Typography variant="body2">New Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {statusCounts.inReview}
              </Typography>
              <Typography variant="body2">In Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {statusCounts.finalReview}
              </Typography>
              <Typography variant="body2">Final Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {statusCounts.urgent}
              </Typography>
              <Typography variant="body2">Urgent</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Request Management Section */}
      <Card sx={{ height: 'calc(100vh - 300px)' }}>
        <CardContent>
          {/* Search and Filter Controls */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flexGrow: 1 }}
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
          </Box>

          {/* Status Filter Tabs */}
          <Tabs value={statusFilter} onChange={handleStatusFilterChange} sx={{ mb: 2 }}>
            <Tab 
              label={<Badge badgeContent={filteredRequests.length} color="primary">All Active</Badge>} 
            />
            <Tab 
              label={<Badge badgeContent={statusCounts.new} color="info">New</Badge>} 
            />
            <Tab 
              label={<Badge badgeContent={statusCounts.inReview} color="warning">In Review</Badge>} 
            />
            <Tab 
              label={<Badge badgeContent={statusCounts.finalReview} color="secondary">Final Review</Badge>} 
            />
          </Tabs>

          {/* Request List */}
          <Box sx={{ height: 'calc(100% - 120px)', overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>Loading requests...</Typography>
              </Box>
            ) : filteredRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No requests found matching your criteria
                </Typography>
              </Box>
            ) : (
              filteredRequests.map((request) => (
                <Card 
                  key={request._id} 
                  sx={{ 
                    mb: 1, 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      transform: 'translateX(4px)',
                      boxShadow: 2
                    }
                  }}
                  onClick={() => navigate(`/requests/${request._id}`)}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {request.title}
                          </Typography>
                          {request.priority === 'urgent' && (
                            <Chip icon={<Warning />} label="Urgent" color="error" size="small" />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            By: {request.user?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={request.status?.replace('_', ' ').toUpperCase()} 
                          size="small" 
                          color={
                            request.status === 'submitted' ? 'info' :
                            request.status === 'under_review' ? 'warning' :
                            request.status === 'final_review' ? 'secondary' : 'default'
                          }
                        />
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* Handle assign */ }}>
                          <Assignment />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReviewerDashboard;
