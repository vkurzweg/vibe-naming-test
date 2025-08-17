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
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const FormConfigEditor = ({ config, onSave, onCancel, loading }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      fields: [{ name: '', fieldType: 'text', label: '', required: false, options: [] }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
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

  const onDragEnd = (result) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        {config ? 'Edit Form Configuration' : 'New Form Configuration'}
      </Typography>
      <form onSubmit={handleSubmit(onSave)}>
        <Box mb={3}>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Form name is required' }}
            render={({ field }) => (
              <TextField {...field} label="Form Name" fullWidth error={!!errors.name} helperText={errors.name?.message} />
            )}
          />
        </Box>
        <Box mb={3}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Description" fullWidth multiline minRows={2} />
            )}
          />
        </Box>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" mb={2}>Fields</Typography>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="fields-droppable" direction="vertical">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {fields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <Box
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        sx={{ mb: 2, background: dragSnapshot.isDragging ? '#f0f0fa' : 'transparent', borderRadius: 1, boxShadow: dragSnapshot.isDragging ? 2 : 0 }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span {...dragProvided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                              <DragIndicatorIcon fontSize="small" sx={{ color: '#b0b0c3' }} />
                            </span>
                          </Grid>
                          <Grid item xs={11}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={4}>
                                <Controller
                                  name={`fields.${index}.name`}
                                  control={control}
                                  rules={{ required: 'Field name is required' }}
                                  render={({ field }) => (
                                    <TextField {...field} label="Field Name" fullWidth error={!!errors.fields?.[index]?.name} helperText={errors.fields?.[index]?.name?.message} />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Controller
                                  name={`fields.${index}.label`}
                                  control={control}
                                  rules={{ required: 'Field label is required' }}
                                  render={({ field }) => (
                                    <TextField {...field} label="Field Label" fullWidth error={!!errors.fields?.[index]?.label} helperText={errors.fields?.[index]?.label?.message} />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <Controller
                                  name={`fields.${index}.fieldType`}
                                  control={control}
                                  render={({ field }) => (
                                    <FormControl fullWidth>
                                      <InputLabel>Type</InputLabel>
                                      <Select {...field} label="Type">
                                        <MenuItem value="text">Text</MenuItem>
                                        <MenuItem value="textarea">Textarea</MenuItem>
                                        <MenuItem value="select">Select</MenuItem>
                                        <MenuItem value="content">Content Block</MenuItem>
                                      </Select>
                                    </FormControl>
                                  )}
                                />
                              </Grid>
                              <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton color="error" onClick={() => remove(index)} size="small">
                                  <DeleteIcon />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <Box mt={2}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => append({ name: '', fieldType: 'text', label: '', required: false, options: [] })}>
            Add Field
          </Button>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Box display="flex" gap={2} mt={3}>
          <Button variant="contained" color="primary" type="submit" startIcon={<SaveIcon />} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
          <Button variant="outlined" color="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default FormConfigEditor;