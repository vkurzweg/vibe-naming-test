import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { createNamingRequest } from '../../features/naming/namingSlice';
import { loadActiveFormConfig } from '../../features/formConfig/formConfigSlice';

const SubmitRequestModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  
  // Get the form config state
  const { activeFormConfig, loading: formConfigLoading, error: formConfigError } = useSelector((state) => state.formConfig);
  const { loading: submitting } = useSelector((state) => state.naming);
  
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Load active form config when modal opens
  useEffect(() => {
    if (open) {
      dispatch(loadActiveFormConfig());
      // Reset form data when modal opens
      setFormData({});
      setFormErrors({});
      setSubmitSuccess(false);
    }
  }, [open, dispatch]);
  
  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    // Always validate required default fields
    if (!formData.requestTitle || formData.requestTitle.trim() === '') {
      errors.requestTitle = 'Request Title is required';
      isValid = false;
    }
    
    if (!formData.description || formData.description.trim() === '') {
      errors.description = 'Description is required';
      isValid = false;
    }
    
    // Validate fields that are in the active form config
    if (activeFormConfig && activeFormConfig.fields) {
      activeFormConfig.fields.forEach(field => {
        if (field.required && (!formData[field.name] || formData[field.name].trim() === '')) {
          errors[field.name] = `${field.label} is required`;
          isValid = false;
        }
      });
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const payload = {
      title: formData.requestTitle || 'Naming Request',
      description: formData.description || '',
      formData
    };
    
    dispatch(createNamingRequest(payload))
      .unwrap()
      .then(() => {
        setSubmitSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      })
      .catch((error) => {
        console.error('Error submitting request:', error);
        // Show error to user
        setFormErrors(prev => ({
          ...prev,
          submit: error.message || 'Failed to submit request. Please try again.'
        }));
      });
  };
  
  // Render form fields based on active form config
  const renderFormFields = () => {
    if (formConfigLoading) {
      return (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (formConfigError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formConfigError}
          <Button 
            size="small" 
            sx={{ mt: 1 }}
            onClick={() => dispatch(loadActiveFormConfig())}
          >
            Retry
          </Button>
        </Alert>
      );
    }
    
    if (!activeFormConfig || !activeFormConfig.fields || activeFormConfig.fields.length === 0) {
      return (
        <Alert severity="warning">
          No form configuration available. Please contact an administrator.
        </Alert>
      );
    }
    
    // Add default fields if not present in form config
    const defaultFields = [
      {
        name: 'requestTitle',
        label: 'Request Title',
        type: 'text',
        required: true,
        fullWidth: true,
        helperText: 'Enter a title for your naming request'
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        required: true,
        fullWidth: true,
        multiline: true,
        rows: 4,
        helperText: 'Describe what you need named and any relevant details'
      }
    ];
    
    // Combine default fields with form config fields
    const allFields = [...defaultFields, ...activeFormConfig.fields];
    
    return (
      <Grid container spacing={3}>
        {allFields.map((field) => (
          <Grid item xs={12} sm={field.fullWidth ? 12 : 6} key={field.name}>
            {field.type === 'text' && (
              <TextField
                label={field.label}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                fullWidth
                variant="outlined"
                required={field.required}
                error={!!formErrors[field.name]}
                helperText={formErrors[field.name] || field.helperText}
                multiline={field.multiline}
                rows={field.multiline ? 4 : 1}
              />
            )}
            {field.type === 'select' && (
              <FormControl 
                fullWidth 
                variant="outlined"
                required={field.required}
                error={!!formErrors[field.name]}
              >
                <InputLabel>{field.label}</InputLabel>
                <Select
                  label={field.label}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                >
                  {field.options && field.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {(formErrors[field.name] || field.helperText) && (
                  <FormHelperText>
                    {formErrors[field.name] || field.helperText}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          </Grid>
        ))}
      </Grid>
    );
  };
  
  if (submitSuccess) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={4}>
            <Typography variant="h5" gutterBottom color="primary">
              Request Submitted Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              Your naming request has been submitted and will be reviewed by our team.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={onClose}
              sx={{ mt: 3 }}
            >
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (formConfigLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">New Naming Request</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {formConfigError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formConfigError}
          </Alert>
        )}
        
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            {activeFormConfig?.description || 'Please fill out the form below to submit a new naming request.'}
          </Typography>
          
          {activeFormConfig && (
            <Chip 
              label={`Form: ${activeFormConfig.name}`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {renderFormFields()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitRequestModal;
