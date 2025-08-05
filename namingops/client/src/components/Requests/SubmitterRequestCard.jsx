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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  styled,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Cancel as CancelIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { updateRequest } from '../../features/requests/requestsSlice';
import newColorPalette, { getStatusColor, getStatusIcon } from '../../theme/newColorPalette';

const SubmitterRequestCard = ({ request, onViewDetails }) => {
  const dispatch = useDispatch();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) {
    return null;
  }

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

  const handleCancelRequest = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(updateRequest({
        requestId: request._id,
        status: 'cancelled',
        notes: `Cancelled by submitter. Reason: ${reason}`,
        notifyReviewers: true
      })).unwrap();
      setCancelDialogOpen(false);
      setReason('');
    } catch (error) {
      console.error('Failed to cancel request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHoldRequest = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(updateRequest({
        requestId: request._id,
        status: 'on_hold',
        notes: `Put on hold by submitter. Reason: ${reason}`,
        notifyReviewers: true
      })).unwrap();
      setHoldDialogOpen(false);
      setReason('');
    } catch (error) {
      console.error('Failed to put request on hold:', error);
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
        '& .MuiChip-label': {
          px: 2
        }
      },
      size: 'small'
    };
  };

  // Custom styled components for the stepper
  const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
    [`& .${StepConnector.alternativeLabel}`]: {
      top: 10,
    },
    [`& .${StepConnector.line}`]: {
      borderColor: alpha(newColorPalette.neutral.main, 0.3),
      borderTopWidth: 3,
      borderRadius: 1,
    },
  }));

  const CustomStepLabel = styled(StepLabel)(({ theme, completed, active }) => ({
    [`& .MuiStepLabel-label`]: {
      color: completed ? newColorPalette.text.primary : newColorPalette.text.secondary,
      fontWeight: completed || active ? 600 : 400,
      fontSize: '0.875rem',
    },
    [`& .MuiStepLabel-iconContainer`]: {
      [`& .MuiSvgIcon-root`]: {
        color: completed ? newColorPalette.status.approved : 
               active ? newColorPalette.status.inProgress : 
               alpha(newColorPalette.neutral.main, 0.5),
      },
    },
  }));

  // Define the steps in the request workflow
  const steps = ['Draft', 'Pending', 'In Progress', 'In Review', 'Approved'];

  // Get the current step index based on status
  const getCurrentStep = (status) => {
    const statusMap = {
      'draft': 0,
      'pending': 1,
      'in_progress': 2,
      'in_review': 3,
      'approved': 4,
      'rejected': -1,
      'cancelled': -1,
      'on_hold': 1.5 // This will show as pending but with a different visual indicator
    };
    return statusMap[status] || 0;
  };

  // Check if request can be cancelled or put on hold
  const canModify = request.status && !['approved', 'rejected', 'cancelled'].includes(request.status);

  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderLeft: `4px solid ${getStatusColor(request.status || 'pending')}`,
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
              {request.title || request.formData?.requestTitle || request.formData?.title || 'Untitled Request'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Submitted on {formatDate(request.createdAt)}
            </Typography>
          </Box>
          <Chip 
            label={(request.status || 'pending').replace('_', ' ').toUpperCase()}
            sx={{
              backgroundColor: getStatusColor(request.status || 'pending'),
              color: '#ffffff',
              fontWeight: 500,
              '& .MuiChip-label': {
                px: 2
              }
            }}
          />
        </Box>
        
        <Typography variant="body2" sx={{ mt: 1 }}>
          {typeof request.description === 'object' 
            ? request.description?.text || 'No description' 
            : request.description || request.formData?.description || 'No description'
          }
        </Typography>

        <Box mt={3} mb={2}>
          <Stepper 
            activeStep={getCurrentStep(request.status)} 
            alternativeLabel 
            connector={<CustomStepConnector />}
          >
            {steps.map((label, index) => {
              const stepProps = {};
              const labelProps = {};
              
              // Handle special states
              if (request.status === 'rejected') {
                stepProps.error = true;
                labelProps.error = true;
                labelProps.optional = (
                  <Typography variant="caption" color="error">
                    Request Rejected
                  </Typography>
                );
              } else if (request.status === 'cancelled') {
                stepProps.error = true;
                labelProps.error = true;
                labelProps.optional = (
                  <Typography variant="caption" color="error">
                    Request Cancelled
                  </Typography>
                );
              } else if (request.status === 'on_hold') {
                labelProps.optional = (
                  <Typography variant="caption" color={newColorPalette.additional.purple}>
                    On Hold
                  </Typography>
                );
              }
              
              return (
                <Step key={label} {...stepProps}>
                  <CustomStepLabel 
                    {...labelProps}
                    completed={index <= getCurrentStep(request.status)}
                    active={index === getCurrentStep(request.status)}
                  >
                    {label}
                  </CustomStepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>

        {request.reviewNotes && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>Review Notes:</Typography>
            <Typography variant="body2">
              {request.reviewNotes}
            </Typography>
          </Box>
        )}
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Button size="small" onClick={() => onViewDetails(request._id)}>
          View Details
        </Button>
        
        <Box>
          {canModify && (
            <>
              <Button 
                size="small" 
                startIcon={<PauseIcon />}
                onClick={() => setHoldDialogOpen(true)}
                disabled={isSubmitting || request.status === 'on_hold'}
              >
                Hold
              </Button>
              <Button 
                size="small" 
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </CardActions>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this request? This action will notify reviewers.
          </DialogContentText>
          <TextField
            margin="dense"
            label="Reason for cancellation"
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={isSubmitting}>
            Back
          </Button>
          <Button 
            onClick={handleCancelRequest} 
            color="error" 
            disabled={isSubmitting || !reason.trim()}
          >
            Cancel Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hold Dialog */}
      <Dialog open={holdDialogOpen} onClose={() => setHoldDialogOpen(false)}>
        <DialogTitle>Put Request on Hold</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to put this request on hold? This action will notify reviewers.
          </DialogContentText>
          <TextField
            margin="dense"
            label="Reason for hold"
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHoldDialogOpen(false)} disabled={isSubmitting}>
            Back
          </Button>
          <Button 
            onClick={handleHoldRequest} 
            color="primary" 
            disabled={isSubmitting || !reason.trim()}
          >
            Put on Hold
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SubmitterRequestCard;
