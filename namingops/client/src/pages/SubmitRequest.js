// client/src/pages/SubmitRequest.js
import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { createNamingRequest } from '../features/naming/namingSlice';

const SubmitRequest = () => { 
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Submit Naming Request
      </Typography>
      
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Request Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Request Title *"
                  variant="outlined"
                  {...register('requestTitle', { 
                    required: 'Request title is required',
                    minLength: {
                      value: 5,
                      message: 'Title must be at least 5 characters'
                    }
                  })}
                  error={!!errors.requestTitle}
                  helperText={errors.requestTitle?.message}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  variant="outlined"
                  multiline
                  rows={4}
                  {...register('description', { 
                    required: 'Description is required',
                    minLength: {
                      value: 20,
                      message: 'Description must be at least 20 characters'
                    }
                  })}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              </Grid>

              {/* Priority */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.priority}>
                  <InputLabel id="priority-label">Priority *</InputLabel>
                  <Select
                    labelId="priority-label"
                    label="Priority *"
                    defaultValue="medium"
                    {...register('priority', { required: 'Priority is required' })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                  {errors.priority && (
                    <FormHelperText>{errors.priority.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Due Date */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register('dueDate')}
                />
              </Grid>

              {/* Proposed Names */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Proposed Names *
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {proposedNames.map((_, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          label={`Name ${index + 1} *`}
                          variant="outlined"
                          {...register(`proposedNames.${index}.name`, { 
                            required: 'Name is required',
                            validate: value => {
                              if (value.trim() === '') return 'Name cannot be empty';
                              // Check for duplicate names
                              const names = proposedNames.map((item, i) => 
                                i !== index ? item.name.toLowerCase() : ''
                              );
                              return !names.includes(value.toLowerCase()) || 'Name must be unique';
                            }
                          })}
                          error={!!errors.proposedNames?.[index]?.name}
                          helperText={errors.proposedNames?.[index]?.name?.message}
                        /> 
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Description (Optional)"
                          variant="outlined"
                          {...register(`proposedNames.${index}.description`)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1} sx={{ textAlign: 'center' }}>
                        {proposedNames.length > 1 && (
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveProposedName(index)}
                            aria-label="remove name"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                ))}

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddProposedName}
                  sx={{ mt: 1 }}
                >
                  Add Another Name
                </Button>
              </Grid>

              {/* Metadata */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Product/Service"
                      variant="outlined"
                      {...register('metadata.product')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Target Audience"
                      variant="outlined"
                      {...register('metadata.targetAudience')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Competitors (comma-separated)"
                      variant="outlined"
                      {...register('metadata.competitors')}
                      helperText="Enter competitor names separated by commas"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Keywords"
                      variant="outlined"
                      onKeyDown={handleAddKeyword}
                      helperText="Press Enter to add a keyword"
                    />
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {metadata.keywords?.map((keyword, index) => (
                        <Chip
                          key={index}
                          label={keyword}
                          onDelete={() => handleRemoveKeyword(keyword)}
                          size="small"
                        />
                      ))}
                    </Box>
                    <input
                      type="hidden"
                      {...register('metadata.keywords')}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

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
    </Box>
  );
};

export default SubmitRequest;