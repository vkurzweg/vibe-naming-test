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
  saveFormConfiguration,
  deleteFormConfiguration,
  activateFormConfiguration,
  deactivateFormConfiguration,
  clearFormConfigError,
  reorderFormConfigFields,
} from './formConfigSlice';
import FormConfigDialog from './FormConfigDialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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

  const allowedFieldTypes = ['text', 'textarea', 'number', 'select', 'checkbox', 'radio', 'file', 'content']; // <-- update to match your backend

  const handleSave = async (formData) => {
    try {
      const { _id, __v, ...rest } = formData;
      // Ensure all required field properties are present
      const sanitizedFields = Array.isArray(rest.fields)
        ? rest.fields.filter(f => allowedFieldTypes.includes(f.fieldType))
          .map(f => {
            if (f.fieldType === 'content') {
              return {
                ...f,
                content: f.content || ''
              };
            }
            if (f.fieldType === 'file') {
              // Add any file-specific properties you want to save
              return {
                ...f,
                label: f.label || '',
                name: f.name || '',
                required: !!f.required,
                fieldType: f.fieldType,
                // fileMeta: f.fileMeta || {}, // if you want to store file metadata
              };
            }
            return {
              ...f,
              label: f.label || '',
              name: f.name || '',
              required: !!f.required,
              fieldType: f.fieldType
            };
          })
        : [];
      const payload = { ...rest, fields: sanitizedFields };
      if (editingConfig) {
        await dispatch(saveFormConfiguration({ id: editingConfig._id, ...payload })).unwrap();
        setSnackbar({
          open: true,
          message: 'Form configuration updated successfully',
          severity: 'success'
        });
      } else {
        await dispatch(saveFormConfiguration(payload)).unwrap();
        setSnackbar({
          open: true,
          message: 'Form configuration created successfully',
          severity: 'success'
        });
      }
      handleCloseDialog();
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

  const FormConfigFieldsEditor = ({ fields, setFields, configId }) => {
    const handleDragEnd = (result) => {
      if (!result.destination) return;
      const reordered = Array.from(fields);
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      setFields(reordered);
      // Optionally: dispatch reorder thunk here if you want instant backend sync
      // dispatch(reorderFormConfigFields({ id: configId, fields: reordered }));
    };

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="fields-list">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {fields.map((field, idx) => (
                <Draggable key={field._id || idx} draggableId={field._id || String(idx)} index={idx}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        padding: '8px',
                        marginBottom: '4px',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        cursor: 'grab'
                      }}
                    >
                      {field.label || field.name || `Field ${idx + 1}`}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  if (loading && formConfigs.length === 0) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
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
            {formConfigs.map((config) => {
              // Only one config should be active
              const isActive = !!config.isActive;
              return (
                <ListItem 
                  key={config._id}
                  sx={{
                    mb: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    boxShadow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1
                  }}
                >
                  <ListItemText
                    primary={config.name}
                    secondary={config.description || 'No description provided'}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                    sx={{ flex: 1, mr: 2 }}
                  />
                  <Box display="flex" alignItems="center" gap={1}>
                    {isActive ? (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          disabled
                        >
                          Active
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={() => {
                            dispatch(deactivateFormConfiguration(config._id))
                              .unwrap()
                              .then(() => {
                                setSnackbar({ open: true, message: 'Form deactivated successfully', severity: 'success' });
                                dispatch(fetchFormConfigurations());
                              })
                              .catch((error) => setSnackbar({ open: true, message: error?.message || 'Failed to deactivate form', severity: 'error' }));
                          }}
                        >
                          Deactivate
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                          dispatch(activateFormConfiguration(config._id))
                            .unwrap()
                            .then(() => {
                              setSnackbar({ open: true, message: 'Form activated successfully', severity: 'success' });
                              dispatch(fetchFormConfigurations());
                            })
                            .catch((error) => setSnackbar({ open: true, message: error?.message || 'Failed to activate form', severity: 'error' }));
                        }}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      onClick={() => handleOpenDialog(config)}
                      size="small"
                      data-testid={`edit-${config._id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(config._id)}
                      color="error"
                      size="small"
                      data-testid={`delete-${config._id}`}
                    >
                      Delete
                    </Button>
                  </Box>
                </ListItem>
              );
            })}
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
