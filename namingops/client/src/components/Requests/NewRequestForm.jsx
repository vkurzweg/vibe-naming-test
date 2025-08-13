import React from 'react';
import { Box, Paper, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import DynamicFormRenderer from '../DynamicForm/DynamicFormRenderer';

// --- Dynamic Zod Schema Helpers ---
function zodTypeForField(field) {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return field.required ? z.string().min(1, { message: 'Required' }) : z.string().optional();
    case 'email':
      return field.required
        ? z.string().email({ message: 'Invalid email' })
        : z.string().email({ message: 'Invalid email' }).optional();
    case 'number':
      return field.required
        ? z.coerce.number({ invalid_type_error: 'Must be a number' })
        : z.coerce.number().optional();
    case 'checkbox':
      return z.boolean().optional();
    default:
      return z.any();
  }
}

function buildZodSchemaFromFields(fields) {
  const shape = {};
  for (const field of fields) {
    shape[field.name] = zodTypeForField(field);
  }
  return z.object(shape);
}

export default function NewRequestForm({ onSuccess }) {
  const queryClient = useQueryClient();
  const { data: formConfigRaw, isLoading, error } = useQuery({
    queryKey: ['formConfig'],
    queryFn: async () => {
      const res = await api.get('/api/v1/form-configurations/active');
      return res.data;
    },
  });

  // Normalize fields: convert fieldType -> type for compatibility with renderer
  const normalizedFields = formConfigRaw?.fields?.map(field => ({
    ...field,
    type: field.fieldType || field.type,
  }));
  const normalizedFormConfig = formConfigRaw
    ? { ...formConfigRaw, fields: normalizedFields }
    : null;

  // --- Build dynamic Zod schema ---
  const dynamicSchema = normalizedFormConfig
    ? buildZodSchemaFromFields(normalizedFormConfig.fields)
    : z.object({});

  const { control, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(dynamicSchema),
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      console.log('Submitting data:', data);
      const res = await api.post('/api/v1/name-requests', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myRequests']);
      if (onSuccess) onSuccess();
      reset();
    },
  });

  if (isLoading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Failed to load form configuration.</Alert>;
  if (!normalizedFormConfig || !normalizedFormConfig.fields || !normalizedFormConfig.fields.length) {
    return <Alert severity="warning">No form configuration available. Please contact an administrator.</Alert>;
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" mb={2}>Submit New Request</Typography>
      <form onSubmit={handleSubmit(mutation.mutate)}>
        <DynamicFormRenderer
          formConfig={normalizedFormConfig}
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          role="submitter"
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? <CircularProgress size={20} /> : 'Submit Request'}
          </Button>
        </Box>
      </form>
      {mutation.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Request submitted!</Alert>}
      {mutation.isError && <Alert severity="error" sx={{ mt: 2 }}>{mutation.error.message}</Alert>}
    </Paper>
  );
}