import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { useEffectiveRole } from '../../hooks/useEffectiveRole';

const RequestDetailsModal = ({ open, onClose, requestId }) => {
  const { requests, loading, error } = useSelector((state) => state.requests);
  const effectiveRole = useEffectiveRole();
  
  // Find the request in the Redux store
  const request = requests?.data?.find(req => req._id === requestId) || null;
  
  // Get status color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return '#9e9e9e'; // Gray
      case 'under_review':
        return '#2196f3'; // Blue
      case 'final_review':
        return '#ff9800'; // Orange
      case 'approved':
        return '#4caf50'; // Green
      case 'on_hold':
        return '#9c27b0'; // Purple
      case 'canceled':
        return '#757575'; // Dark Gray
      default:
        return '#9e9e9e'; // Default Gray
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format time
  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };
  
  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (error || !request) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Request Details</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">
            {error || "Request not found. It may have been deleted or you don't have permission to view it."}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Request Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            {request.title}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Chip 
              label={request.status?.replace('_', ' ').toUpperCase()} 
              sx={{ 
                backgroundColor: getStatusColor(request.status),
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.75rem',
              }} 
            />
            {request.priority && (
              <Chip 
                icon={<FlagIcon />} 
                label={request.priority.toUpperCase()} 
                variant="outlined" 
                size="small" 
              />
            )}
          </Box>
        </Box>
        
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">Submitted by</Typography>
            </Box>
            <Typography variant="body1" fontWeight={500}>
              {request.user?.name || 'Unknown User'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <CalendarIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">Submission Date</Typography>
            </Box>
            <Typography variant="body1" fontWeight={500}>
              {formatDate(request.createdAt)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <TimeIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">Submission Time</Typography>
            </Box>
            <Typography variant="body1" fontWeight={500}>
              {formatTime(request.createdAt)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">Assigned To</Typography>
            </Box>
            <Typography variant="body1" fontWeight={500}>
              {request.assignedReviewer?.name || 'Unassigned'}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Form Data
        </Typography>
        
        {request.formData && Object.keys(request.formData).length > 0 ? (
          <Grid container spacing={2}>
            {Object.entries(request.formData).map(([key, value]) => (
              <Grid item xs={12} sm={6} key={key}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Typography>
                <Typography variant="body1">
                  {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                </Typography>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No form data available
          </Typography>
        )}
        
        {request.reviewNotes && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Review Notes
            </Typography>
            <Typography variant="body1">
              {request.reviewNotes}
            </Typography>
          </>
        )}
        
        {/* Status History */}
        {request.statusHistory && request.statusHistory.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Status History
            </Typography>
            <Box>
              {request.statusHistory.map((statusChange, index) => (
                <Box key={index} mb={1} display="flex" alignItems="center" gap={1}>
                  <Chip 
                    label={statusChange.status.replace('_', ' ').toUpperCase()} 
                    size="small"
                    sx={{ 
                      backgroundColor: getStatusColor(statusChange.status),
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }} 
                  />
                  <Typography variant="body2">
                    {formatDate(statusChange.changedAt)} at {formatTime(statusChange.changedAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    by {statusChange.changedBy?.name || 'Unknown'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {(effectiveRole === 'reviewer' || effectiveRole === 'admin') && (
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => {
              // TODO: Implement update status functionality
              onClose();
            }}
          >
            Update Status
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestDetailsModal;
