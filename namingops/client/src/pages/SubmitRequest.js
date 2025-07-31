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
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { createNamingRequest } from '../features/naming/namingSlice';
import { fetchActiveFormConfig } from '../features/admin/formConfigSlice';
import { createRequest } from '../features/requests/requestsSlice';
import DynamicFormField from '../features/requests/DynamicFormField';

const SubmitRequest = () => { 
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeFormConfig, loading: formConfigLoading, error: formConfigError } = useSelector((state) => state.formConfig);
  const { loading, error } = useSelector((state) => state.naming);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    reset
  } = useForm({
    defaultValues: {
      requestTitle: '',
      description: '',
      priority: 'medium',
      dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Default to 1 week from now
      proposedNames: [{ name: '', description: '' }],
      metadata: {
        product: '',
        targetAudience: '',
        competitors: '',
        keywords: []
      }
    }
  });

  const proposedNames = watch('proposedNames');
  const metadata = watch('metadata');

  useEffect(() => {
    dispatch(fetchActiveFormConfig());
  }, [dispatch]);

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

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    
    try {
      // Format the data for the API
      const requestData = {
        ...data,
        proposedNames: data.proposedNames.filter(name => name.name.trim() !== ''),
        metadata: {
          ...data.metadata,
          keywords: data.metadata.keywords || [],
          competitors: data.metadata.competitors
            ? data.metadata.competitors.split(',').map(s => s.trim()).filter(Boolean)
            : []
        },
        // Add mock user data for development
        ...(process.env.NODE_ENV === 'development' && {
          userId: 'dev-user-id-' + Date.now(),
          userName: 'Developer User',
          userEmail: 'dev@example.com',
          isDevMode: true
        })
      };
      
      console.log('Prepared request data:', JSON.stringify(requestData, null, 2));
      
      // Log before dispatch
      console.log('Dispatching createNamingRequest...');
      
      const resultAction = await dispatch(createNamingRequest(requestData));
      console.log('Dispatch result:', resultAction);
      
      if (createNamingRequest.fulfilled.match(resultAction)) {
        console.log('Request successful, resetting form...');
        setSnackbarMessage('Naming request submitted successfully!');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        
        // Don't redirect in development, just show success
        if (process.env.NODE_ENV !== 'development') {
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
        
        reset();
      } else {
        const error = resultAction.payload || resultAction.error || { message: 'Failed to submit request' };
        console.error('Submission error details:', {
          error,
          action: resultAction,
          timestamp: new Date().toISOString()
        });
        
        // Show error but don't redirect in development
        setSnackbarMessage(error.message || 'Failed to submit request');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (err) {
      console.error('Error in onSubmit:', err);
      const errorMessage = err.message || 'Failed to submit naming request';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  if (formConfigLoading) {
    return <CircularProgress />;
  }

  if (formConfigError) {
    return <Alert severity="error">{formConfigError.msg || 'Failed to load form configuration.'}</Alert>;
  }

  if (!activeFormConfig) {
    return <Typography>No active form available.</Typography>;
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {activeFormConfig.name}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {activeFormConfig.description}
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        {activeFormConfig.fields.map((field) => (
          <DynamicFormField key={field._id} field={field} control={control} errors={errors} />
        ))}
        <Box sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" color="primary">
            Submit Request
          </Button>
        </Box>
      </form>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SubmitRequest;