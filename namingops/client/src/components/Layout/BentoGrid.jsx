import React from 'react';
import {
  Box,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';

// Bento Grid Container Component
const BentoGrid = ({ 
  children, 
  spacing = 2, 
  maxWidth = 'xl',
  sx = {},
  ...props 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: maxWidth === 'xl' ? 1200 : maxWidth === 'lg' ? 960 : maxWidth === 'md' ? 720 : 480,
        margin: '0 auto',
        padding: theme.spacing(2),
        ...sx,
      }}
      {...props}
    >
      <Grid 
        container 
        spacing={spacing}
        sx={{
          width: '100%',
          margin: 0,
        }}
      >
        {children}
      </Grid>
    </Box>
  );
};

// Bento Grid Item Component
const BentoItem = ({ 
  children, 
  size = 'medium',
  priority = 'normal',
  interactive = true,
  sx = {},
  ...props 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Define responsive grid sizes based on item size
  const getGridSize = () => {
    if (isMobile) {
      // Mobile: stack most items
      switch (size) {
        case 'small': return { xs: 6, sm: 6 };
        case 'medium': return { xs: 12, sm: 6 };
        case 'large': return { xs: 12, sm: 12 };
        case 'wide': return { xs: 12, sm: 12 };
        case 'tall': return { xs: 12, sm: 6 };
        default: return { xs: 12, sm: 6 };
      }
    } else if (isTablet) {
      // Tablet: optimize for medium screens
      switch (size) {
        case 'small': return { xs: 6, sm: 4, md: 3 };
        case 'medium': return { xs: 12, sm: 6, md: 6 };
        case 'large': return { xs: 12, sm: 8, md: 8 };
        case 'wide': return { xs: 12, sm: 12, md: 12 };
        case 'tall': return { xs: 12, sm: 6, md: 4 };
        default: return { xs: 12, sm: 6, md: 6 };
      }
    } else {
      // Desktop: full Bento Grid layout
      switch (size) {
        case 'small': return { xs: 12, sm: 6, md: 4, lg: 3 };
        case 'medium': return { xs: 12, sm: 6, md: 6, lg: 4 };
        case 'large': return { xs: 12, sm: 8, md: 8, lg: 6 };
        case 'wide': return { xs: 12, sm: 12, md: 12, lg: 8 };
        case 'tall': return { xs: 12, sm: 6, md: 4, lg: 4 };
        default: return { xs: 12, sm: 6, md: 6, lg: 4 };
      }
    }
  };

  // Define height based on size and priority
  const getHeight = () => {
    const baseHeight = isMobile ? 200 : 240;
    switch (size) {
      case 'small': return baseHeight * 0.8;
      case 'medium': return baseHeight;
      case 'large': return baseHeight * 1.2;
      case 'wide': return baseHeight * 0.9;
      case 'tall': return baseHeight * 1.5;
      default: return baseHeight;
    }
  };

  // Priority-based styling
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return {
          background: theme.custom.gradients.primary,
          color: theme.palette.primary.contrastText,
          boxShadow: theme.custom.shadows.bento,
          border: `2px solid ${theme.palette.primary.main}`,
        };
      case 'medium':
        return {
          background: theme.custom.gradients.surface,
          boxShadow: theme.custom.shadows.card,
          border: `1px solid ${theme.palette.divider}`,
        };
      case 'low':
        return {
          background: theme.palette.background.paper,
          boxShadow: theme.shadows[1],
          opacity: 0.9,
        };
      default:
        return {
          background: theme.custom.gradients.surface,
          boxShadow: theme.custom.shadows.card,
        };
    }
  };

  return (
    <Grid item {...getGridSize()}>
      <Paper
        className={interactive ? 'bento-item' : ''}
        elevation={0}
        sx={{
          height: getHeight(),
          borderRadius: theme.custom.bento.borderRadius,
          padding: theme.custom.bento.padding,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          cursor: interactive ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          ...getPriorityStyles(),
          '&:hover': interactive ? {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: theme.custom.shadows.bento,
            '& .bento-content': {
              transform: 'scale(1.05)',
            },
          } : {},
          ...sx,
        }}
        {...props}
      >
        <Box
          className="bento-content"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {children}
        </Box>
      </Paper>
    </Grid>
  );
};

// Specialized Bento Components for Dashboard

// Metric Card Component
const BentoMetric = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'primary',
  size = 'small',
  ...props 
}) => {
  const theme = useTheme();
  
  return (
    <BentoItem size={size} priority="high" {...props}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ 
            typography: 'overline', 
            color: 'inherit',
            opacity: 0.8,
            mb: 1,
          }}>
            {title}
          </Box>
          <Box sx={{ 
            typography: 'h3', 
            fontWeight: 600,
            color: 'inherit',
            mb: 0.5,
          }}>
            {value}
          </Box>
          {subtitle && (
            <Box sx={{ 
              typography: 'body2', 
              color: 'inherit',
              opacity: 0.7,
            }}>
              {subtitle}
            </Box>
          )}
        </Box>
        {icon && (
          <Box sx={{ 
            fontSize: '2rem',
            color: 'inherit',
            opacity: 0.8,
          }}>
            {icon}
          </Box>
        )}
      </Box>
      {trend && (
        <Box sx={{ 
          mt: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          typography: 'caption',
          color: 'inherit',
          opacity: 0.8,
        }}>
          {trend}
        </Box>
      )}
    </BentoItem>
  );
};

// Status Overview Component
const BentoStatus = ({ 
  title, 
  items = [], 
  size = 'medium',
  ...props 
}) => {
  const theme = useTheme();
  
  return (
    <BentoItem size={size} priority="medium" {...props}>
      <Box sx={{ 
        typography: 'h6', 
        fontWeight: 600,
        mb: 3,
        color: theme.palette.text.primary,
      }}>
        {title}
      </Box>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flex: 1,
      }}>
        {items.map((item, index) => (
          <Box 
            key={index}
            className="status-indicator"
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderRadius: 2,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                transform: 'scale(1.02)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: theme.custom.getStatusColor(item.status),
                }}
              />
              <Box sx={{ typography: 'body2', fontWeight: 500 }}>
                {item.label}
              </Box>
            </Box>
            <Box sx={{ 
              typography: 'h6', 
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}>
              {item.count}
            </Box>
          </Box>
        ))}
      </Box>
    </BentoItem>
  );
};

// Chart/Visualization Component
const BentoChart = ({ 
  title, 
  children, 
  size = 'large',
  ...props 
}) => {
  const theme = useTheme();
  
  return (
    <BentoItem size={size} priority="medium" {...props}>
      <Box sx={{ 
        typography: 'h6', 
        fontWeight: 600,
        mb: 2,
        color: theme.palette.text.primary,
      }}>
        {title}
      </Box>
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
      }}>
        {children}
      </Box>
    </BentoItem>
  );
};

// Activity Feed Component
const BentoActivity = ({ 
  title, 
  activities = [], 
  size = 'tall',
  ...props 
}) => {
  const theme = useTheme();
  
  return (
    <BentoItem size={size} priority="normal" {...props}>
      <Box sx={{ 
        typography: 'h6', 
        fontWeight: 600,
        mb: 2,
        color: theme.palette.text.primary,
      }}>
        {title}
      </Box>
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {activities.map((activity, index) => (
          <Box 
            key={index}
            sx={{ 
              display: 'flex',
              gap: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                mt: 1,
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ 
                typography: 'body2', 
                fontWeight: 500,
                mb: 0.5,
              }}>
                {activity.title}
              </Box>
              <Box sx={{ 
                typography: 'caption', 
                color: theme.palette.text.secondary,
              }}>
                {activity.time}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </BentoItem>
  );
};

export { BentoGrid, BentoItem, BentoMetric, BentoStatus, BentoChart, BentoActivity };
export default BentoGrid;
