import React, { useState } from 'react';
import { Box, Paper, Typography, Alert, CircularProgress, Button, Grid } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import DynamicFormRenderer from '../DynamicForm/DynamicFormRenderer';
import { fetchGeminiConfig, fetchGeminiNames } from '../../services/gemini';
import { composeGeminiPrompt } from '../gemini/PromptComposer';

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

  // Fetch form config
  const { data: formConfigRaw, isLoading, error } = useQuery({
    queryKey: ['formConfig'],
    queryFn: async () => {
      const res = await api.get('/api/v1/form-configurations/active');
      return res.data;
    },
  });

  // Fetch Gemini config
  const { data: geminiConfig, isLoading: geminiLoading, error: geminiError } = useQuery({
    queryKey: ['geminiConfig'],
    queryFn: fetchGeminiConfig,
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
      const res = await api.post('/api/v1/name-requests', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myRequests']);
      if (onSuccess) onSuccess();
      reset();
      setRationale('');
      setEvaluation('');
    },
  });

  // --- Gemini Integration State and Handlers ---
  const [geminiLoadingLocal, setGeminiLoadingLocal] = useState(false);
  const [geminiErrorLocal, setGeminiErrorLocal] = useState('');
  const [rationale, setRationale] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [evalLoading, setEvalLoading] = useState(false);

  // Suggest Names with Gemini
  const handleGenerateNames = async () => {
    const formValues = watch();
    if (!formValues.description || !formValues.description.trim()) {
      setGeminiErrorLocal('Please enter a description before generating names.');
      return;
    }
    setGeminiLoadingLocal(true);
    setGeminiErrorLocal('');
    setRationale('');
    try {
      // Compose prompt using Gemini config and user description
      const prompt = composeGeminiPrompt(geminiConfig, formValues.description || '');
      console.log('Gemini prompt:', prompt); // <-- Add this line
      const result = await fetchGeminiNames(prompt);

      // Parse Gemini response (adjust as needed for your output format)
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const nameLines = text.split('\n').filter(line => line.trim().length > 0);
      const names = nameLines.filter(l => /^\d+\./.test(l)).map(l => l.replace(/^\d+\.\s*/, ''));
      const rationaleLine = nameLines.find(l => l.toLowerCase().includes('rationale:'));
      setValue('proposedName1', names[0] || '');
      setValue('proposedName2', names[1] || '');
      setRationale(rationaleLine ? rationaleLine.replace(/rationale:/i, '').trim() : '');
    } catch (err) {
      setGeminiErrorLocal('Could not generate names. You may have hit the Gemini API quota.');
    } finally {
      setGeminiLoadingLocal(false);
    }
  };

  // Evaluate a user-provided name with Gemini
  const handleEvaluateName = async () => {
  setEvalLoading(true);
  setEvaluation('');
  setGeminiErrorLocal('');
  try {
    const formValues = watch();
    // Collect all proposed names from form values
    const proposedNames = Object.keys(formValues)
      .filter(key => key.startsWith('proposedName') && formValues[key])
      .map(key => formValues[key]);

    if (!proposedNames.length) {
      setGeminiErrorLocal('Please enter at least one name to evaluate.');
      setEvalLoading(false);
      return;
    }

    // Evaluate each name using Gemini and admin config
    const evaluations = [];
    for (const name of proposedNames) {
      const evalPrompt = composeGeminiPrompt(geminiConfig, `Evaluate this name: "${name}"`);
      const result = await fetchGeminiNames(evalPrompt);
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      evaluations.push({ name, evaluation: text });
    }

    // Format the evaluations for display
    setEvaluation(
      evaluations.map(ev => `**${ev.name}**\n${ev.evaluation}`).join('\n\n')
    );
  } catch (err) {
    setGeminiErrorLocal('Could not evaluate names.');
  } finally {
    setEvalLoading(false);
  }
};

  if (isLoading || geminiLoading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (error || geminiError) return <Alert severity="error">Failed to load form or Gemini configuration.</Alert>;
  if (!normalizedFormConfig || !normalizedFormConfig.fields || !normalizedFormConfig.fields.length) {
    return <Alert severity="warning">No form configuration available. Please contact an administrator.</Alert>;
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <form onSubmit={handleSubmit(mutation.mutate)}>
        <Box sx={{ flexGrow: 1 }}>
          <DynamicFormRenderer
            formConfig={normalizedFormConfig}
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            fetchGeminiNames={fetchGeminiNames}
            composeGeminiPrompt={composeGeminiPrompt}
            geminiConfig={geminiConfig}
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
          {mutation.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Request submitted!</Alert>}
          {mutation.isError && <Alert severity="error" sx={{ mt: 2 }}>{mutation.error.message}</Alert>}
        </Box>
      </form>
    </Paper>
  );
}