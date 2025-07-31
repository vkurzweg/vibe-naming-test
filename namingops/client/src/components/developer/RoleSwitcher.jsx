import React from 'react';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Paper, 
  Divider,
  Tooltip,
  IconButton,
  Badge
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDeveloperControls, ROLES } from '../../utils/developerMode';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import RefreshIcon from '@mui/icons-material/Refresh';

const RoleSwitcher = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  
  const {
    isDeveloper,
    activeRole,
    isRoleSimulation,
    availableRoles,
    setActiveRole,
    toggleRoleSimulation,
    resetDeveloperSettings
  } = useDeveloperControls();

  // Don't render in production
  if (!isDeveloper) return null;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRoleChange = (role) => {
    setActiveRole(role);
    // Close the menu after a short delay to show the selection
    setTimeout(handleClose, 300);
  };

  const handleReset = () => {
    resetDeveloperSettings();
    // Force a refresh to apply changes
    window.location.reload();
  };

  // Role display names and colors
  const roleDisplay = {
    [ROLES.ADMIN]: { label: 'Admin', color: theme.palette.error.main },
    [ROLES.REVIEWER]: { label: 'Reviewer', color: theme.palette.warning.main },
    [ROLES.SUBMITTER]: { label: 'Submitter', color: theme.palette.info.main },
    [ROLES.DEVELOPER]: { label: 'Developer', color: theme.palette.success.main },
  };

  return (
    <>
      <Tooltip title="Developer Controls">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={open ? 'role-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Badge 
            color="primary" 
            variant="dot" 
            invisible={!isRoleSimulation}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
          >
            <DeveloperModeIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        id="role-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'role-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ width: 320, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              Developer Mode
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isRoleSimulation}
                  onChange={toggleRoleSimulation}
                  color="primary"
                  size="small"
                />
              }
              label={isRoleSimulation ? 'On' : 'Off'}
              labelPlacement="start"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            {isRoleSimulation 
              ? `Simulating ${roleDisplay[activeRole]?.label || activeRole} role`
              : 'Role simulation is disabled'}
          </Typography>
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Switch Role:
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            {availableRoles.map((role) => (
              <Button
                key={role}
                variant={role === activeRole ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleRoleChange(role)}
                disabled={!isRoleSimulation}
                startIcon={<AccountCircleIcon />}
                sx={{
                  textTransform: 'none',
                  backgroundColor: role === activeRole ? `${roleDisplay[role]?.color}22` : 'transparent',
                  borderColor: role === activeRole ? roleDisplay[role]?.color : 'divider',
                  color: role === activeRole ? roleDisplay[role]?.color : 'text.primary',
                  '&:hover': {
                    borderColor: roleDisplay[role]?.color,
                    backgroundColor: `${roleDisplay[role]?.color}11`,
                  },
                }}
              >
                {roleDisplay[role]?.label || role}
              </Button>
            ))}
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button
              size="small"
              onClick={handleReset}
              startIcon={<RefreshIcon />}
              color="inherit"
            >
              Reset
            </Button>
            <Typography variant="caption" color="text.secondary">
              v{process.env.REACT_APP_VERSION || '0.1.0-dev'}
            </Typography>
          </Box>
        </Paper>
      </Menu>
    </>
  );
};

export default RoleSwitcher;
