import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  fetchUserRequests as fetchReviewQueue,
  updateRequest as updateRequestStatus,
  selectAllRequests,
  selectIsLoading,
  selectError
} from '../features/requests/requestsSlice';
import RequestTable from '../components/RequestTable'; // Import the new component
import { format } from 'date-fns';

// TabPanel component for the review queue tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`review-tabpanel-${index}`}
      aria-labelledby={`review-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `review-tab-${index}`,
    'aria-controls': `review-tabpanel-${index}`,
  };
}

const ReviewQueue = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const requests = useSelector(selectAllRequests);
  const loading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Load review queue on component mount and tab change
  useEffect(() => {
    // Pass the status filter to the thunk
    const status = tabValue === 0 ? 'pending' : undefined; // 'all' is represented by no status filter
    dispatch(fetchReviewQueue({ status }));
  }, [dispatch, tabValue]);

  // Handle status update
  const handleStatusUpdate = async (requestId, status, reason = '') => {
    try {
      await dispatch(updateRequestStatus({
        requestId,
        status,
        ...(reason && { rejectionReason: reason })
      })).unwrap();

      // Refresh the queue
      const statusToFetch = tabValue === 0 ? 'pending' : undefined;
      await dispatch(fetchReviewQueue({ status: statusToFetch }));

      // Close dialog if open
      if (rejectDialogOpen) {
        setRejectDialogOpen(false);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  // Open reject dialog
  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  // Close reject dialog
  const handleRejectDialogClose = () => {
    setRejectDialogOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  // Submit rejection
  const handleRejectSubmit = () => {
    if (selectedRequest && rejectionReason.trim()) {
      handleStatusUpdate(selectedRequest._id, 'rejected', rejectionReason);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status chip color
  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
        return <Chip label="Approved" color="success" size="small" variant="outlined" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" variant="outlined" />;
      case 'pending':
      default:
        return <Chip label="Pending" color="warning" size="small" variant="outlined" />;
    }
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
          Review Queue
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => dispatch(fetchReviewQueue({ status: tabValue === 0 ? 'pending' : undefined }))}
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

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Pending Review
                {requests.filter(req => req.status === 'pending').length > 0 && (
                  <Chip
                    label={requests.filter(req => req.status === 'pending').length}
                    size="small"
                    color="primary"
                    sx={{ minWidth: '24px', height: '20px' }}
                  />
                )}
              </Box>
            }
            {...a11yProps(0)}
          />
          <Tab label="All Requests" {...a11yProps(1)} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <RequestTable
            requests={requests.filter(req => req.status === 'pending')}
            onApprove={handleStatusUpdate}
            onReject={handleRejectClick}
            formatDate={formatDate}
            getStatusChip={getStatusChip}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <RequestTable
            requests={requests}
            onApprove={handleStatusUpdate}
            onReject={handleRejectClick}
            formatDate={formatDate}
            getStatusChip={getStatusChip}
          />
        </TabPanel>
      </Paper>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Naming Request</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting this request:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="rejection-reason"
            label="Reason for rejection"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectDialogClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleRejectSubmit}
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim()}
            startIcon={<RejectIcon />}
          >
            Reject Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewQueue;
