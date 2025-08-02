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
import { useDispatch, useSelector } from 'react-redux';
import { switchRole } from '../../features/auth/authSlice';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import RefreshIcon from '@mui/icons-material/Refresh';

// Role constants for reference
const ROLES = {
  ADMIN: 'admin',
  REVIEWER: 'reviewer',
  SUBMITTER: 'submitter'
};

const RoleSwitcher = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const currentActiveRole = user?.role || ROLES.ADMIN; // Get active role from Redux
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [isRoleSimulation, setIsRoleSimulation] = React.useState(true);
  const open = Boolean(anchorEl);
  
  // Available roles for switching
  const availableRoles = [
    { id: ROLES.ADMIN, label: 'Admin' },
    { id: ROLES.REVIEWER, label: 'Reviewer' },
    { id: ROLES.SUBMITTER, label: 'Submitter' }
  ];

  // Don't render in production
  if (process.env.NODE_ENV === 'production') return null;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRoleChange = (role) => {
    console.log('Dispatching switchRole to:', role);
    dispatch(switchRole(role));
    // Close the menu after a short delay to show the selection
    setTimeout(handleClose, 300);
  };

  const handleToggleSimulation = () => {
    const newValue = !isRoleSimulation;
    setIsRoleSimulation(newValue);
    // If turning off simulation, reset to admin role
    if (!newValue) {
      handleRoleChange(ROLES.ADMIN);
    }
  };

  const handleReset = () => {
    // Reset to admin role
    handleRoleChange(ROLES.ADMIN);
  };

  // Role display names and colors
  const roleDisplay = {
    [ROLES.ADMIN]: { label: 'Admin', color: theme.palette.error.main },
    [ROLES.REVIEWER]: { label: 'Reviewer', color: theme.palette.warning.main },
    [ROLES.SUBMITTER]: { label: 'Submitter', color: theme.palette.info.main }
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
                  size="small"
                  checked={isRoleSimulation}
                  onChange={handleToggleSimulation}
                  color="primary"
                />
              }
              label={isRoleSimulation ? 'On' : 'Off'}
              labelPlacement="start"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            {isRoleSimulation 
              ? `Simulating ${roleDisplay[currentActiveRole]?.label || currentActiveRole} role`
              : 'Role simulation is disabled'}
          </Typography>
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Switch Role:
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            {availableRoles.map((roleObj) => (
              <Button
                key={roleObj.id}
                variant={roleObj.id === currentActiveRole ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleRoleChange(roleObj.id)}
                disabled={!isRoleSimulation}
                startIcon={<DeveloperModeIcon />}
                sx={{
                  textTransform: 'none',
                  backgroundColor: roleObj.id === currentActiveRole ? `${roleDisplay[roleObj.id]?.color}22` : 'transparent',
                  borderColor: roleObj.id === currentActiveRole ? roleDisplay[roleObj.id]?.color : 'divider',
                  color: roleObj.id === currentActiveRole ? roleDisplay[roleObj.id]?.color : 'text.primary',
                  '&:hover': {
                    borderColor: roleDisplay[roleObj.id]?.color,
                    backgroundColor: `${roleDisplay[roleObj.id]?.color}11`,
                  },
                }}
              >
                {roleObj.label}
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
