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
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  LinearProgress,
  Divider,
} from '@mui/material';
import { 
  Close as CloseIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { createNamingRequest } from '../../features/naming/namingSlice';
import { loadActiveFormConfig, selectActiveFormConfig, selectIsLoading } from '../../features/formConfig/formConfigSlice';
import DynamicFormRenderer from '../DynamicForm/DynamicFormRenderer';
import { motion, AnimatePresence } from 'framer-motion';

const SubmitRequestModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  
  // Get the form config state from Redux using selectors
  const activeFormConfig = useSelector(selectActiveFormConfig);
  const formConfigLoading = useSelector(selectIsLoading);
  const { loading: submitting } = useSelector((state) => state.naming);
  const [formConfigError, setFormConfigError] = useState(null);
  
  // React Hook Form setup
  const { control, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {}
  });
  
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Animation for success message
  const successVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring', 
        stiffness: 280, 
        damping: 20 
      }
    }
  };

  // Load active form config when modal opens
  useEffect(() => {
    if (open) {
      console.log('SubmitRequestModal opened - loading form config');
      dispatch(loadActiveFormConfig())
        .unwrap()
        .then(data => {
          console.log('Form config loaded successfully:', data);
          setFormConfigError(null);
          
          // If form config has default values, set them
          if (data && data.fields) {
            const defaultValues = {};
            data.fields.forEach(field => {
              if (field.defaultValue !== undefined) {
                defaultValues[field.name] = field.defaultValue;
                setValue(field.name, field.defaultValue);
              }
            });
            console.log('Setting default values:', defaultValues);
          }
        })
        .catch(error => {
          console.error('Error loading form config:', error);
          setFormConfigError(error.message || 'Failed to load form configuration');
        });
      
      // Reset form and states when modal opens
      reset();
      setSubmitSuccess(false);
      setSubmitError(null);
    }
  }, [open, dispatch, reset, setValue]);

  // Test validation function - can be used for debugging
  const testValidation = () => {
    console.log('Current form errors:', errors);
    console.log('Current form values:', watch());
    console.log('Active form config:', activeFormConfig);
    
    // Check if required fields are filled
    if (activeFormConfig && activeFormConfig.fields) {
      const requiredFields = activeFormConfig.fields.filter(field => field.required);
      const formValues = watch();
      
      requiredFields.forEach(field => {
        const value = formValues[field.name];
        console.log(`Field ${field.name} (required): ${value ? 'Filled' : 'Empty'}`);
      });
    }
  };

  // Handle form submission with React Hook Form
  const onSubmit = async (formData) => {
    try {
      console.log('Submitting form with data:', formData);
      
      if (!activeFormConfig) {
        throw new Error('No active form configuration available');
      }
      
      // Validate required fields
      const requiredFields = activeFormConfig.fields.filter(field => field.required);
      const missingFields = requiredFields.filter(field => !formData[field.name]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      }
      
      const payload = {
        title: activeFormConfig?.header || 'Naming Request',
        description: activeFormConfig?.description || '',
        formData,
        formConfigId: activeFormConfig?._id,
        formConfigName: activeFormConfig?.name
      };
      
      console.log('Submitting request with payload:', payload);
      
      const result = await dispatch(createNamingRequest(payload)).unwrap();
      console.log('Request submitted successfully:', result);
      
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form after closing
        reset();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting request:', error);
      setSubmitError(error.message || 'Failed to submit request. Please try again.');
    }
  };

  // Success state
  if (submitSuccess) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={successVariants}
          >
            <Box textAlign="center" py={4}>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" color="success.main" gutterBottom>
                Request Submitted Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your naming request has been submitted and is now under review.
              </Typography>
            </Box>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  // Loading state
  if (formConfigLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Loading Form</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading form configuration...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (formConfigError) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Form Configuration Error</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {formConfigError}
          </Alert>
          <Button 
            variant="outlined"
            onClick={() => dispatch(loadActiveFormConfig())}
            fullWidth
          >
            Retry Loading Form Configuration
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // No form configuration available
  if (!activeFormConfig || !activeFormConfig.fields || activeFormConfig.fields.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">No Form Available</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            No form configuration is currently available. Please contact an administrator to set up the form configuration.
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {activeFormConfig.header || 'Submit Name Request'}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {activeFormConfig.description && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {activeFormConfig.description}
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </>
        )}
        
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        
        <form id="submit-request-form" onSubmit={handleSubmit(onSubmit)}>
          <DynamicFormRenderer
            formConfig={activeFormConfig}
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
          />
        </form>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={submitting}
          aria-label="cancel"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
          aria-label="submit request"
          form="submit-request-form"
          type="submit"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
        {process.env.NODE_ENV === 'development' && (
          <Button
            onClick={testValidation}
            color="secondary"
            variant="outlined"
            size="small"
            sx={{ ml: 1 }}
          >
            Test Validation
          </Button>
        )}
      </DialogActions>
      
      {submitting && (
        <LinearProgress />
      )}
    </Dialog>
  );
};

export default SubmitRequestModal;
