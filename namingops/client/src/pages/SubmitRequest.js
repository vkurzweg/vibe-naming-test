// client/src/pages/SubmitRequest.js
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Paper
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { createNamingRequest } from '../features/naming/namingSlice';
import { loadActiveFormConfig } from '../features/admin/formConfigSlice';
import DynamicFormField from '../features/requests/DynamicFormField';

const SubmitRequest = () => { 
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Log the entire formConfig state for debugging
  const formConfigState = useSelector((state) => state.formConfig);
  console.log('Form Config State:', {
    activeFormConfig: formConfigState.activeFormConfig,
    loading: formConfigState.loading,
    error: formConfigState.error,
    lastUpdated: formConfigState.lastUpdated,
    hasFields: formConfigState.activeFormConfig?.fields?.length > 0
  });

  // Destructure the values we need
  const { activeFormConfig, loading: formConfigLoading, error: formConfigError } = useSelector((state) => state.formConfig);
  const { user } = useSelector((state) => state.auth); // Get user from auth state
  const { loading, error } = useSelector((state) => state.naming);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Initialize form with empty values - the fields will be populated by the form config
  const defaultValues = {
    proposedNames: [{ name: '', description: '' }],
    metadata: {
      keywords: []
    },
    // Set default due date to 1 week from now
    dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    // Set default priority
    priority: 'medium'
  };

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues
  });

  const proposedNames = watch('proposedNames');
  const metadata = watch('metadata');

  // Add a ref to track if we've already shown the initial loading state
  const initialLoad = React.useRef(true);
  const lastFetchedConfigId = React.useRef(null);
  
  // Effect to load form configuration
  useEffect(() => {
    // Reset the last fetched ID when the component mounts or when the role changes
    lastFetchedConfigId.current = null;
    initialLoad.current = true;
    
    const loadFormConfig = async () => {
      try {
        console.log('Loading form configuration...');
        const resultAction = await dispatch(loadActiveFormConfig());
        const config = resultAction.payload;
        
        if (config) {
          console.log('Form configuration loaded:', {
            id: config._id,
            name: config.name,
            fields: config.fields?.length || 0
          });
          
          if (config._id !== lastFetchedConfigId.current) {
            console.log('New form configuration detected, updating...');
            lastFetchedConfigId.current = config._id;
            
            // Reset the form with new default values when a new config is loaded
            const defaultValues = {
              proposedNames: [{ name: '', description: '' }],
              metadata: {
                keywords: []
              },
              // Set default due date to 1 week from now
              dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
              // Set default priority
              priority: 'medium'
            };
            console.log('Resetting form with default values:', defaultValues);
            reset(defaultValues);
            
            // Show a message to the user that the form has been updated
            if (!initialLoad.current) {
              setSnackbarMessage(`Loaded form: ${config.name}`);
              setSnackbarSeverity('info');
              setOpenSnackbar(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading form configuration:', error);
        setSnackbarMessage('Failed to load form configuration');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      } finally {
        initialLoad.current = false;
      }
    };
    
    // Always load the form config when the component mounts or when the role changes
    loadFormConfig();
    
    // Set up an interval to periodically check for form config updates in development
    if (process.env.NODE_ENV === 'development') {
      const intervalId = setInterval(() => {
        console.log('Checking for form config updates...');
        dispatch(loadActiveFormConfig());
      }, 15000); // Check every 15 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [dispatch, reset]); // Reset when lastUpdated changes or when component mounts

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
    const updatedKeywords = metadata.keywords.filter(keyword => keyword !== keywordToRemove);
    setValue('metadata.keywords', updatedKeywords);
  };

  const onSubmit = async (formData) => {
    console.log('Form submitted with data:', formData);
    
    try {
      // Get all field values from the form data
      const fieldValues = {};
      if (activeFormConfig?.fields) {
        activeFormConfig.fields.forEach(field => {
          fieldValues[field.name] = formData[field.name] || '';
        });
      }

      // Prepare the request data according to the server's expected format
      const requestData = {
        requestTitle: fieldValues.requestTitle || 'Untitled Request',
        description: fieldValues.description || 'No description provided',
        proposedNames: Array.isArray(formData.proposedNames) 
          ? formData.proposedNames
              .filter(name => name && name.name && name.name.trim() !== '')
              .map(name => ({
                name: String(name.name).trim(),
                description: name.description ? String(name.description).trim() : ''
              }))
          : [{ name: 'New Name', description: 'Automatically added name' }],
        // Include all other form fields in the formData object
        ...Object.entries(fieldValues)
          .filter(([key]) => !['requestTitle', 'description'].includes(key))
          .reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value
          }), {})
      };

      // Ensure we have at least one proposed name
      if (requestData.proposedNames.length === 0) {
        requestData.proposedNames = [{ 
          name: fieldValues.requestTitle || 'New Name', 
          description: fieldValues.description || 'Automatically added name' 
        }];
      }

      // Prepare the final payload
      const payload = {
        title: requestData.requestTitle,
        description: requestData.description,
        formData: requestData,
        user: user, // Use the logged-in user's data
        status: 'pending',
        formConfigId: activeFormConfig?._id || 'default-config',
        formConfigName: activeFormConfig?.name || 'Default Form'
      };

      console.log('Submitting request with payload:', JSON.stringify(payload, null, 2));
      
      const resultAction = await dispatch(createNamingRequest(payload));
      
      if (createNamingRequest.fulfilled.match(resultAction)) {
        setSnackbarMessage('Naming request submitted successfully!');
        setSnackbarSeverity('success');
        reset(defaultValues);
      } else {
        const error = resultAction.payload || { message: 'Failed to submit request' };
        console.error('Submission error:', error);
        
        // Extract validation errors if available
        const errorMessage = error.details?.errors?.length > 0
          ? error.details.errors.map(e => e.msg).join('\n')
          : error.message || 'Failed to submit request';
          
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
      }
    } catch (error) {
      console.error('Error in onSubmit:', error);
      setSnackbarMessage(error.message || 'An error occurred while submitting the form');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleRefreshConfig = () => {
    dispatch(loadActiveFormConfig());
  };

  if (formConfigLoading && !activeFormConfig) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading form configuration...</Typography>
      </Box>
    );
  }

  if (formConfigError) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={handleRefreshConfig}>
            Retry
          </Button>
        }
      >
        {formConfigError.msg || 'Failed to load form configuration.'}
      </Alert>
    );
  }

  if (!activeFormConfig) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" gutterBottom>No active form available</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleRefreshConfig}
          startIcon={<RefreshIcon />}
        >
          Refresh Form
        </Button>
      </Box>
    );
  }

  // Debug log the form configuration being used
  console.log('Rendering form with config:', {
    name: activeFormConfig.name,
    fieldCount: activeFormConfig.fields?.length || 0,
    fields: activeFormConfig.fields?.map(f => ({
      name: f.name,
      label: f.label,
      type: f.fieldType,
      required: f.required
    }))
  });

  return (
    <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {activeFormConfig.name || 'Submit a Naming Request'}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {activeFormConfig.description}
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          {/* Dynamic Fields from Config */}
          {activeFormConfig.fields?.map((field) => (
            <Grid item xs={12} key={field.name}>
              <DynamicFormField field={field} control={control} errors={errors} />
            </Grid>
          ))}

          {/* Standard Fields */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Proposed Names</Typography>
          </Grid>

          {proposedNames.map((item, index) => (
            <React.Fragment key={index}>
              <Grid item xs={12} sm={5}>
                <TextField {...control.register(`proposedNames.${index}.name`)} label={`Proposed Name #${index + 1}`} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField {...control.register(`proposedNames.${index}.description`)} label="Description" fullWidth />
              </Grid>
              <Grid item xs={12} sm={1}>
                <IconButton onClick={() => handleRemoveProposedName(index)} disabled={proposedNames.length <= 1}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </React.Fragment>
          ))}

          <Grid item xs={12}>
            <Button startIcon={<AddIcon />} onClick={handleAddProposedName}>Add Another Name</Button>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Additional Info</Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField label="Keywords (press Enter to add)" onKeyDown={handleAddKeyword} fullWidth />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {metadata.keywords.map((keyword) => (
                <Chip key={keyword} label={keyword} onDelete={() => handleRemoveKeyword(keyword)} />
              ))}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </Box>
      </form>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SubmitRequest;