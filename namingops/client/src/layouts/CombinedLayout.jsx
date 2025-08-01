import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { switchRole } from '../features/auth/authSlice';
import { 
  fetchActiveFormConfig, 
  fetchFormConfigurations,
  clearFormConfigError 
} from '../features/admin/formConfigSlice';
import { createNamingRequest } from '../features/naming/namingSlice';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import {
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  Collapse,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  FormHelperText,
  Snackbar,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Archive as ArchiveIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  RateReview as ReviewerIcon,
  Send as SubmitterIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { isDevelopment } from '../utils/environment';
import DynamicFormField from '../features/requests/DynamicFormField';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9) + 1,
      },
    }),
  },
}));

const CombinedLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get auth state from Redux
  const { user } = useSelector((state) => state.auth);
  const currentRole = user?.role || 'submitter';
  const { activeFormConfig, loading: formConfigLoading } = useSelector((state) => state.formConfig);
  
  // State for mobile drawer and UI
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Navigation items based on role
  const navItems = useMemo(() => {
    const items = [
      { 
        text: 'Dashboard', 
        icon: <DashboardIcon />, 
        path: '/dashboard',
        view: 'dashboard',
        roles: ['admin', 'reviewer', 'submitter']
      },
      { 
        text: 'Submit Request', 
        icon: <AddIcon />, 
        path: '/submit-request',
        view: 'submit-request',
        roles: ['admin', 'submitter']
      },
      { 
        text: 'My Requests', 
        icon: <SubmitterIcon />, 
        path: '/my-requests',
        view: 'my-requests',
        roles: ['admin', 'submitter', 'reviewer']
      },
      { 
        text: 'Review Queue', 
        icon: <ReviewerIcon />, 
        path: '/review-queue',
        view: 'review-queue',
        roles: ['admin', 'reviewer']
      },
    ];
    
    // Add admin menu if user is admin
    if (currentRole === 'admin') {
      items.push(
        { 
          text: 'Admin', 
          icon: <AdminIcon />, 
          path: '/admin',
          view: 'admin',
          roles: ['admin'],
          children: [
            { 
              text: 'Form Configuration', 
              icon: <SettingsIcon />, 
              path: '/admin/form-config',
              view: 'form-config',
              roles: ['admin']
            },
            { 
              text: 'User Management', 
              icon: <PeopleIcon />, 
              path: '/admin/users',
              view: 'users',
              roles: ['admin']
            },
            { 
              text: 'System Settings', 
              icon: <TuneIcon />, 
              path: '/admin/settings',
              view: 'settings',
              roles: ['admin']
            }
          ]
        }
      );
    }
    
    // Add archive for all roles
    items.push({ 
      text: 'Archive', 
      icon: <ArchiveIcon />, 
      path: '/archive',
      view: 'archive',
      roles: ['admin', 'reviewer', 'submitter']
    });
    
    return items.filter(item => item.roles.includes(currentRole));
  }, [currentRole]);
  
  // Check if view is allowed for current role
  const isViewAllowed = (view) => {
    switch (view) {
      case 'submit-request':
        return ['admin', 'submitter'].includes(currentRole);
      case 'review-queue':
        return ['admin', 'reviewer'].includes(currentRole);
      case 'admin':
        return currentRole === 'admin';
      default:
        return true; // Dashboard is always allowed
    }
  };

  // Handle navigation
  const handleNavigation = useCallback((view) => {
    if (isViewAllowed(view)) {
      setActiveView(view);
      const targetPath = navItems.find(item => item.view === view)?.path || '/';
      navigate(targetPath);
    }
  }, [navigate, navItems, isViewAllowed]);

  // Toggle mobile drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // Toggle admin menu
  const handleAdminMenuToggle = () => {
    setAdminMenuOpen(!adminMenuOpen);
  };
  
  // Handle role switching (development only)
  const handleRoleSwitch = (role) => {
    if (isDevelopment) {
      dispatch(switchRole(role));
      setSnackbarMessage(`Switched to ${role} role`);
      setSnackbarOpen(true);
      
      // If switching to a role that doesn't have access to current path, redirect to dashboard
      const currentPath = location.pathname;
      const currentNavItem = navItems.find(item => 
        item.path === currentPath || 
        (item.children && item.children.some(child => child.path === currentPath))
      );
      
      if (!currentNavItem) {
        navigate('/dashboard');
      }
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // Load active form config on mount
  useEffect(() => {
    if (!activeFormConfig && !formConfigLoading) {
      dispatch(fetchActiveFormConfig());
    }
  }, [dispatch, activeFormConfig, formConfigLoading]);
  
  // Get form config and naming request state from Redux
  const { formConfigs, error: formConfigError } = useSelector((state) => state.formConfig);
  const { loading, error } = useSelector((state) => state.naming);
  
  // Local UI state
  const [activeView, setActiveView] = useState('dashboard');
  const [expanded, setExpanded] = useState({});
  const [roleAnchorEl, setRoleAnchorEl] = useState(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  
  // Form handling with react-hook-form - Initialize with default values from Redux
  const getDefaultFormValues = useCallback(() => {
    const defaultValues = {
      title: '',
      description: '',
      proposedNames: [{ name: '', description: '' }],
      metadata: { keywords: [] },
      dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      priority: 'medium',
    };

    // Add default values for any additional fields from the active form config
    if (activeFormConfig?.fields) {
      activeFormConfig.fields.forEach(field => {
        if (field.name && field.defaultValue !== undefined) {
          defaultValues[field.name] = field.defaultValue;
        }
      });
    }

    return defaultValues;
  }, [activeFormConfig]);

  const formMethods = useForm({
    defaultValues: getDefaultFormValues(),
    mode: 'onChange',
    reValidateMode: 'onChange'
  });
  
  // Reset form when activeFormConfig changes
  useEffect(() => {
    if (activeFormConfig) {
      formMethods.reset(getDefaultFormValues());
    }
  }, [activeFormConfig, formMethods, getDefaultFormValues]);

  const { 
    control, 
    handleSubmit, 
    reset: resetForm, 
    watch, 
    setValue, 
    register, 
    formState: { errors } 
  } = formMethods;
  
  // Fetch form config when component mounts or role changes
  useEffect(() => {
    const loadFormConfig = async () => {
      try {
        await dispatch(fetchFormConfigurations()).unwrap();
        await dispatch(fetchActiveFormConfig()).unwrap();
      } catch (error) {
        console.error('Error loading form configuration:', error);
        setSnackbarMessage('Failed to load form configuration');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    };
    
    loadFormConfig();
  }, [dispatch, currentRole]);
  
  // Clear form config error when component unmounts
  useEffect(() => {
    return () => {
      if (formConfigError) {
        dispatch(clearFormConfigError());
      }
    };
  }, [dispatch, formConfigError]);

  const proposedNames = watch('proposedNames') || [];
  const metadata = watch('metadata') || { keywords: [] };

  // Load form config when component mounts or role changes
  useEffect(() => {
    console.log('Fetching active form config for role:', currentRole);
    dispatch(fetchActiveFormConfig())
      .then((result) => {
        console.log('Form config fetch result:', result);
        if (result.error) {
          console.error('Error fetching form config:', result.error);
        }
      });
  }, [dispatch, currentRole]); // Add currentRole to dependency array
  
  // Debug log when activeFormConfig changes
  useEffect(() => {
    console.log('Active form config updated:', activeFormConfig);
    console.log('Form config fields:', activeFormConfig?.fields);
  }, [activeFormConfig]);

  // Log role changes for debugging
  useEffect(() => {
    console.log('Current user role:', user?.role);
  }, [user?.role]);

  // Handle role menu interactions
  const handleRoleMenuOpen = (event) => {
    if (isDevelopment) {
      setRoleAnchorEl(event.currentTarget);
    }
  };

  const handleRoleMenuClose = () => {
    setRoleAnchorEl(null);
  };

  const handleRoleChange = useCallback((newRole) => {
    if (isDevelopment) {
      dispatch(switchRole({ role: newRole }));
      handleRoleMenuClose();
      
      // Show a brief notification about the role change
      setSnackbarMessage(`Switched to ${newRole} role`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    }
  }, [dispatch, isDevelopment]);

  // Handle form submission
  const onSubmit = async (formData) => {
    try {
      if (!activeFormConfig) {
        throw new Error('Form configuration not loaded. Please try again.');
      }

      // Create a clean request object based on the active form config
      const requestData = {
        title: formData.title?.trim() || 'Untitled Request',
        description: formData.description?.trim() || 'No description provided',
        proposedNames: formData.proposedNames
          .filter((name) => name?.name?.trim())
          .map((name) => ({
            name: String(name.name).trim(),
            description: name.description ? String(name.description).trim() : '',
          })),
        priority: formData.priority || 'medium',
        metadata: formData.metadata || { keywords: [] },
        status: 'pending',
        createdBy: user?.id || 'anonymous',
        createdAt: new Date().toISOString(),
        formConfigId: activeFormConfig._id,
        formConfigName: activeFormConfig.name,
        formConfigVersion: activeFormConfig.version || '1.0.0',
        // Include any additional fields from the form config
        ...(activeFormConfig.fields?.reduce((acc, field) => {
          if (field.name && formData[field.name] !== undefined) {
            acc[field.name] = formData[field.name];
          }
          return acc;
        }, {})),
      };

      // Dispatch the createNamingRequest action and wait for it to complete
      const resultAction = await dispatch(createNamingRequest(requestData));
      
      if (createNamingRequest.fulfilled.match(resultAction)) {
        // Show success message
        setSnackbarMessage('Request submitted successfully!');
        setSnackbarSeverity('success');
        
        // Reset form to default values
        const defaultValues = {
          title: '',
          description: '',
          proposedNames: [{ name: '', description: '' }],
          priority: 'medium',
          metadata: { keywords: [] },
          dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          // Reset any additional fields from the form config
          ...(activeFormConfig.fields?.reduce((acc, field) => {
            acc[field.name] = field.defaultValue || '';
            return acc;
          }, {})),
        };
        
        reset(defaultValues);
        
        // Navigate to the dashboard or my-requests view
        navigate('/my-requests');
      } else {
        throw new Error(resultAction.error?.message || 'Failed to submit request');
      }
      
    } catch (error) {
      console.error('Error submitting request:', error);
      setSnackbarMessage(error.message || 'An error occurred while submitting the request');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  // Handle accordion expansion
  const handleExpand = (menu) => {
    setExpanded((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  // Handle proposed names management
  const handleAddProposedName = () => {
    setValue('proposedNames', [...proposedNames, { name: '', description: '' }]);
  };

  const handleRemoveProposedName = (index) => {
    if (proposedNames.length > 1) {
      const updatedNames = [...proposedNames];
      updatedNames.splice(index, 1);
      setValue('proposedNames', updatedNames);
    }
  };

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const keyword = e.target.value.trim();
      if (!metadata.keywords.includes(keyword)) {
        const updatedKeywords = [...metadata.keywords, keyword];
        setValue('metadata.keywords', updatedKeywords);
        e.target.value = '';
      }
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    const updatedKeywords = metadata.keywords.filter((keyword) => keyword !== keywordToRemove);
    setValue('metadata.keywords', updatedKeywords);
  };

  // Render the appropriate content based on the active view
  const renderMainContent = () => {
    // If the current view is not allowed, redirect to dashboard
    if (!isViewAllowed(activeView)) {
      setActiveView('dashboard');
      return null;
    }

    // Common container styling
    const containerStyle = {
      p: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    };

    // Render the appropriate content based on the active view
    switch (activeView) {
      case 'submit-request':
        if (!['admin', 'submitter'].includes(currentRole)) {
          setActiveView('dashboard');
          return null;
        }
        return (
          <Box sx={containerStyle}>
            <Typography variant="h4" gutterBottom>
              Submit New Naming Request
            </Typography>
            <Paper sx={{ p: 3, flex: 1 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {activeFormConfig?.fields?.map((field) => (
                <DynamicFormField
                  key={field._id || field.name}
                  field={field}
                  control={control}
                  errors={errors}
                />
              ))}
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Proposed Names
                </Typography>
                {watch('proposedNames')?.map((_, index) => {
                  const watchedProposedNames = watch('proposedNames');
                  return (
                    <Box key={index} sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <TextField
                        fullWidth
                        label="Name"
                        variant="outlined"
                        {...register(`proposedNames.${index}.name`, {
                          required: 'Name is required',
                        })}
                        error={!!errors.proposedNames?.[index]?.name}
                        helperText={errors.proposedNames?.[index]?.name?.message}
                      />
                      <TextField
                        fullWidth
                        label="Description (Optional)"
                        variant="outlined"
                        {...register(`proposedNames.${index}.description`)}
                      />
                      {watchedProposedNames?.length > 1 && (
                        <IconButton
                          onClick={() => handleRemoveProposedName(index)}
                          color="error"
                          sx={{ mt: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))
                }
                <Button
                  onClick={handleAddProposedName}
                  startIcon={<AddIcon />}
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  Add Another Name
                </Button>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Priority</InputLabel>
                      <MuiSelect
                        label="Priority"
                        {...register('priority')}
                        defaultValue="medium"
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </MuiSelect>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Due Date"
                      type="date"
                      margin="normal"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      {...register('dueDate')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Keywords (Press Enter to add)"
                      margin="normal"
                      onKeyDown={handleAddKeyword}
                    />
                    <Box sx={{ mt: 1 }}>
                      {watch('metadata.keywords')?.map((keyword, index) => (
                        <Chip
                          key={index}
                          label={keyword}
                          onDelete={() => handleRemoveKeyword(keyword)}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    reset();
                    setActiveView('dashboard');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Request'}
                </Button>
              </Box>
            </form>
          </Paper>
        );
      
      case 'archive':
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Archived Requests
            </Typography>
            <Typography>Archive view will be implemented here</Typography>
          </Paper>
        );
      
      case 'dashboard':
      default:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Dashboard
            </Typography>
            <Typography>Welcome to the Naming Ops Dashboard</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setActiveView('submit-request')}
              sx={{ mt: 2 }}
            >
              Create New Request
            </Button>
          </Paper>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
        }}
      >
        <StyledDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {navItems.map((item) => (
                <ListItemButton
                  key={item.text}
                  onClick={() => handleNavigation(item.view)}
                  selected={activeView === item.view}
                  disabled={!item.show}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </StyledDrawer>
        <StyledDrawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
          }}
          open={true}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {navItems.map((item) => {
                if (item.children) {
                  return (
                    <React.Fragment key={item.text}>
                      <ListItemButton onClick={() => handleExpand(item.text)}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                        {expanded[item.text] ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>
                      <Collapse in={expanded[item.text]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {item.children.map((child) => (
                            <ListItemButton
                              key={child.text}
                              sx={{ pl: 4 }}
                              onClick={() => handleNavigation(child.view)}
                              selected={activeView === child.view}
                            >
                              <ListItemText primary={child.text} />
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                    </React.Fragment>
                  );
                }
                return (
                  <ListItemButton
                    key={item.text}
                    onClick={() => handleNavigation(item.view)}
                    selected={activeView === item.view}
                    disabled={!item.show}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                );
              })}
            </List>
            
            {/* User Profile Section */}
            <Box sx={{ mt: 'auto', p: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    mr: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '0.875rem',
                    cursor: isDevelopment ? 'pointer' : 'default'
                  }}
                  onClick={isDevelopment ? handleRoleMenu : undefined}
                >
                  {currentRole?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography noWrap variant="body2" fontWeight="medium">
                    {user?.name || 'User'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography noWrap variant="caption" color="text.secondary">
                      {currentRole}
                    </Typography>
                    {isDevelopment && (
                      <SettingsIcon 
                        fontSize="small" 
                        color="action" 
                        sx={{ fontSize: '0.9em', opacity: 0.7 }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </StyledDrawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          mt: 8, // Space for app bar
          overflow: 'auto',
          height: 'calc(100vh - 64px)' // Adjust based on your app bar height
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {renderMainContent()}
        </Container>
      </Box>

      {/* Role selection menu - Only visible in development */}
      {isDevelopment && (
        <Menu
          anchorEl={roleAnchorEl}
          open={Boolean(roleAnchorEl)}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 180,
              boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, pb: 0.5, display: 'block' }}>
            Development Role
          </Typography>
          <Divider sx={{ my: 0.5 }} />
          {['admin', 'reviewer', 'submitter'].map((role) => (
            <MenuItem 
              key={role}
              onClick={() => handleRoleChange(role)}
              sx={{
                py: 0.75,
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%',
                bgcolor: currentRole === role ? 'primary.main' : 'transparent',
                border: currentRole === role ? 'none' : '1px solid',
                borderColor: 'divider',
                mr: 1.5,
                flexShrink: 0
              }} />
              <ListItemText 
                primary={role.charAt(0).toUpperCase() + role.slice(1)}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: currentRole === role ? 'text.primary' : 'text.secondary',
                  fontWeight: currentRole === role ? 500 : 400
                }}
              />
            </MenuItem>
          ))}
        </Menu>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CombinedLayout;
