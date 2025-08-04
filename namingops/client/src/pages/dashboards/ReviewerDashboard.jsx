import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Stack,
  Alert,
  Badge
} from '@mui/material';
import {
  RateReview,
  Assignment,
  CheckCircle,
  TrendingUp,
  Notifications,
  Speed
} from '@mui/icons-material';
import { fetchUserRequests, selectAllRequests, selectIsLoading } from '../../features/requests/requestsSlice';
import { format, parseISO } from 'date-fns';

const ReviewerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requests = useSelector(selectAllRequests);
  useEffect(() => {
    dispatch(fetchUserRequests());
  }, [dispatch]);

  const filteredRequests = requests.filter(request => request && request.title);

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'info';
      case 'under_review':
        return 'warning';
      case 'final_review':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'auto', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
          Active Requests
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          Quick filtering, sorting, and assignment of active requests.
        </Typography>
      </Box>

      {/* Requests List */}
      <Grid container spacing={4}>
        {requests.length === 0 ? (
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', width: '100%' }}>
            No active requests.
          </Typography>
        ) : (
          filteredRequests.map((request) => (
            <Grid item xs={12} md={6} lg={4} key={request._id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                    {request.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {format(parseISO(request.createdAt), 'MMM dd, yyyy')}
                  </Typography>
                  <Chip
                    label={request.status?.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(request.status)}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {typeof request.description === 'object' ? request.description?.text || 'No description available' : request.description || 'No description available'}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Assignment />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate(`/requests/${request._id}`)}
                  >
                    Assign Request
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default ReviewerDashboard;
