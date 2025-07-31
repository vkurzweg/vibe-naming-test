import React from 'react';
import { useFieldArray, Controller } from 'react-hook-form';
import { Box, TextField, Button, IconButton, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const FieldEditor = ({ control, register }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  return (
    <Box>
      {fields.map((item, index) => (
        <Box key={item.id} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              {...register(`fields.${index}.label`)}
              label="Field Label"
              defaultValue={item.label}
              sx={{ mr: 1, flexGrow: 1 }}
            />
            <TextField
              {...register(`fields.${index}.name`)}
              label="Field Name (no spaces)"
              defaultValue={item.name}
              sx={{ mr: 1, flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 120, mr: 1 }}>
              <InputLabel>Field Type</InputLabel>
              <Controller
                name={`fields.${index}.fieldType`}
                control={control}
                defaultValue={item.fieldType || 'text'}
                render={({ field }) => (
                  <Select {...field} label="Field Type">
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="textarea">Textarea</MenuItem>
                    <MenuItem value="select">Select</MenuItem>
                    <MenuItem value="checkbox">Checkbox</MenuItem>
                    <MenuItem value="radio">Radio</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
            <FormControlLabel
              control={
                <Controller
                  name={`fields.${index}.required`}
                  control={control}
                  defaultValue={item.required || false}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label="Required"
            />
            <IconButton onClick={() => remove(index)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      ))}
      <Button
        onClick={() =>
          append({ name: '', label: '', fieldType: 'text', required: false })
        }
      >
        Add Field
      </Button>
    </Box>
  );
};

export default FieldEditor;
