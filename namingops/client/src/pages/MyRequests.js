import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  getMyRequests,
  selectFilteredRequests,
  selectIsLoading,
  selectError
} from '../features/requests/requestsSlice';
import RequestTable from '../components/RequestTable';

const MyRequests = () => {
  const dispatch = useDispatch();
  const requests = useSelector(selectFilteredRequests);
  const loading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  // Load my requests on component mount
  useEffect(() => {
    dispatch(getMyRequests());
  }, [dispatch]);

  // Handle refresh
  const handleRefresh = () => {
    dispatch(getMyRequests());
  };

  if (loading && !requests.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          My Requests
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {typeof error === 'string' ? error : error.message || 'An error occurred'}
        </Alert>
      )}

      <RequestTable 
        requests={requests} 
        showActions={false} // My requests don't need approve/reject actions
      />
    </Box>
  );
};

export default MyRequests;
