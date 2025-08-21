import React from 'react';
import { useFieldArray, Controller } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Typography
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ReactSimpleWYSIWYG from "react-simple-wysiwyg";

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'content', label: 'Content Block' },
  // Add other field types as needed
];

const FieldEditor = ({ control, register, errors }) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
  });

  const getFieldKey = (field, idx) => field._id || field.id || String(idx);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  return (
    <Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="fields-list">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                bgcolor: 'background.default',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                minHeight: 100,
              }}
            >
              {fields.map((field, idx) => (
                <Draggable key={getFieldKey(field, idx)} draggableId={getFieldKey(field, idx)} index={idx}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                        p: 1.5,
                        bgcolor: snapshot.isDragging ? 'action.selected' : 'background.paper',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
                        boxShadow: snapshot.isDragging ? 3 : 1,
                        color: 'text.primary',
                      }}
                    >
                      <Box {...provided.dragHandleProps} sx={{ cursor: 'grab', color: 'text.secondary', mr: 1 }}>
                        <DragIndicatorIcon />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          {...register(`fields.${idx}.label`)}
                          label="Label"
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          error={!!errors?.fields?.[idx]?.label}
                          helperText={errors?.fields?.[idx]?.label?.message}
                        />
                        <TextField
                          {...register(`fields.${idx}.name`)}
                          label="Name"
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          error={!!errors?.fields?.[idx]?.name}
                          helperText={errors?.fields?.[idx]?.name?.message}
                        />
                        <TextField
                          {...register(`fields.${idx}.fieldType`)}
                          label="Type"
                          size="small"
                          select
                          sx={{ mr: 1, mb: 1, minWidth: 120 }}
                          error={!!errors?.fields?.[idx]?.fieldType}
                          helperText={errors?.fields?.[idx]?.fieldType?.message}
                        >
                          {FIELD_TYPES.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        <FormControlLabel
                          control={
                            <Checkbox
                              {...register(`fields.${idx}.required`)}
                              defaultChecked={field.required}
                            />
                          }
                          label="Required"
                          sx={{ mb: 1 }}
                        />
                        {field.fieldType === 'content' && (
                          <TextField
                            {...register(`fields.${idx}.content`)}
                            label="Content"
                            size="small"
                            multiline
                            sx={{ mb: 1 }}
                            error={!!errors?.fields?.[idx]?.content}
                            helperText={errors?.fields?.[idx]?.content?.message}
                          />
                        )}
                      </Box>
                      <IconButton onClick={() => remove(idx)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => append({ label: '', name: '', fieldType: '', required: false })}
        >
          Add Field
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => append({ label: '', name: '', fieldType: 'content', required: false, content: '' })}
        >
          Add Content Block
        </Button>
      </Box>
    </Box>
  );
};

export default FieldEditor;