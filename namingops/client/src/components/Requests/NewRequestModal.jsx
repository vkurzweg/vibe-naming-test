import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { createNamingRequest } from '../../features/naming/namingSlice';
import { loadActiveFormConfig } from '../../features/formConfig/formConfigSlice';

const NewRequestModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { activeFormConfig, loading: formConfigLoading, error: formConfigError } = useSelector((state) => state.formConfig);
  const { loading: submitting, error: submissionError } = useSelector((state) => state.naming);
  
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  
  // Load active form config when modal opens
  useEffect(() => {
    if (open) {
      dispatch(loadActiveFormConfig());
      // Reset form data when modal opens
      setFormData({});
      setFormErrors({});
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
    
    // Only validate fields that are in the active form config
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
      title: activeFormConfig?.name || 'Naming Request',
      formData
    };
    
    dispatch(createNamingRequest(payload))
      .unwrap()
      .then(() => {
        onClose();
      })
      .catch((error) => {
        console.error('Error submitting request:', error);
      });
  };
  
  // Render form fields based on active form config
  const renderFormFields = () => {
    if (!activeFormConfig || !activeFormConfig.fields || activeFormConfig.fields.length === 0) {
      return (
        <Alert severity="warning">
          No form configuration available. Please contact an administrator.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {activeFormConfig.fields.map((field) => (
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
        
        {submissionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submissionError}
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
          startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewRequestModal;
