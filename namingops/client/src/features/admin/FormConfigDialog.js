import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from '@mui/material';
import FieldEditor from './FieldEditor';

const validationSchema = yup.object().shape({
  name: yup.string().required('Form name is required'),
  description: yup.string(),
  fields: yup.array().of(
    yup.object().shape({
      name: yup.string().matches(/^\S*$/, 'Field name cannot contain spaces').required('Field name is required'),
      label: yup.string().required('Field label is required'),
      fieldType: yup.string().required('Field type is required'),
      required: yup.boolean(),
    })
  ),
});

const FormConfigDialog = ({ open, onClose, onSubmit, initialData }) => {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: initialData || { name: '', description: '', fields: [] },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({ name: '', description: '', fields: [] });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Edit Form Configuration' : 'Create New Form Configuration'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Form Name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                />
              )}
            />
          </Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Fields</Typography>
          <FieldEditor control={control} register={register} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {initialData ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormConfigDialog;
