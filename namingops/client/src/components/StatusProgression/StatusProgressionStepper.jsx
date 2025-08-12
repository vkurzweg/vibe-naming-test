import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepConnector,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  styled,
} from '@mui/material';
import { getStatusColor } from '../../theme/newColorPalette';
import { format, parseISO } from 'date-fns';

// Define the standard request workflow steps
const REQUEST_STEPS = [
  { key: 'submitted', label: 'Submitted', description: 'Request has been submitted for review' },
  { key: 'brand_review', label: 'Brand Review', description: 'Under review by brand team' },
  { key: 'legal_review', label: 'Legal Review', description: 'Final legal review in progress' },
  { key: 'approved', label: 'Approved', description: 'Request has been approved' }
];

// Get step index for comparison
const getStepIndex = (status) => {
  const index = REQUEST_STEPS.findIndex(step => step.key === status);
  return index === -1 ? -1 : index;
};

// Get active step index
const getActiveStep = (status) => {
  if (['canceled', 'cancelled', 'on_hold'].includes(status)) {
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

// Custom connector with color transition animations
const ColoredConnector = styled(StepConnector)(({ theme }) => ({
  [`&.MuiStepConnector-root`]: {
    left: '0.85rem',
    transition: 'all 0.3s ease',
  },
  [`&.MuiStepConnector-active`]: {
    [`& .MuiStepConnector-line`]: {
      backgroundImage: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.primary.main})`,
      transition: 'background-image 0.5s ease',
    },
  },
  [`&.MuiStepConnector-completed`]: {
    [`& .MuiStepConnector-line`]: {
      backgroundImage: `linear-gradient(to bottom, ${theme.palette.success.main}, ${theme.palette.success.main})`,
      transition: 'background-image 0.5s ease',
    },
  },
  [`& .MuiStepConnector-line`]: {
    height: '100%',
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
    borderRadius: 1,
    width: '0.125rem',
    marginLeft: 0,
    transition: 'all 0.5s ease-in-out',
  },
}));

const HorizontalColoredConnector = styled(StepConnector)(({ theme }) => ({
  [`&.MuiStepConnector-root`]: {
    top: '0.85rem',
    transition: 'all 0.3s ease',
  },
  [`&.MuiStepConnector-active`]: {
    [`& .MuiStepConnector-line`]: {
      backgroundImage: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.main})`,
      transition: 'background-image 0.5s ease',
    },
  },
  [`&.MuiStepConnector-completed`]: {
    [`& .MuiStepConnector-line`]: {
      backgroundImage: `linear-gradient(to right, ${theme.palette.success.main}, ${theme.palette.success.main})`,
      transition: 'background-image 0.5s ease',
    },
  },
  [`& .MuiStepConnector-line`]: {
    width: '100%',
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
    borderRadius: 1,
    height: '0.125rem',
    marginTop: 0,
    transition: 'all 0.5s ease-in-out',
  },
}));

const StepDot = styled('div')(({ theme, ownerState }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.75rem',
  height: '1.75rem',
  zIndex: 1,
  position: 'relative',
  '&::before': {
    content: '""',
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '50%',
    backgroundColor: 
      ownerState.active ? theme.palette.primary.main :
      ownerState.completed ? theme.palette.success.main : 
      theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: ownerState.active ? 'scale(1.25)' : 'scale(1)',
    boxShadow: 
      ownerState.active ? `0 0 0 0.25rem ${theme.palette.primary.main}33` :
      ownerState.completed ? `0 0 0 0.125rem ${theme.palette.success.main}22` : 'none',
  }
}));

const CustomStepLabel = styled(StepLabel)(({ theme }) => ({
  '& .MuiStepLabel-iconContainer': {
    paddingRight: '0.5rem',
  },
  '& .MuiStepLabel-labelContainer': {
    color: theme.palette.text.primary,
    transition: 'color 0.3s ease',
  }
}));

const StatusProgressionStepper = ({ 
  status = 'submitted', 
  timestamps = {},
  orientation = 'vertical',
  showTimestamps = true,
  compact = false,
  connectorComponent = null
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const actualOrientation = isMobile ? 'vertical' : orientation;

  // On hold: all steps inactive, use default MUI inactive styles
  const isOnHold = status === 'on_hold';
  const activeStep = isOnHold ? -1 : getActiveStep(status);

  const StepperConnector = connectorComponent || 
    (actualOrientation === 'vertical' ? ColoredConnector : HorizontalColoredConnector);

  return (
    <Box sx={{ width: '100%', pt: compact ? 0 : 1, transition: 'all 0.3s ease' }}>
      <Stepper 
        activeStep={activeStep} 
        orientation={actualOrientation}
        connector={<StepperConnector />}
        // No custom color overrides for on_hold!
        sx={{
          '& .MuiStepLabel-root': {
            padding: compact ? '0.5rem 0' : '1rem 0',
            alignItems: 'flex-start',
            transition: 'padding 0.3s ease',
          },
          '& .MuiStepContent-root': {
            paddingLeft: compact ? '1.25rem' : '1.5rem',
            marginLeft: '0.75rem',
            borderLeft: 'none',
            transition: 'padding 0.3s ease',
          },
          '& .MuiStep-root': {
            padding: 0,
            transition: 'all 0.3s ease',
          },
          '& .MuiStepper-root': {
            padding: 0,
            transition: 'all 0.3s ease',
          }
        }}
      >
        {REQUEST_STEPS.map((step, index) => {
          const isCompleted = !isOnHold && index < activeStep;
          const isCurrent = !isOnHold && index === activeStep;
          const stepTimestamp = timestamps[step.key];

          return (
            <Step key={step.key} completed={isCompleted}>
              <CustomStepLabel
                StepIconComponent={() => (
                  <StepDot 
                    ownerState={{ 
                      completed: isCompleted, 
                      active: isCurrent && !isOnHold 
                    }}
                  />
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: isCurrent ? 600 : 400,
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <Typography 
                  variant={compact ? "body2" : "body1"}
                  sx={{ 
                    transition: 'all 0.3s ease',
                    fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400
                  }}
                >
                  {step.label}
                </Typography>
                {actualOrientation === 'horizontal' && stepTimestamp && showTimestamps && (
                  <Typography 
                    variant="caption" 
                    display="block"
                    sx={{ transition: 'color 0.3s ease' }}
                  >
                    {formatTimestamp(stepTimestamp)}
                  </Typography>
                )}
              </CustomStepLabel>
              
              {actualOrientation === 'vertical' && !compact && (
                <StepContent>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, transition: 'color 0.3s ease' }}
                  >
                    {step.description}
                  </Typography>
                  {stepTimestamp && showTimestamps && (
                    <Typography 
                      variant="caption"
                      sx={{ transition: 'color 0.3s ease' }}
                    >
                      {formatTimestamp(stepTimestamp)}
                    </Typography>
                  )}
                </StepContent>
              )}
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default StatusProgressionStepper;