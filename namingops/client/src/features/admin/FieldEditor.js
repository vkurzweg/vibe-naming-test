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

const FieldEditor = ({ control, register, errors }) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
  });

  const getFieldKey = (item, idx) => item._id || item.id || String(idx);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  return (
    <Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="fields-list">
          {(provided) => (
            <Box ref={provided.innerRef} {...provided.droppableProps}>
              {fields.map((item, index) => (
                <Draggable key={getFieldKey(item, index)} draggableId={getFieldKey(item, index)} index={index}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        boxShadow: snapshot.isDragging ? 3 : 1,
                        bgcolor: snapshot.isDragging ? 'action.selected' : 'background.paper',
                      }}
                    >
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                        <Box {...provided.dragHandleProps} sx={{ cursor: 'grab', mr: 1, mt: 2 }}>
                          <DragIndicatorIcon />
                        </Box>
                        {item.fieldType !== 'content' && (
                          <>
                            <TextField
                              {...register(`fields.${index}.label`)}
                              label="Field Label"
                              defaultValue={item.label}
                              sx={{ mr: 1, flexGrow: 1, minWidth: 180 }}
                              error={!!errors?.fields?.[index]?.label}
                              helperText={errors?.fields?.[index]?.label?.message}
                            />
                            <TextField
                              {...register(`fields.${index}.name`)}
                              label="Field Name (no spaces)"
                              defaultValue={item.name}
                              sx={{ mr: 1, flexGrow: 1, minWidth: 180 }}
                              error={!!errors?.fields?.[index]?.name}
                              helperText={errors?.fields?.[index]?.name?.message}
                            />
                          </>
                        )}
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
                                <MenuItem value="file">File Upload</MenuItem>
                                <MenuItem value="content">Content Block</MenuItem>
                              </Select>
                            )}
                          />
                        </FormControl>
                        {item.fieldType === 'content' && (
                          <Box sx={{ width: '100%', mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Content Block (Markdown, Links, Headings, Lists)
                            </Typography>
                            <Controller
                              name={`fields.${index}.content`}
                              control={control}
                              defaultValue={item.content || ''}
                              render={({ field }) => (
                                <ReactSimpleWYSIWYG value={field.value} onChange={field.onChange} />
                              )}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Supports Markdown: **bold**, _italic_, [links](https://...), lists, headings, etc.
                            </Typography>
                          </Box>
                        )}
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
                        {['text', 'textarea'].includes(item.fieldType) && (
                          <>
                            <FormControlLabel
                              control={
                                <Controller
                                  name={`fields.${index}.geminiSuggest`}
                                  control={control}
                                  defaultValue={item.geminiSuggest || false}
                                  render={({ field }) => (
                                    <Checkbox
                                      {...field}
                                      checked={!!field.value}
                                      color="primary"
                                    />
                                  )}
                                />
                              }
                              label="Gemini Suggest"
                            />
                            <FormControlLabel
                              control={
                                <Controller
                                  name={`fields.${index}.geminiEvaluate`}
                                  control={control}
                                  defaultValue={item.geminiEvaluate || false}
                                  render={({ field }) => (
                                    <Checkbox
                                      {...field}
                                      checked={!!field.value}
                                      color="primary"
                                    />
                                  )}
                                />
                              }
                              label="Gemini Evaluate"
                            />
                          </>
                        )}
                        <IconButton onClick={() => remove(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          onClick={() =>
            append({
              name: '',
              label: '',
              fieldType: 'text',
              required: false,
              geminiSuggest: false,
              geminiEvaluate: false
            })
          }
        >
          Add Field
        </Button>
        <Button
          variant="outlined"
          onClick={() =>
            append({
              fieldType: 'content',
              content: ''
            })
          }
        >
          Add Content Block
        </Button>
      </Box>
    </Box>
  );
};

export default FieldEditor;