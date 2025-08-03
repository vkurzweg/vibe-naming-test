import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Button, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  IconButton, 
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { 
  fetchFormConfigurations,
  createFormConfiguration,
  updateFormConfiguration,
  deleteFormConfiguration,
  clearFormConfigError,
} from './formConfigSlice';
import FormConfigDialog from './FormConfigDialog';

const FormConfigManager = () => {
  const dispatch = useDispatch();
  const { formConfigs, loading, error } = useSelector((state) => state.formConfig);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  useEffect(() => {
    console.log('Fetching form configurations...');
    dispatch(fetchFormConfigurations())
      .then((result) => {
        console.log('Form configs loaded:', result);
      })
      .catch((error) => {
        console.error('Error loading form configs:', error);
      });
  }, [dispatch]);

  useEffect(() => {
    console.log('Current form configs:', { formConfigs, loading, error });
    if (error) {
      console.error('Form config error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred',
        severity: 'error'
      });
      // Clear error after showing it
      dispatch(clearFormConfigError());
    }
  }, [error, formConfigs, loading, dispatch]);

  const handleOpenDialog = (config = null) => {
    setEditingConfig(config);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingConfig(null);
    setDialogOpen(false);
  };

  const handleSave = async (formData) => {
    try {
      if (editingConfig) {
        await dispatch(updateFormConfiguration({ 
          id: editingConfig._id, 
          formData: {
            ...formData,
            _id: undefined,
            __v: undefined
          } 
        })).unwrap();
        setSnackbar({
          open: true,
          message: 'Form configuration updated successfully',
          severity: 'success'
        });
      } else {
        await dispatch(createFormConfiguration(formData)).unwrap();
        setSnackbar({
          open: true,
          message: 'Form configuration created successfully',
          severity: 'success'
        });
      }
      handleCloseDialog();
      // Refresh the list
      dispatch(fetchFormConfigurations());
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save form configuration',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this form configuration?')) {
      try {
        await dispatch(deleteFormConfiguration(id)).unwrap();
        setSnackbar({
          open: true,
          message: 'Form configuration deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.message || 'Failed to delete form configuration',
          severity: 'error'
        });
      }
    }
  };

  const handleRefresh = () => {
    dispatch(fetchFormConfigurations())
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Form configurations refreshed successfully',
          severity: 'success'
        });
      })
      .catch((error) => {
        setSnackbar({
          open: true,
          message: error.message || 'Failed to refresh form configurations',
          severity: 'error'
        });
      });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading && formConfigs.length === 0) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h4">Form Configurations</Typography>
            <Tooltip title="Refresh">
              <IconButton 
                onClick={handleRefresh}
                disabled={loading}
                color="primary"
                size="large"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleOpenDialog()}
            disabled={loading}
            startIcon={<AddIcon />}
          >
            New Configuration
          </Button>
        </Box>
        <Paper elevation={3} sx={{ mt: 2 }}>
          <Box p={3} textAlign="center">
            <CircularProgress />
            <Typography>Loading form configurations...</Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4">Form Configurations</Typography>
          <Tooltip title="Refresh">
            <IconButton 
              onClick={handleRefresh}
              disabled={loading}
              color="primary"
              size="large"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => handleOpenDialog()}
          disabled={loading}
          startIcon={<AddIcon />}
        >
          New Configuration
        </Button>
      </Box>

      <Paper elevation={3} sx={{ mt: 2 }}>
        {formConfigs.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="body1" color="textSecondary" paragraph>
              No form configurations found. Create your first form configuration to get started.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleOpenDialog()}
              startIcon={<AddIcon />}
            >
              Create First Configuration
            </Button>
          </Box>
        ) : (
          <List>
            {formConfigs.map((config) => (
              <ListItem 
                key={config._id} 
                sx={{ 
                  mb: 1, 
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1
                }}
                secondaryAction={
                  <Box>
                    <Button 
                      onClick={() => handleOpenDialog(config)}
                      sx={{ mr: 1 }}
                      data-testid={`edit-${config._id}`}
                    >
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDelete(config._id)}
                      color="error"
                      data-testid={`delete-${config._id}`}
                    >
                      Delete
                    </Button>
                  </Box>
                }
              >
                <ListItemText 
                  primary={config.name} 
                  secondary={config.description || 'No description provided'}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
                <Button 
                  variant={config.isActive ? 'contained' : 'outlined'}
                  color={config.isActive ? 'success' : 'primary'}
                  size="small"
                  disabled={config.isActive || loading}
                  sx={{ ml: 2 }}
                  onClick={() => {
                    if (!config.isActive) {
                      dispatch(require('./formConfigSlice').activateFormConfiguration(config._id))
                        .unwrap()
                        .then(() => setSnackbar({ open: true, message: 'Form activated successfully', severity: 'success' }))
                        .catch((error) => setSnackbar({ open: true, message: error?.message || 'Failed to activate form', severity: 'error' }));
                    }
                  }}
                >
                  {config.isActive ? 'Active' : 'Activate'}
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <FormConfigDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSave}
        initialData={editingConfig}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FormConfigManager;
