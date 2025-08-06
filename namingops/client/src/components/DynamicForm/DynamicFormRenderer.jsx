import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  Chip,
  Grid,
  FormHelperText,
  Divider,
  InputAdornment,
  Radio,
  RadioGroup,
  Autocomplete,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Warning as ReviewIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getStatusColor } from '../../theme/newColorPalette';
import { Controller } from 'react-hook-form';

// Status display component
const StatusDisplay = ({ value }) => {
  const statusColor = getStatusColor(value);
  
  return (
    <Chip
      label={value?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
      sx={{
        backgroundColor: statusColor,
        color: '#fff',
        fontWeight: 600,
        fontSize: '0.75rem'
      }}
    />
  );
};

// Helper function to evaluate field conditions
const evaluateCondition = (condition, formValues) => {
  if (!condition) return true;
  
  try {
    // Handle different condition types
    if (condition.type === 'equals') {
      return formValues[condition.field] === condition.value;
    } else if (condition.type === 'notEquals') {
      return formValues[condition.field] !== condition.value;
    } else if (condition.type === 'contains') {
      const fieldValue = formValues[condition.field];
      return Array.isArray(fieldValue) 
        ? fieldValue.includes(condition.value)
        : String(fieldValue).includes(condition.value);
    } else if (condition.type === 'notEmpty') {
      const value = formValues[condition.field];
      return value !== undefined && value !== null && value !== '';
    } else if (condition.type === 'isEmpty') {
      const value = formValues[condition.field];
      return value === undefined || value === null || value === '';
    } else if (condition.type === 'greaterThan') {
      return Number(formValues[condition.field]) > Number(condition.value);
    } else if (condition.type === 'lessThan') {
      return Number(formValues[condition.field]) < Number(condition.value);
    } else if (condition.type === 'and' && Array.isArray(condition.conditions)) {
      return condition.conditions.every(subCondition => 
        evaluateCondition(subCondition, formValues)
      );
    } else if (condition.type === 'or' && Array.isArray(condition.conditions)) {
      return condition.conditions.some(subCondition => 
        evaluateCondition(subCondition, formValues)
      );
    }
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return true; // Default to showing the field if there's an error
  }
  
  return true; // Default to showing the field
};

// Helper function to get status chip color
const getStatusChipColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return 'success';
    case 'rejected': return 'error';
    case 'pending': return 'warning';
    case 'under_review': return 'info';
    default: return 'default';
  }
};

// Helper function to get status icon
const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return <ApprovedIcon />;
    case 'pending': return <PendingIcon />;
    case 'under_review': return <ReviewIcon />;
    default: return null;
  }
};

// Helper function to format validation error messages
const formatErrorMessage = (error) => {
  if (!error) return null;
  
  if (typeof error === 'string') return error;
  
  if (error.type === 'required') return 'This field is required';
  if (error.type === 'pattern') return 'Invalid format';
  if (error.type === 'minLength') return `Minimum ${error.requiredLength} characters required`;
  if (error.type === 'maxLength') return `Maximum ${error.requiredLength} characters allowed`;
  if (error.type === 'min') return `Minimum value is ${error.min}`;
  if (error.type === 'max') return `Maximum value is ${error.max}`;
  
  return error.message || 'Invalid value';
};

const DynamicFormRenderer = ({ 
  formConfig, 
  formData = {}, 
  control, // React Hook Form control
  errors, // React Hook Form errors
  setValue, // React Hook Form setValue function
  watch, // React Hook Form watch function
  role = 'submitter', 
  readonly = false,
}) => {
  const theme = useTheme();
  const [formError, setFormError] = useState(null);
  
  // Watch all form values for conditional logic
  const formValues = watch ? watch() : formData;

  // If no form config, show a simple message
  if (!formConfig || !formConfig.fields || formConfig.fields.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          No form configuration available
        </Typography>
      </Box>
    );
  }

  // Render form fields with React Hook Form integration
  const renderField = (field) => {
    const fieldName = field.name;
    const isFieldReadonly = readonly || (field.readonly && field.readonly.includes(role));
    const fieldError = errors[fieldName];
    const errorMessage = formatErrorMessage(fieldError);
    
    // Check if field should be displayed based on conditions
    if (field.condition && !evaluateCondition(field.condition, formValues)) {
      return null;
    }
    
    // Common props for all field types
    const commonProps = {
      fullWidth: true,
      size: "medium",
      margin: "normal",
      disabled: isFieldReadonly,
      error: !!fieldError,
      helperText: errorMessage || field.helperText,
      required: field.required,
      sx: {
        mb: 2,
        ...(field.style || {}),
      }
    };

    // Render different field types
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url':
        return (
          <Controller
            name={fieldName}
            control={control}
            defaultValue={field.defaultValue || ''}
            rules={{
              required: field.required ? 'This field is required' : false,
              pattern: field.pattern ? {
                value: new RegExp(field.pattern),
                message: field.patternMessage || 'Invalid format'
              } : undefined,
              minLength: field.minLength ? {
                value: field.minLength,
                message: `Minimum ${field.minLength} characters required`
              } : undefined,
              maxLength: field.maxLength ? {
                value: field.maxLength,
                message: `Maximum ${field.maxLength} characters allowed`
              } : undefined,
              validate: field.validate
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                {...commonProps}
                label={field.label}
                type={field.type}
                onChange={onChange}
                onBlur={onBlur}
                value={value || ''}
                inputRef={ref}
                placeholder={field.placeholder}
                InputProps={{
                  startAdornment: field.prefix ? (
                    <InputAdornment position="start">{field.prefix}</InputAdornment>
                  ) : null,
                  endAdornment: field.suffix ? (
                    <InputAdornment position="end">{field.suffix}</InputAdornment>
                  ) : null,
                }}
              />
            )}
          />
        );

      case 'textarea':
        return (
          <Controller
            name={fieldName}
            control={control}
            defaultValue={field.defaultValue || ''}
            rules={{
              required: field.required ? 'This field is required' : false,
              minLength: field.minLength ? {
                value: field.minLength,
                message: `Minimum ${field.minLength} characters required`
              } : undefined,
              maxLength: field.maxLength ? {
                value: field.maxLength,
                message: `Maximum ${field.maxLength} characters allowed`
              } : undefined
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                {...commonProps}
                label={field.label}
                multiline
                rows={field.rows || 4}
                onChange={onChange}
                onBlur={onBlur}
                value={value || ''}
                inputRef={ref}
                placeholder={field.placeholder}
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={fieldName}
            control={control}
            defaultValue={field.defaultValue || ''}
            rules={{
              required: field.required ? 'This field is required' : false
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <FormControl {...commonProps}>
                <InputLabel id={`${fieldName}-label`}>{field.label}</InputLabel>
                <Select
                  labelId={`${fieldName}-label`}
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value || ''}
                  inputRef={ref}
                  label={field.label}
                >
                  {field.options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {fieldError && (
                  <FormHelperText error>{errorMessage}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        );

      case 'checkbox':
        return (
          <Controller
            name={fieldName}
            control={control}
            defaultValue={field.defaultValue || false}
            rules={{
              required: field.required ? 'This field is required' : false
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <FormControl {...commonProps} error={!!fieldError}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!value}
                      onChange={onChange}
                      onBlur={onBlur}
                      inputRef={ref}
                      color="primary"
                    />
                  }
                  label={field.label}
                />
                {fieldError && (
                  <FormHelperText error>{errorMessage}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        );

      case 'radio':
        return (
          <Controller
            name={fieldName}
            control={control}
            defaultValue={field.defaultValue || ''}
            rules={{
              required: field.required ? 'This field is required' : false
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <FormControl {...commonProps}>
                <Typography variant="subtitle2" gutterBottom>
                  {field.label} {field.required && <span style={{ color: theme.palette.error.main }}>*</span>}
                </Typography>
                <RadioGroup
                  value={value || ''}
                  onChange={onChange}
                  onBlur={onBlur}
                  ref={ref}
                  row={field.row}
                >
                  {field.options?.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={option.label}
                      disabled={isFieldReadonly}
                    />
                  ))}
                </RadioGroup>
                {fieldError && (
                  <FormHelperText error>{errorMessage}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        );

      case 'autocomplete':
        return (
          <Controller
            name={fieldName}
            control={control}
            defaultValue={field.defaultValue || (field.multiple ? [] : null)}
            rules={{
              required: field.required ? 'This field is required' : false
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <FormControl {...commonProps}>
                <Autocomplete
                  multiple={field.multiple}
                  options={field.options || []}
                  getOptionLabel={(option) => option.label || option}
                  value={value || (field.multiple ? [] : null)}
                  onChange={(_, newValue) => onChange(newValue)}
                  onBlur={onBlur}
                  disabled={isFieldReadonly}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={field.label}
                      error={!!fieldError}
                      helperText={errorMessage || field.helperText}
                      required={field.required}
                      inputRef={ref}
                    />
                  )}
                />
              </FormControl>
            )}
          />
        );

      case 'number':
        return (
          <Controller
            name={fieldName}
            control={control}
            defaultValue={field.defaultValue || ''}
            rules={{
              required: field.required ? 'This field is required' : false,
              min: field.min !== undefined ? {
                value: field.min,
                message: `Minimum value is ${field.min}`
              } : undefined,
              max: field.max !== undefined ? {
                value: field.max,
                message: `Maximum value is ${field.max}`
              } : undefined
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                {...commonProps}
                label={field.label}
                type="number"
                onChange={onChange}
                onBlur={onBlur}
                value={value || ''}
                inputRef={ref}
                placeholder={field.placeholder}
                InputProps={{
                  startAdornment: field.prefix ? (
                    <InputAdornment position="start">{field.prefix}</InputAdornment>
                  ) : null,
                  endAdornment: field.suffix ? (
                    <InputAdornment position="end">{field.suffix}</InputAdornment>
                  ) : null,
                }}
                inputProps={{
                  min: field.min,
                  max: field.max,
                  step: field.step || 1
                }}
              />
            )}
          />
        );

      case 'date':
        return (
          <Controller
            name={fieldName}
            control={control}
            defaultValue={field.defaultValue || ''}
            rules={{
              required: field.required ? 'This field is required' : false
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                {...commonProps}
                label={field.label}
                type="date"
                onChange={onChange}
                onBlur={onBlur}
                value={value || ''}
                inputRef={ref}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: field.min,
                  max: field.max
                }}
              />
            )}
          />
        );

      case 'status':
        return (
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {field.label}
            </Typography>
            <StatusDisplay value={formValues[fieldName] || field.defaultValue || 'pending'} />
          </Box>
        );

      case 'divider':
        return (
          <Box sx={{ my: 3 }}>
            {field.label && (
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                {field.label}
              </Typography>
            )}
            <Divider />
          </Box>
        );

      case 'heading':
        return (
          <Typography 
            variant={field.variant || 'h6'} 
            sx={{ 
              mt: 3, 
              mb: 2, 
              color: theme.palette.primary.main,
              ...field.style
            }}
          >
            {field.label}
          </Typography>
        );

      case 'info':
        return (
          <Alert 
            severity={field.severity || 'info'} 
            icon={field.hideIcon ? false : undefined}
            sx={{ my: 2 }}
          >
            {field.label && (
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {field.label}
              </Typography>
            )}
            {field.content}
          </Alert>
        );

      default:
        return (
          <Typography color="error">
            Unknown field type: {field.type}
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {formError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError}
        </Alert>
      )}
      
      {formConfig.fields.map((field, index) => (
        <React.Fragment key={`${field.name}-${index}`}>
          {renderField(field)}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default DynamicFormRenderer;
