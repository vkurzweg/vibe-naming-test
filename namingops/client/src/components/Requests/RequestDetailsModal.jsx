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
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { useEffectiveRole } from '../../hooks/useEffectiveRole';
import { getStatusColor } from '../../theme/newColorPalette';

const RequestDetailsModal = ({ open, onClose, requestId }) => {
  const theme = useTheme();
  const { requests, loading, error } = useSelector((state) => state.requests);
  const effectiveRole = useEffectiveRole();
  
  // Find the request in the Redux store
  const request = requests?.data?.find(req => req._id === requestId) || null;
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Dynamic field formatter - converts any data to user-friendly display
  const formatFieldValue = (value, key = '') => {
    if (value === null || value === undefined) return 'Not provided';
    
    // Handle different data types dynamically
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    
    if (typeof value === 'string') {
      // Handle email fields
      if (key.toLowerCase().includes('email') || value.includes('@')) {
        return value;
      }
      // Handle date strings
      if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
        try {
          return formatDate(value);
        } catch {
          return value;
        }
      }
      return value;
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None specified';
    }
    
    if (typeof value === 'object') {
      // Handle nested objects by extracting meaningful data
      if (value.name) return value.name;
      if (value.title) return value.title;
      if (value.text) return value.text;
      if (value.value) return value.value;
      
      // For other objects, show key-value pairs in a readable format
      const entries = Object.entries(value);
      if (entries.length === 0) return 'No data';
      
      return entries.map(([k, v]) => `${k}: ${formatFieldValue(v, k)}`).join(', ');
    }
    
    return value.toString();
  };

  // Dynamic field name formatter
  const formatFieldName = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize each word
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
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
              Request Details
            </Typography>
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
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
            Request Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography 
            variant="h5" 
            gutterBottom 
            fontWeight={600}
            sx={{ color: theme.palette.text.primary }}
          >
            {request.title || 
             request.formData?.requestTitle || 
             request.formData?.title || 
             request.name ||
             'Untitled Request'}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Chip 
              label={request.status?.replace('_', ' ').toUpperCase() || 'PENDING'} 
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
                sx={{ color: theme.palette.text.primary }}
              />
            )}
          </Box>
        </Box>
        
        {/* Basic Information */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Submitted by
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight={500} sx={{ color: theme.palette.text.primary }}>
              {request.user?.name || 
               request.formData?.requestorName || 
               request.submittedBy ||
               'Unknown User'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <CalendarIcon color="action" fontSize="small" />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Submission Date
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight={500} sx={{ color: theme.palette.text.primary }}>
              {formatDate(request.createdAt || request.submittedAt)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <TimeIcon color="action" fontSize="small" />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Submission Time
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight={500} sx={{ color: theme.palette.text.primary }}>
              {formatTime(request.createdAt || request.submittedAt)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Assigned To
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight={500} sx={{ color: theme.palette.text.primary }}>
              {request.assignedReviewer?.name || 
               request.assignedTo ||
               'Unassigned'}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Description */}
        {(request.description || request.formData?.description) && (
          <>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <DescriptionIcon color="action" fontSize="small" />
              <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                Description
              </Typography>
            </Box>
            <Typography 
              variant="body1" 
              sx={{ 
                color: theme.palette.text.primary,
                mb: 3,
                p: 2,
                backgroundColor: theme.palette.action.hover,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              {typeof request.description === 'object' 
                ? request.description?.text || formatFieldValue(request.description)
                : request.description || request.formData?.description}
            </Typography>
          </>
        )}
        
        {/* Request Details */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AssignmentIcon color="action" fontSize="small" />
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
            Request Information
          </Typography>
        </Box>
        
        {request.formData && Object.keys(request.formData).length > 0 ? (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {Object.entries(request.formData)
              .filter(([key, value]) => key !== 'description') // Already shown above
              .map(([key, value]) => (
              <Grid item xs={12} sm={6} key={key}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    {formatFieldName(key)}
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {formatFieldValue(value, key)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontStyle: 'italic',
              mb: 3
            }}
          >
            No additional request information available
          </Typography>
        )}

        {/* System Information */}
        {(request.formConfigId || request.formConfigName) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <BusinessIcon color="action" fontSize="small" />
              <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                System Information
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {request.formConfigName && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: theme.palette.action.hover,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 600,
                        mb: 1
                      }}
                    >
                      Form Template
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ color: theme.palette.text.primary }}
                    >
                      {request.formConfigName}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {request.formConfigId && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: theme.palette.action.hover,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 600,
                        mb: 1
                      }}
                    >
                      Request ID
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ 
                        color: theme.palette.text.primary,
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                      }}
                    >
                      {request.formConfigId}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestDetailsModal;
