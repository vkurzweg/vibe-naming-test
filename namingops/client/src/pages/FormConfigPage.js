import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Button,
  Divider,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { 
  fetchFormConfigurations as fetchFormConfigs, 
  saveFormConfiguration as saveFormConfig, 
  deleteFormConfiguration as deleteFormConfig,
  clearFormConfigError,
  activateFormConfiguration
} from '../features/admin/formConfigSlice';

const FormConfigPage = () => {
  const dispatch = useDispatch();
  const { formConfigs, activeFormConfig, loading, error } = useSelector((state) => state.formConfig);
  const [editingConfig, setEditingConfig] = React.useState(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      isActive: false,
      fields: [
        { name: '', fieldType: 'text', label: '', required: false, options: [] }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields'
  });

  // Load form configs on component mount
  useEffect(() => {
    dispatch(fetchFormConfigs());
    return () => {
      dispatch(clearFormConfigError());
    };
  }, [dispatch]);

  // Reset form when editingConfig changes
  useEffect(() => {
    if (editingConfig) {
      reset(editingConfig);
    } else if (!isCreating) {
      reset({
        name: '',
        description: '',
        isActive: false,
        fields: [{ name: '', fieldType: 'text', label: '', required: false, options: [] }]
      });
    }
  }, [editingConfig, isCreating, reset]);

  // Handle save (create or update)
  const handleSave = async (formData) => {
    try {
      if (editingConfig) {
        // For updates, use saveFormConfiguration with the existing ID
        await dispatch(saveFormConfig({ ...formData, id: editingConfig.id })).unwrap();
      } else {
        // For new configs, use saveFormConfiguration
        await dispatch(saveFormConfig(formData)).unwrap();
      }
      setEditingConfig(null);
      setIsCreating(false);
      reset();
    } catch (error) {
      console.error('Error saving form config:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this form configuration?')) {
      try {
        await dispatch(deleteFormConfig(id)).unwrap();
        if (editingConfig?._id === id) {
          setEditingConfig(null);
          setIsCreating(false);
          reset();
        }
      } catch (error) {
        console.error('Error deleting form config:', error);
      }
    }
  };

  const handleSetActive = async (id) => {
    try {
      await dispatch(activateFormConfiguration(id)).unwrap();
    } catch (error) {
      console.error('Error setting active form config:', error);
    }
  };

  const handleAddField = () => {
    append({ name: '', fieldType: 'text', label: '', required: false, options: [] });
  };

  const handleRemoveField = (index) => {
    remove(index);
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setEditingConfig(null);
    setIsCreating(true);
    reset({
      name: '',
      description: '',
      isActive: false,
      fields: [{ name: '', fieldType: 'text', label: '', required: false, options: [] }]
    });
  };

  const handleCancel = () => {
    setEditingConfig(null);
    setIsCreating(false);
    reset();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Form Configurations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          disabled={isCreating || !!editingConfig}
        >
          New Configuration
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {(isCreating || editingConfig) && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <form onSubmit={handleSubmit(handleSave)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Configuration Name"
                      variant="outlined"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      variant="outlined"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Form Fields</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddField}
                  >
                    Add Field
                  </Button>
                </Box>

                {fields.map((field, index) => (
                  <Box key={field.id} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Controller
                          name={`fields.${index}.name`}
                          control={control}
                          rules={{ 
                            required: 'Field name is required',
                            pattern: {
                              value: /^[a-zA-Z0-9_]+$/,
                              message: 'Only letters, numbers, and underscores are allowed'
                            }
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Field Name"
                              variant="outlined"
                              size="small"
                              error={!!errors.fields?.[index]?.name}
                              helperText={errors.fields?.[index]?.name?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Controller
                          name={`fields.${index}.fieldType`}
                          control={control}
                          rules={{ required: 'Field type is required' }}
                          render={({ field }) => (
                            <FormControl fullWidth size="small" error={!!errors.fields?.[index]?.fieldType}>
                              <InputLabel>Field Type</InputLabel>
                              <Select {...field} label="Field Type">
                                <MenuItem value="text">Text</MenuItem>
                                <MenuItem value="number">Number</MenuItem>
                                <MenuItem value="email">Email</MenuItem>
                                <MenuItem value="date">Date</MenuItem>
                                <MenuItem value="select">Dropdown</MenuItem>
                                <MenuItem value="checkbox">Checkbox</MenuItem>
                                <MenuItem value="radio">Radio Buttons</MenuItem>
                                <MenuItem value="textarea">Text Area</MenuItem>
                              </Select>
                              {errors.fields?.[index]?.fieldType && (
                                <FormHelperText>{errors.fields[index].fieldType.message}</FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`fields.${index}.label`}
                          control={control}
                          rules={{ required: 'Label is required' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Display Label"
                              variant="outlined"
                              size="small"
                              error={!!errors.fields?.[index]?.label}
                              helperText={errors.fields?.[index]?.label?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Box display="flex" alignItems="center" height="100%">
                          <Controller
                            name={`fields.${index}.required`}
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                  />
                                }
                                label="Required"
                              />
                            )}
                          />
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveField(index)}
                            size="small"
                            sx={{ ml: 'auto' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {editingConfig ? 'Update' : 'Save'} Configuration
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Fields</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formConfigs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No form configurations found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                formConfigs.map((config) => (
                  <TableRow 
                    key={config._id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {config.name}
                    </TableCell>
                    <TableCell>{config.description || 'No description'}</TableCell>
                    <TableCell>
                      {config.isActive ? (
                        <Chip label="Active" color="success" size="small" />
                      ) : (
                        <Chip label="Inactive" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{config.fields?.length || 0} fields</TableCell>
                    <TableCell align="right">
                      {!config.isActive && (
                        <Tooltip title="Set as active">
                          <IconButton 
                            size="small" 
                            onClick={() => handleSetActive(config._id)}
                            color="success"
                            disabled={loading}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(config)}
                          disabled={loading || (editingConfig && editingConfig._id === config._id)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDelete(config._id)}
                          disabled={loading || config.isActive}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default FormConfigPage;
