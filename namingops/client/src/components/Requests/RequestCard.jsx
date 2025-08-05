import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  TextField,
  IconButton,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Comment as CommentIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { updateRequestStatus, claimRequest } from '../../features/review/reviewSlice';
import newColorPalette, { getStatusColor, getStatusIcon } from '../../theme/newColorPalette';
import {
  extractRequestTitle,
  extractRequestDescription,
  getDisplayableFormData,
  extractSubmitterInfo,
  formatRequestForRole
} from '../../utils/dynamicDataUtils';

const RequestCard = ({ request, userRole = 'submitter', onViewDetails, onUpdateStatus }) => {
  // Format request data for the current role
  const formattedRequest = formatRequestForRole(request, userRole);
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [notes, setNotes] = useState(request.reviewNotes || '');
  const [status, setStatus] = useState(request.status || 'pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date for display with better error handling
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle different date formats
      if (dateString instanceof Date) {
        return format(dateString, 'MMM dd, yyyy');
      } else if (typeof dateString === 'string') {
        return format(parseISO(dateString), 'MMM dd, yyyy');
      } else if (typeof dateString === 'number') {
        return format(new Date(dateString), 'MMM dd, yyyy');
      }
      return format(parseISO(dateString.toString()), 'MMM dd, yyyy');
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setNotes(request.reviewNotes || '');
    setStatus(request.status || 'pending');
  };

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(updateRequestStatus({
        requestId: request._id,
        status,
        notes
      })).unwrap();
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimRequest = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(claimRequest(request._id)).unwrap();
    } catch (error) {
      console.error('Failed to claim request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status chip props with better error handling
  const getStatusChipProps = (status) => {
    // Default to 'pending' if status is undefined or invalid
    const safeStatus = status && typeof status === 'string' ? status : 'pending';
    
    return {
      label: safeStatus.replace('_', ' ').toUpperCase(),
      sx: {
        backgroundColor: getStatusColor(safeStatus),
        color: '#fff',
        fontWeight: 600,
        fontSize: '0.75rem',
      },
      size: 'small',
      icon: getStatusIcon(safeStatus),
    };
  };

  // Dynamically render form data fields
  const renderFormData = () => {
    if (!request.formData) return null;
    
    return (
      <Box mt={2}>
        <Typography variant="subtitle2" gutterBottom>Form Data:</Typography>
        <Grid container spacing={1}>
          {getDisplayableFormData(request.formData).map(([key, value]) => (
            <Grid item xs={12} key={key}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                </Typography>
                <Typography variant="body2">
                  {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderLeft: `4px solid ${getStatusColor(formattedRequest.status)}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" component="div">
              {extractRequestTitle(formattedRequest)}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Submitted by {extractSubmitterInfo(formattedRequest)} on {formatDate(formattedRequest.createdAt)}
            </Typography>
          </Box>
          <Chip {...getStatusChipProps(formattedRequest.status)} />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {extractRequestDescription(formattedRequest)}
        </Typography>

        {expanded && renderFormData()}
        
        {expanded && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>Review Notes:</Typography>
            {editMode ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this request..."
                size="small"
              />
            ) : (
              <Typography variant="body2">
                {request.reviewNotes || 'No review notes yet.'}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
      
      <Collapse in={expanded && editMode}>
        <CardContent sx={{ pt: 0 }}>
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Collapse>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Button 
            size="small" 
            onClick={handleExpandClick}
            endIcon={<ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
          >
            {expanded ? 'Less' : 'More'}
          </Button>
          <Button size="small" onClick={() => onViewDetails(formattedRequest._id)}>
            View Details
          </Button>
        </Box>
        
        <Box>
          {(userRole === 'reviewer' || userRole === 'admin') && (
            <>
              {!request.assignedTo && !editMode && (
                <Button 
                  size="small" 
                  onClick={handleClaimRequest}
                  disabled={isSubmitting}
                >
                  Claim
                </Button>
              )}
              
              {editMode ? (
                <>
                  <IconButton 
                    size="small" 
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={handleSaveChanges}
                    disabled={isSubmitting}
                  >
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <IconButton 
                  size="small" 
                  onClick={handleEditClick}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default RequestCard;
