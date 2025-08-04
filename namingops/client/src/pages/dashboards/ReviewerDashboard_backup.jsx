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
  Stack,
  Divider
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
  TrendingUp,
  Pending,
  Timeline,
  Speed
} from '@mui/icons-material';
import { fetchUserRequests, selectAllRequests, selectIsLoading } from '../../features/requests/requestsSlice';
import { format, parseISO } from 'date-fns';

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

  // Calculate comprehensive reviewer stats
  const stats = {
    total: requests.length,
    awaitingReview: requests.filter(r => ['submitted', 'under_review'].includes(r.status)).length,
    finalReview: requests.filter(r => r.status === 'final_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    urgent: requests.filter(r => r.priority === 'urgent').length,
    thisWeek: requests.filter(r => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(r.createdAt) > weekAgo;
    }).length
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
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Reviewer Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and manage naming requests
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Reviewer Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2">Total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.awaitingReview}
              </Typography>
              <Typography variant="body2">Awaiting Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.finalReview}
              </Typography>
              <Typography variant="body2">Final Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.approved}
              </Typography>
              <Typography variant="body2">Approved</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.rejected}
              </Typography>
              <Typography variant="body2">Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: 'orange', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.urgent}
              </Typography>
              <Typography variant="body2">Urgent</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.thisWeek}
              </Typography>
              <Typography variant="body2">This Week</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              filteredRequests.slice(0, 10).map((request) => (
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
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {request.title}
                          </Typography>
                          {request.priority === 'urgent' && (
                            <Chip icon={<Warning />} label="Urgent" color="error" size="small" />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            By: {request.user?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.createdAt ? format(parseISO(request.createdAt), 'MMM d, yyyy') : 'Unknown date'}
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
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
            {filteredRequests.length > 10 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  component={RouterLink} 
                  to="/review-queue" 
                  variant="text"
                >
                  View All {filteredRequests.length} Requests
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReviewerDashboard;
                    </Typography>
                  </Box>
                ) : (
                  filteredRequests.slice(0, 8).map((request) => (
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
                      <CardContent sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {request.title}
                              </Typography>
                              {request.priority === 'urgent' && (
                                <Chip icon={<Warning />} label="Urgent" color="error" size="small" />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                By: {request.user?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.createdAt ? format(parseISO(request.createdAt), 'MMM d, yyyy') : 'Unknown date'}
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
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                )}
                {filteredRequests.length > 8 && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button 
                      component={RouterLink} 
                      to="/review-queue" 
                      variant="text"
                    >
                      View All {filteredRequests.length} Requests
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewerDashboard;
