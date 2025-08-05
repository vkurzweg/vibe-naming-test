import React from 'react';
import {
  Box,
  Chip,
  Avatar,
  useTheme,
  Tooltip,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  RateReview as ReviewIcon,
  Pause as PauseIcon,
  Cancel as CancelIcon,
  Edit as DraftIcon,
  HourglassEmpty as PendingIcon,
  Gavel as LegalIcon,
  Palette as BrandIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';

// Status Icon Mapping
const getStatusIcon = (status) => {
  const iconMap = {
    draft: <DraftIcon />,
    submitted: <PendingIcon />,
    pending: <ScheduleIcon />,
    under_review: <ReviewIcon />,
    brand_review: <BrandIcon />,
    legal_review: <LegalIcon />,
    approved: <CheckCircleIcon />,
    on_hold: <PauseIcon />,
    cancelled: <CancelIcon />,
    admin_review: <AdminIcon />,
  };
  return iconMap[status] || <ScheduleIcon />;
};

// Animated Status Chip Component
const StatusChip = ({ 
  status, 
  label, 
  size = 'medium',
  variant = 'filled',
  animated = true,
  showIcon = true,
  onClick,
  ...props 
}) => {
  const theme = useTheme();
  const statusColor = theme.custom.getStatusColor(status);
  
  return (
    <Chip
      icon={showIcon ? getStatusIcon(status) : undefined}
      label={label || status?.replace('_', ' ').toUpperCase()}
      size={size}
      variant={variant}
      onClick={onClick}
      className={animated ? 'status-indicator' : ''}
      sx={{
        backgroundColor: statusColor,
        color: theme.palette.getContrastText(statusColor),
        fontWeight: 600,
        textTransform: 'capitalize',
        border: `2px solid ${statusColor}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        '& .MuiChip-icon': {
          color: 'inherit',
        },
        '&:hover': onClick ? {
          backgroundColor: theme.palette.action.hover,
          transform: 'scale(1.05)',
          boxShadow: theme.custom.shadows.button,
        } : {},
        ...props.sx,
      }}
      {...props}
    />
  );
};

// Status Progress Bar Component
const StatusProgressBar = ({ 
  currentStatus, 
  statusFlow = ['draft', 'submitted', 'under_review', 'approved'],
  showLabels = true,
  animated = true,
}) => {
  const theme = useTheme();
  const currentIndex = statusFlow.indexOf(currentStatus);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / statusFlow.length) * 100 : 0;
  
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {showLabels && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mb: 1,
          typography: 'caption',
          color: theme.palette.text.secondary,
        }}>
          {statusFlow.map((status, index) => (
            <Box 
              key={status}
              sx={{ 
                fontWeight: index <= currentIndex ? 600 : 400,
                color: index <= currentIndex ? theme.palette.text.primary : theme.palette.text.secondary,
                textTransform: 'capitalize',
              }}
            >
              {status.replace('_', ' ')}
            </Box>
          ))}
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={progress}
        className={animated ? 'status-indicator' : ''}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.palette.action.hover,
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background: theme.custom.gradients.primary,
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
      />
    </Box>
  );
};

// Status Timeline Component
const StatusTimeline = ({ 
  statusHistory = [], 
  currentStatus,
  vertical = false,
  animated = true,
}) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: vertical ? 'column' : 'row',
      gap: vertical ? 3 : 2,
      alignItems: vertical ? 'flex-start' : 'center',
    }}>
      {statusHistory.map((item, index) => {
        const isActive = item.status === currentStatus;
        const isCompleted = index < statusHistory.findIndex(h => h.status === currentStatus);
        
        return (
          <Box 
            key={`${item.status}-${index}`}
            className={animated ? 'status-indicator' : ''}
            sx={{ 
              display: 'flex',
              flexDirection: vertical ? 'row' : 'column',
              alignItems: 'center',
              gap: 1,
              position: 'relative',
              flex: vertical ? 'none' : 1,
            }}
          >
            {/* Status Icon */}
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: isActive 
                  ? theme.palette.primary.main 
                  : isCompleted 
                    ? theme.palette.success.main 
                    : theme.palette.action.disabled,
                color: theme.palette.getContrastText(
                  isActive 
                    ? theme.palette.primary.main 
                    : isCompleted 
                      ? theme.palette.success.main 
                      : theme.palette.action.disabled
                ),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: isActive && animated ? `${theme.custom.animations.bounce}` : 'none',
              }}
            >
              {getStatusIcon(item.status)}
            </Avatar>
            
            {/* Status Label and Time */}
            <Box sx={{ 
              textAlign: vertical ? 'left' : 'center',
              ml: vertical ? 2 : 0,
            }}>
              <Box sx={{ 
                typography: 'body2',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
                textTransform: 'capitalize',
                mb: 0.5,
              }}>
                {item.status.replace('_', ' ')}
              </Box>
              {item.timestamp && (
                <Box sx={{ 
                  typography: 'caption',
                  color: theme.palette.text.secondary,
                }}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </Box>
              )}
            </Box>
            
            {/* Connecting Line */}
            {!vertical && index < statusHistory.length - 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 20,
                  left: '100%',
                  width: '100%',
                  height: 2,
                  backgroundColor: isCompleted 
                    ? theme.palette.success.main 
                    : theme.palette.action.disabled,
                  zIndex: -1,
                  transition: 'background-color 0.3s ease-in-out',
                }}
              />
            )}
            
            {vertical && index < statusHistory.length - 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 40,
                  left: 20,
                  width: 2,
                  height: '100%',
                  backgroundColor: isCompleted 
                    ? theme.palette.success.main 
                    : theme.palette.action.disabled,
                  zIndex: -1,
                  transition: 'background-color 0.3s ease-in-out',
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

// Status Badge Component with Animation
const StatusBadge = ({ 
  status, 
  count, 
  size = 'medium',
  animated = true,
  onClick,
  ...props 
}) => {
  const theme = useTheme();
  const statusColor = theme.custom.getStatusColor(status);
  
  return (
    <Tooltip title={`${count} ${status.replace('_', ' ')} requests`}>
      <Box
        onClick={onClick}
        className={animated ? 'status-indicator' : ''}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderRadius: 3,
          backgroundColor: `${statusColor}20`,
          border: `2px solid ${statusColor}`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': onClick ? {
            backgroundColor: `${statusColor}30`,
            transform: 'scale(1.05)',
            boxShadow: theme.custom.shadows.button,
          } : {},
          ...props.sx,
        }}
        {...props}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: statusColor,
            animation: animated ? `${theme.custom.animations.scaleIn}` : 'none',
          }}
        />
        <Box sx={{ 
          typography: size === 'small' ? 'caption' : 'body2',
          fontWeight: 600,
          color: theme.palette.text.primary,
          textTransform: 'capitalize',
        }}>
          {status.replace('_', ' ')}
        </Box>
        <Box sx={{ 
          typography: size === 'small' ? 'caption' : 'h6',
          fontWeight: 700,
          color: statusColor,
          minWidth: 20,
          textAlign: 'center',
        }}>
          {count}
        </Box>
      </Box>
    </Tooltip>
  );
};

// Loading Status Indicator
const LoadingStatusIndicator = ({ 
  message = 'Loading...', 
  size = 'medium',
  variant = 'circular',
}) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      gap: 2,
      p: 3,
    }}>
      {variant === 'circular' ? (
        <CircularProgress 
          size={size === 'small' ? 24 : size === 'large' ? 48 : 32}
          sx={{ color: theme.palette.primary.main }}
        />
      ) : (
        <LinearProgress 
          sx={{ 
            width: '100%', 
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.palette.action.hover,
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              background: theme.custom.gradients.primary,
            },
          }}
        />
      )}
      <Box sx={{ 
        typography: 'body2',
        color: theme.palette.text.secondary,
        textAlign: 'center',
      }}>
        {message}
      </Box>
    </Box>
  );
};

export {
  StatusChip,
  StatusProgressBar,
  StatusTimeline,
  StatusBadge,
  LoadingStatusIndicator,
  getStatusIcon,
};

export default StatusChip;
