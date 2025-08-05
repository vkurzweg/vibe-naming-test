import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Box,
  Typography,
  useTheme,
  Badge,
} from '@mui/material';

const AccessibleTabs = ({
  value,
  onValueChange,
  children,
  orientation = 'horizontal',
  variant = 'default',
  size = 'medium',
  fullWidth = false,
}) => {
  const theme = useTheme();

  const tabListStyles = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5),
    gap: theme.spacing(0.5),
    width: fullWidth ? '100%' : 'auto',
    border: variant === 'outlined' ? `1px solid ${theme.palette.divider}` : 'none',
    boxShadow: variant === 'elevated' ? theme.shadows[2] : 'none',
  };

  const getTabStyles = (isActive) => ({
    all: 'unset',
    fontFamily: theme.typography.fontFamily,
    padding: theme.spacing(
      size === 'small' ? 1 : size === 'large' ? 2 : 1.5,
      size === 'small' ? 2 : size === 'large' ? 3 : 2.5
    ),
    fontSize: theme.typography[size === 'small' ? 'body2' : 'body1'].fontSize,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: isActive ? theme.palette.primary.main + '10' : 'transparent',
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',
    transition: theme.transitions.create(['background-color', 'color', 'box-shadow'], {
      duration: theme.transitions.duration.short,
    }),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    minHeight: size === 'small' ? 32 : size === 'large' ? 48 : 40,
    flex: fullWidth ? 1 : 'none',
    '&:hover': {
      backgroundColor: isActive 
        ? theme.palette.primary.main + '15'
        : theme.palette.action.hover,
    },
    '&:focus': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  });

  return (
    <Tabs.Root
      value={value}
      onValueChange={onValueChange}
      orientation={orientation}
    >
      <Tabs.List style={tabListStyles} aria-label="Navigation tabs">
        {children}
      </Tabs.List>
    </Tabs.Root>
  );
};

const AccessibleTab = ({
  value,
  children,
  disabled = false,
  badge,
  icon,
  ariaLabel,
}) => {
  const theme = useTheme();

  return (
    <Tabs.Trigger
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      style={(state) => getTabStyles(state.selected)}
    >
      {icon && (
        <Box
          component="span"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.2em',
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        component="span"
        variant="inherit"
        sx={{ whiteSpace: 'nowrap' }}
      >
        {children}
      </Typography>
      {badge && (
        <Badge
          badgeContent={badge}
          color="primary"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              minWidth: 16,
              height: 16,
            },
          }}
        />
      )}
    </Tabs.Trigger>
  );
};

const AccessibleTabPanel = ({
  value,
  children,
  className,
  forceMount = false,
}) => {
  const theme = useTheme();

  return (
    <Tabs.Content
      value={value}
      forceMount={forceMount}
      className={className}
      style={{
        marginTop: theme.spacing(2),
        outline: 'none',
        '&:focus': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      {children}
    </Tabs.Content>
  );
};

// Helper function to get tab styles (used in the component above)
const getTabStyles = (isActive) => {
  const theme = useTheme();
  return {
    all: 'unset',
    fontFamily: theme.typography.fontFamily,
    padding: theme.spacing(1.5, 2.5),
    fontSize: theme.typography.body1.fontSize,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: isActive ? theme.palette.primary.main + '10' : 'transparent',
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',
    transition: theme.transitions.create(['background-color', 'color'], {
      duration: theme.transitions.duration.short,
    }),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    minHeight: 40,
    '&:hover': {
      backgroundColor: isActive 
        ? theme.palette.primary.main + '15'
        : theme.palette.action.hover,
    },
    '&:focus': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  };
};

export { AccessibleTabs, AccessibleTab, AccessibleTabPanel };
export default AccessibleTabs;
