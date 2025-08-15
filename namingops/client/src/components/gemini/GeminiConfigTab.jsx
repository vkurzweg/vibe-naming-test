import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, TextField, Button, Alert, CircularProgress } from '@mui/material';
import api from '../../services/api'; // Make sure this is your axios instance

const GeminiConfigTab = () => {
  const [apiKey, setApiKey] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch current config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/v1/gemini-config');
        if (res.data) {
          setApiKey(res.data.apiKey || '');
          setDefaultPrompt(res.data.defaultPrompt || '');
        }
      } catch (err) {
        setError('Failed to load Gemini configuration.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/api/v1/gemini-config', { apiKey, defaultPrompt });
      setSuccess('Configuration saved!');
    } catch (err) {
      setError('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Gemini Generator Configuration
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Gemini API Key"
          variant="outlined"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          fullWidth
          type="password"
        />
        <TextField
          label="Default Prompt Template"
          variant="outlined"
          value={defaultPrompt}
          onChange={e => setDefaultPrompt(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
      </Box>
    </Paper>
  );
};

export default GeminiConfigTab;