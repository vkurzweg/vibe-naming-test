import React, { useState } from 'react';
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
import { fetchGeminiNames } from '../../services/gemini'; // Adjust path as needed

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
    return true;
  }
  return true;
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
  control,
  errors,
  setValue,
  watch,
  role = 'submitter',
  readonly = false,
}) => {
  const theme = useTheme();
  const [formError, setFormError] = useState(null);

  // --- Gemini state for per-field actions ---
  const [geminiLoadingField, setGeminiLoadingField] = useState(null); // field name loading
  const [geminiErrorField, setGeminiErrorField] = useState({});
  const [geminiEvalField, setGeminiEvalField] = useState({});

  // Watch all form values for conditional logic
  const formValues = watch ? watch() : formData;

  if (!formConfig || !formConfig.fields || formConfig.fields.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          No form configuration available
        </Typography>
      </Box>
    );
  }

  // --- Gemini handlers ---
  const handleGeminiSuggest = async (field) => {
    setGeminiLoadingField(field.name);
    setGeminiErrorField({});
    try {
      const description = formValues.description || '';
      const prompt = `Suggest a creative, on-brand name for: "${description}"`;
      const result = await fetchGeminiNames(prompt);
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const suggested = text.split('\n').find(line => line.trim().length > 0) || text;
      setValue(field.name, suggested);
    } catch (err) {
      setGeminiErrorField(prev => ({ ...prev, [field.name]: 'Gemini error: Could not generate suggestion.' }));
    } finally {
      setGeminiLoadingField(null);
    }
  };

  const handleGeminiEvaluate = async (field) => {
    setGeminiLoadingField(field.name + '_eval');
    setGeminiEvalField({});
    setGeminiErrorField({});
    try {
      const value = formValues[field.name];
      if (!value) {
        setGeminiErrorField(prev => ({ ...prev, [field.name]: 'Please enter a name to evaluate.' }));
        setGeminiLoadingField(null);
        return;
      }
      const evalPrompt = `Evaluate this name for branding and fit: "${value}". Give a brief rationale.`;
      const result = await fetchGeminiNames(evalPrompt);
      setGeminiEvalField(prev => ({
        ...prev,
        [field.name]: result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      }));
    } catch (err) {
      setGeminiErrorField(prev => ({ ...prev, [field.name]: 'Gemini error: Could not evaluate.' }));
    } finally {
      setGeminiLoadingField(null);
    }
  };

  // Render form fields with React Hook Form integration
  const renderField = (field) => {
    // Support both .type and .fieldType for legacy configs
    const fieldType = field.type || field.fieldType;
    const fieldName = field.name;
    const isFieldReadonly = readonly || (field.readonly && field.readonly.includes(role));
    const fieldError = errors?.[fieldName];
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

    // --- Gemini Buttons (rendered inline for text fields) ---
    const renderGeminiButtons = () => (
      (field.geminiSuggest || field.geminiEvaluate) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          {field.geminiSuggest && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleGeminiSuggest(field)}
              disabled={geminiLoadingField === field.name}
            >
              {geminiLoadingField === field.name
                ? <CircularProgress size={16} />
                : (field.geminiSuggestLabel || 'Suggest with Gemini')}
            </Button>
          )}
          {field.geminiEvaluate && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleGeminiEvaluate(field)}
              disabled={geminiLoadingField === field.name + '_eval' || !formValues[field.name]}
            >
              {geminiLoadingField === field.name + '_eval'
                ? <CircularProgress size={16} />
                : (field.geminiEvaluateLabel || 'Evaluate with Gemini')}
            </Button>
          )}
          {geminiErrorField[field.name] && (
            <Typography color="error" variant="body2">{geminiErrorField[field.name]}</Typography>
          )}
          {geminiEvalField[field.name] && (
            <Typography color="primary" variant="body2"><strong>Gemini Evaluation:</strong> {geminiEvalField[field.name]}</Typography>
          )}
          {field.geminiHelperText && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {field.geminiHelperText}
            </Typography>
          )}
        </Box>
      )
    );

    switch (fieldType) {
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
              <Box>
                <TextField
                  {...commonProps}
                  label={field.label}
                  type={fieldType}
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
                {renderGeminiButtons()}
              </Box>
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
                {fieldError && (
                  <FormHelperText error>{errorMessage}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        );
      case 'status': // Custom display for status fields
        return (
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{field.label}</Typography>
            <StatusDisplay value={formValues[fieldName]} />
          </Box>
        );
      default:
        return (
          <Alert severity="warning" sx={{ my: 2 }}>
            Unknown field type: <b>{fieldType}</b>
          </Alert>
        );
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {formConfig.fields.map((field, idx) => (
          <Grid item xs={12} sm={field.fullWidth ? 12 : 6} key={field.name || idx}>
            {renderField(field)}
          </Grid>
        ))}
      </Grid>
      {formError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {formError}
        </Alert>
      )}
    </Box>
  );
};

export default DynamicFormRenderer;