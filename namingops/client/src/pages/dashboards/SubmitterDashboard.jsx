import React, { useEffect, useState } from 'react';
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
  Stack
} from '@mui/material';
import {
  AddCircleOutline,
  Description,
  Archive
} from '@mui/icons-material';
import { getMyRequests, selectFilteredRequests, selectIsLoading } from '../../features/requests/requestsSlice';
import { format, parseISO } from 'date-fns';

const SubmitterDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requests = useSelector(selectFilteredRequests);
  const loading = useSelector(selectIsLoading);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(getMyRequests());
  }, [dispatch]);

  const filteredRequests = requests.filter(request => request && request.title);

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'info';
      case 'under_review': return 'warning';
      case 'final_review': return 'secondary';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'auto', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
          My Requests
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutline />}
          component={RouterLink}
          to="/submit-request"
          sx={{ mb: 4 }}
        >
          Submit a New Request
        </Button>
      </Box>

      {/* Requests List */}
      <Grid container spacing={4}>
        {loading ? (
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', width: '100%' }}>
            Loading requests...
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
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default SubmitterDashboard;
