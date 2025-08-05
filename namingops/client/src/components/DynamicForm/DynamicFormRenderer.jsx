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
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Warning as ReviewIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getStatusColor } from '../../theme/newColorPalette';

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
const evaluateCondition = (condition, formData) => {
  if (!condition) return true;
  // Simple condition evaluation - can be enhanced
  return true;
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

// Render form field based on configuration
const renderFormField = (field, value, onChange, readonly, role) => {
  const fieldName = field.name;
  const fieldValue = value || '';
  const isFieldReadonly = readonly || (field.readonly && field.readonly.includes(role));
  const fieldProps = {
    fullWidth: true,
    variant: 'outlined',
    size: 'medium',
    disabled: isFieldReadonly,
    sx: { mb: 2 }
  };

  // Handle conditional field visibility
  if (field.condition && !evaluateCondition(field.condition, value)) {
    return null;
  }

  switch (field.fieldType || field.type) {
    case 'text':
    case 'email':
      return (
        <TextField
          key={fieldName}
          label={field.label || field.name}
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          helperText={field.description}
          required={field.required}
          error={field.error}
          InputProps={{
            startAdornment: field.icon && (
              <InputAdornment position="start">
                {field.icon}
              </InputAdornment>
            )
          }}
        />
      );

    case 'textarea':
      return (
        <TextField
          {...fieldProps}
          label={field.label || field.name}
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          helperText={field.description}
          required={field.required}
          multiline
          rows={field.rows || 4}
          maxRows={field.maxRows || 8}
        />
      );

    case 'select':
    case 'dropdown':
      return (
        <FormControl {...fieldProps} error={field.error}>
          <InputLabel>{field.label || field.name}</InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            label={field.label || field.name}
          >
            {(field.options || []).map((option) => (
              <MenuItem key={option.value || option} value={option.value || option}>
                {option.label || option}
              </MenuItem>
            ))}
          </Select>
          {field.description && <Typography variant="body2" color="text.secondary">{field.description}</Typography>}
        </FormControl>
      );

    case 'checkbox':
    case 'boolean':
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(value)}
              onChange={(e) => onChange(field.name, e.target.checked)}
              disabled={fieldProps.disabled}
            />
          }
          label={field.label || field.name}
          sx={fieldProps.sx}
        />
      );

    case 'date':
      return (
        <TextField
          {...fieldProps}
          label={field.label || field.name}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText={field.description}
          required={field.required}
        />
      );

    case 'datetime':
      return (
        <TextField
          {...fieldProps}
          label={field.label || field.name}
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText={field.description}
          required={field.required}
        />
      );

    case 'number':
      return (
        <TextField
          {...fieldProps}
          label={field.label || field.name}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(field.name, parseFloat(e.target.value) || 0)}
          placeholder={field.placeholder}
          helperText={field.description}
          required={field.required}
          inputProps={{
            min: field.min,
            max: field.max,
            step: field.step || 1
          }}
        />
      );

    case 'status':
      if (isFieldReadonly) {
        return (
          <Box sx={fieldProps.sx}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {field.label || field.name}
            </Typography>
            <Chip
              label={value || 'Unknown'}
              color={getStatusChipColor(value)}
              size="small"
              icon={getStatusIcon(value)}
            />
          </Box>
        );
      }
      return renderFormField({ ...field, type: 'select' }, value, onChange, readonly, role);

    case 'divider':
      return (
        <Divider sx={{ my: 3 }}>
          {field.label && (
            <Typography variant="body2" color="text.secondary">
              {field.label}
            </Typography>
          )}
        </Divider>
      );
      
    case 'display':
      return (
        <Box sx={fieldProps.sx}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {field.label || field.name}
          </Typography>
          <Typography variant="body1">
            {value || field.defaultValue || 'N/A'}
          </Typography>
        </Box>
      );

    default:
      return (
        <TextField
          {...fieldProps}
          label={field.label || field.name}
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          helperText={field.description}
          required={field.required}
        />
      );
  }
};

const DynamicFormRenderer = ({ 
  formConfig, 
  formData = {}, 
  role = 'submitter', 
  readonly = false,
  onSubmit,
  onChange,
  showSubmitButton = false,
  submitButtonText = 'Submit'
}) => {
  const [localFormData, setLocalFormData] = useState(formData);
  const theme = useTheme();

  // Update local form data when prop changes
  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  // Handle field changes
  const handleFieldChange = (fieldName, value) => {
    const newFormData = {
      ...localFormData,
      [fieldName]: value
    };
    setLocalFormData(newFormData);
    
    if (onChange) {
      onChange(newFormData);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(localFormData);
    }
  };

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

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {formConfig.fields.map((field, index) => (
          <Grid item xs={12} sm={field.width === 'half' ? 6 : 12} key={field.name || index}>
            {renderFormField(
              field, 
              localFormData[field.name], 
              handleFieldChange, 
              readonly, 
              role
            )}
          </Grid>
        ))}
      </Grid>
      
      {showSubmitButton && !readonly && (
        <Box mt={3}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="medium"
            sx={{
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            {submitButtonText}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DynamicFormRenderer;
