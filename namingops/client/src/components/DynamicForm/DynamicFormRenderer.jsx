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
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Warning as ReviewIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { getStatusColor } from '../../theme/newColorPalette';
import { Controller } from 'react-hook-form';

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
  fetchGeminiNames,
  composeGeminiPrompt,
}) => {
  const theme = useTheme();
  const [formError, setFormError] = useState(null);

  // Gemini content state
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState('');
  const [rationale, setRationale] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [evalLoading, setEvalLoading] = useState(false);

  // Watch all form values for conditional logic
  const formValues = watch ? watch() : formData;

  // Gemini Handlers
  const handleGenerateNames = async () => {
    if (!fetchGeminiNames || !composeGeminiPrompt) {
      setGeminiError('Gemini integration is not available.');
      return;
    }
    setGeminiLoading(true);
    setGeminiError('');
    setRationale('');
    try {
      const prompt = composeGeminiPrompt(formConfig, formValues.description || '');
      const result = await fetchGeminiNames(prompt);

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const nameLines = text.split('\n').filter(line => line.trim().length > 0);
      const names = nameLines.filter(l => /^\d+\./.test(l)).map(l => l.replace(/^\d+\.\s*/, ''));
      const rationaleLine = nameLines.find(l => l.toLowerCase().includes('rationale:'));
      setValue('proposedName1', names[0] || '');
      setValue('proposedName2', names[1] || '');
      setRationale(rationaleLine ? rationaleLine.replace(/rationale:/i, '').trim() : '');
    } catch (err) {
      setGeminiError('Could not generate names. You may have hit the Gemini API quota.');
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleEvaluateName = async () => {
    if (!fetchGeminiNames) {
      setGeminiError('Gemini integration is not available.');
      return;
    }
    setEvalLoading(true);
    setEvaluation('');
    setGeminiError('');
    try {
      const nameToEvaluate = formValues.proposedName1 || '';
      if (!nameToEvaluate) {
        setGeminiError('Please enter a name to evaluate.');
        setEvalLoading(false);
        return;
      }
      const evalPrompt = `Evaluate the following name for the project, considering branding, memorability, and fit: "${nameToEvaluate}". Give a brief assessment and rationale.`;
      const result = await fetchGeminiNames(evalPrompt);
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setEvaluation(text);
    } catch (err) {
      setGeminiError('Could not evaluate name.');
    } finally {
      setEvalLoading(false);
    }
  };

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
    const fieldType = field.type || field.fieldType;
    const fieldName = field.name;
    const isFieldReadonly = readonly || (field.readonly && field.readonly.includes(role));
    const fieldError = errors?.[fieldName];
    const errorMessage = formatErrorMessage(fieldError);

    if (field.condition && !evaluateCondition(field.condition, formValues)) {
      return null;
    }

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
      case 'file':
        return (
          <Controller
            name={fieldName}
            control={control}
            defaultValue={[]}
            render={({ field: { onChange, value } }) => (
              <Box>
                <Button variant="outlined" component="label">
                  {field.label || "Upload File"}
                  <input
                    type="file"
                    hidden
                    multiple={field.multiple}
                    accept={field.allowedFileTypes?.map(ext => '.' + ext).join(',')}
                    onChange={e => onChange([...e.target.files])}
                  />
                </Button>
                {Array.isArray(value) && value.length > 0 && (
                  <Box mt={1}>
                    {value.map((file, idx) => (
                      <Typography key={idx} variant="body2">{file.name}</Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          />
        );
      case 'content':
        return (
          <Box sx={{ mb: 2 }}>
            <div dangerouslySetInnerHTML={{ __html: field.content || '' }} />
          </Box>
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
      case 'status':
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
    <Grid container spacing={8} alignItems="flex-start">
      {/* Form Fields Column */}
      <Grid item xs={12} md={6}>
        <Grid container spacing={1}>
          {formConfig.fields.map((field, idx) => (
            <Grid item xs={10} key={field.name || idx}>
              {renderField(field)}
            </Grid>
          ))}
        </Grid>
        {formError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {formError}
          </Alert>
        )}
      </Grid>
      {/* Gemini Section Column */}
      <Grid item xs={12} md={6}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleGenerateNames}
            disabled={geminiLoading}
          >
            {geminiLoading ? <CircularProgress size={20} /> : 'Suggest Names with Gemini'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleEvaluateName}
            disabled={evalLoading || !formValues.proposedName1}
          >
            {evalLoading ? <CircularProgress size={20} /> : 'Evaluate Name with Gemini'}
          </Button>
        </Box>
        {geminiError && <Alert severity="error" sx={{ mb: 2 }}>{geminiError}</Alert>}
        {rationale && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Gemini Rationale:</strong> {rationale}
          </Alert>
        )}
        {evaluation && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Gemini Evaluation:</strong> {evaluation}
          </Alert>
        )}
        {/* Gemini Display Container */}
        <Box
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(30,30,30,0.85)'
              : 'rgba(255,255,255,0.85)',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
            boxShadow: 'none',
            color: theme.palette.text.primary,
            p: { xs: 2, sm: 3 },
            minHeight: 200,
            maxHeight: 600,
            overflowY: 'auto',
            transition: 'background 0.2s',
            mt: 2,
          }}
          aria-label="Gemini Output"
        >
          {(rationale || evaluation) ? (
            <>
              {rationale && (
                <Typography variant="body1" sx={{ wordBreak: 'break-word', fontSize: '1.05rem', mb: 1 }}>
                  <strong>Rationale:</strong> {rationale}
                </Typography>
              )}
              {evaluation && (
                <Typography variant="body1" sx={{ wordBreak: 'break-word', fontSize: '1.05rem' }}>
                  <strong>Evaluation:</strong> {evaluation}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Gemini suggestions and evaluations will appear here.
            </Typography>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default DynamicFormRenderer;