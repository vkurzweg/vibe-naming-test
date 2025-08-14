import React, { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  IconButton,
  Paper,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';

const FormConfigEditor = ({ config, onSave, onCancel, loading }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      fields: [{ name: '', fieldType: 'text', label: '', required: false, options: [] }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  useEffect(() => {
    if (config) {
      reset(config);
    } else {
      reset({
        name: '',
        description: '',
        fields: [{ name: '', fieldType: 'text', label: '', required: false, options: [] }],
      });
    }
  }, [config, reset]);

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        {config ? 'Edit Configuration' : 'Create New Configuration'}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <form onSubmit={handleSubmit(onSave)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Configuration Name" error={!!errors.name} helperText={errors.name?.message} />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label="Description" multiline rows={1} />}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Form Fields</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => append({ name: '', fieldType: 'text', label: '', required: false, options: [] })}>
                Add Field
              </Button>
            </Box>
            {fields.map((field, index) => (
              <Paper key={field.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <Controller
                      name={`fields.${index}.name`}
                      control={control}
                      rules={{ required: 'Field name is required', pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'No spaces or special chars' } }}
                      render={({ field: controllerField }) => (
                        <TextField {...controllerField} fullWidth label="Field Name" size="small" error={!!errors.fields?.[index]?.name} helperText={errors.fields?.[index]?.name?.message} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Controller
                      name={`fields.${index}.fieldType`}
                      control={control}
                      rules={{ required: 'Type is required' }}
                      render={({ field: controllerField }) => (
                        <FormControl fullWidth size="small" error={!!errors.fields?.[index]?.fieldType}>
                          <InputLabel>Field Type</InputLabel>
                          <Select {...controllerField} label="Field Type">
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="textarea">Text Area</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="date">Date</MenuItem>
                            <MenuItem value="select">Dropdown</MenuItem>
                            <MenuItem value="checkbox">Checkbox</MenuItem>
                          </Select>
                          {errors.fields?.[index]?.fieldType && <FormHelperText>{errors.fields[index].fieldType.message}</FormHelperText>}
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name={`fields.${index}.label`}
                      control={control}
                      rules={{ required: 'Label is required' }}
                      render={({ field: controllerField }) => (
                        <TextField {...controllerField} fullWidth label="Display Label" size="small" error={!!errors.fields?.[index]?.label} helperText={errors.fields?.[index]?.label?.message} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Box display="flex" alignItems="center" justifyContent="flex-end">
                      <Controller
                        name={`fields.${index}.required`}
                        control={control}
                        render={({ field: controllerField }) => (
                          <FormControlLabel control={<Checkbox {...controllerField} checked={controllerField.value} />} label="Required" />
                        )}
                      />
                      <IconButton color="error" onClick={() => remove(index)}><DeleteIcon /></IconButton>
                    </Box>
                  </Grid>
                  {/* Gemini Integration Controls */}
                  <Grid item xs={12} md={2}>
                    <Controller
                      name={`fields.${index}.geminiSuggest`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <FormControlLabel
                          control={<Checkbox {...controllerField} checked={!!controllerField.value} />}
                          label="Gemini Suggest"
                        />
                      )}
                    />
                    <Controller
                      name={`fields.${index}.geminiEvaluate`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <FormControlLabel
                          control={<Checkbox {...controllerField} checked={!!controllerField.value} />}
                          label="Gemini Evaluate"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={10}>
                    <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`fields.${index}.geminiSuggestLabel`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <TextField
                              {...controllerField}
                              label="Suggest Button Label"
                              size="small"
                              sx={{ mr: 2, width: 180 }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`fields.${index}.geminiEvaluateLabel`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <TextField
                              {...controllerField}
                              label="Evaluate Button Label"
                              size="small"
                              sx={{ mr: 2, width: 180 }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`fields.${index}.geminiHelperText`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <TextField
                              {...controllerField}
                              label="Gemini Helper Text"
                              size="small"
                              sx={{ width: 200 }}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Button variant="outlined" onClick={onCancel} disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}>
                {config ? 'Update' : 'Save'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default FormConfigEditor;