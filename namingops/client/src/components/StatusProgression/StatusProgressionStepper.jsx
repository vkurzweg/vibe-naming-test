import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepConnector,
  Box,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
  alpha,
  Paper,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Edit as DraftIcon,
  Send as SubmittedIcon,
  Visibility as ReviewIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as InProgressIcon,
  Cancel as RejectedIcon,
  Pause as OnHoldIcon,
  Close as CancelledIcon,
  Assignment as AssignedIcon,
  Gavel as FinalReviewIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { getStatusColor, getThemeAwareStatusColor } from '../../theme/newColorPalette';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

// Define the standard request workflow steps
const REQUEST_STEPS = [
  { key: 'submitted', label: 'Submitted', description: 'Request has been submitted for review' },
  { key: 'under_review', label: 'Brand Review', description: 'Under review by brand team' },
  { key: 'final_review', label: 'Legal Review', description: 'Final legal review in progress' },
  { key: 'approved', label: 'Approved', description: 'Request has been approved' }
];

// Get step icon based on status
const getStepIcon = (stepKey, currentStatus, theme) => {
  const isCompleted = getStepIndex(currentStatus) > getStepIndex(stepKey);
  const isCurrent = currentStatus === stepKey;
  const color = getThemeAwareStatusColor(stepKey, theme);

  if (currentStatus === 'cancelled' || currentStatus === 'rejected') {
    return <CancelledIcon sx={{ color: theme.palette.error.main }} />;
  }

  if (currentStatus === 'on_hold') {
    return <OnHoldIcon sx={{ color: theme.palette.warning.main }} />;
  }

  if (isCompleted || (isCurrent && stepKey === 'approved')) {
    return <CheckCircleIcon sx={{ color: color }} />;
  }

  if (isCurrent) {
    return <InProgressIcon sx={{ color: color }} />;
  }

  return <PendingIcon sx={{ color: theme.palette.grey[400] }} />;
};

// Get step index for comparison
const getStepIndex = (status) => {
  const index = REQUEST_STEPS.findIndex(step => step.key === status);
  return index === -1 ? -1 : index;
};

// Get active step index
const getActiveStep = (status) => {
  if (['cancelled', 'rejected', 'on_hold'].includes(status)) {
    return -1; // No active step for these statuses
  }
  return getStepIndex(status);
};

// Format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return null;
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    return format(date, 'MMM dd, yyyy h:mm a');
  } catch (error) {
    return null;
  }
};

const StatusProgressionStepper = ({ 
  status = 'submitted', 
  timestamps = {},
  orientation = 'vertical',
  showTimestamps = true,
  compact = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const actualOrientation = isMobile ? 'vertical' : orientation;

  // Handle special statuses
  if (['cancelled', 'rejected', 'on_hold'].includes(status)) {
    const statusColor = status === 'cancelled' || status === 'rejected' 
      ? theme.palette.error.main 
      : theme.palette.warning.main;

    return (
      <Box sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          {getStepIcon(status, status, theme)}
          <Typography variant="h6" sx={{ color: statusColor, fontWeight: 600 }}>
            {status === 'cancelled' ? 'Cancelled' : 
             status === 'rejected' ? 'Rejected' : 'On Hold'}
          </Typography>
        </Box>
        {timestamps[status] && showTimestamps && (
          <Typography variant="body2" color="text.secondary">
            {formatTimestamp(timestamps[status])}
          </Typography>
        )}
      </Box>
    );
  }

  const activeStep = getActiveStep(status);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Current Status Chip */}
      <Box mb={2}>
        <Chip
          label={status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
          sx={{
            backgroundColor: getStatusColor(status),
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        />
      </Box>

      {/* Progress Stepper */}
      <Stepper 
        activeStep={activeStep} 
        orientation={actualOrientation}
        sx={{
          '& .MuiStepLabel-root': {
            padding: compact ? '8px 0' : '16px 0'
          },
          '& .MuiStepContent-root': {
            paddingLeft: compact ? '20px' : '24px'
          }
        }}
      >
        {REQUEST_STEPS.map((step, index) => {
          const isCompleted = index < activeStep;
          const isCurrent = index === activeStep;
          const stepTimestamp = timestamps[step.key];

          return (
            <Step key={step.key} completed={isCompleted}>
              <StepLabel
                StepIconComponent={() => getStepIcon(step.key, status, theme)}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent 
                      ? theme.palette.text.primary 
                      : isCompleted 
                        ? theme.palette.text.secondary
                        : theme.palette.text.disabled
                  }
                }}
              >
                <Typography variant={compact ? "body2" : "body1"}>
                  {step.label}
                </Typography>
              </StepLabel>
              
              {actualOrientation === 'vertical' && !compact && (
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {step.description}
                  </Typography>
                  {stepTimestamp && showTimestamps && (
                    <Typography variant="caption" color="text.secondary">
                      {formatTimestamp(stepTimestamp)}
                    </Typography>
                  )}
                </StepContent>
              )}
            </Step>
          );
        })}
      </Stepper>

      {/* Horizontal layout timestamps */}
      {actualOrientation === 'horizontal' && showTimestamps && (
        <Box mt={2}>
          {REQUEST_STEPS.map((step) => {
            const stepTimestamp = timestamps[step.key];
            if (!stepTimestamp) return null;
            
            return (
              <Typography 
                key={step.key} 
                variant="caption" 
                color="text.secondary" 
                display="block"
              >
                {step.label}: {formatTimestamp(stepTimestamp)}
              </Typography>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default StatusProgressionStepper;
