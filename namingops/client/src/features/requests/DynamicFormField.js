import React from 'react';
import { Controller } from 'react-hook-form';
import { TextField, Checkbox, FormControlLabel, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const DynamicFormField = ({ field, control, errors }) => {
  const { name, label, fieldType, required, options } = field;

  switch (fieldType) {
    case 'text':
    case 'textarea':
      return (
        <Controller
          name={name}
          control={control}
          defaultValue=""
          rules={{ required: required && 'This field is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label={label}
              fullWidth
              multiline={fieldType === 'textarea'}
              rows={fieldType === 'textarea' ? 4 : 1}
              margin="normal"
              error={!!errors[name]}
              helperText={errors[name]?.message}
            />
          )}
        />
      );
    case 'checkbox':
      return (
        <Controller
          name={name}
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label={label}
            />
          )}
        />
      );
    case 'select':
      return (
        <FormControl fullWidth margin="normal">
          <InputLabel>{label}</InputLabel>
          <Controller
            name={name}
            control={control}
            defaultValue=""
            rules={{ required: required && 'This field is required' }}
            render={({ field }) => (
              <Select {...field} label={label} error={!!errors[name]}>
                {options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>
      );
    default:
      return null;
  }
};

export default DynamicFormField;
