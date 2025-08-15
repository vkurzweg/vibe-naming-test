import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Paper, TextField, Button, CircularProgress, Alert, Chip
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { fetchGeminiNames, fetchGeminiConfig } from '../../services/gemini';
import { composeGeminiPrompt } from './PromptComposer';

const WelcomeTab = () => {
  const [prompt, setPrompt] = useState('');
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetchGeminiConfig().then(setConfig);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setNames([]);
    try {
      // Compose the prompt using admin config + user input
      const composedPrompt = composeGeminiPrompt(config, prompt);
      const response = await fetchGeminiNames(composedPrompt);
      // Parse Gemini response (adjust as needed for your API shape)
      const suggestions = response?.candidates?.[0]?.content?.parts?.[0]?.text?.split('\n').filter(Boolean) || [];
      setNames(suggestions);
    } catch (err) {
      setError('Failed to generate names. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'left', mb: 2 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mt: '2rem', ml: '2rem', mr: '2rem', mb: '2rem', textAlign: 'left'}}>
            Welcome to NamingHQ
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: '2rem', ml: '2rem', mr: '2rem', textAlign: 'left'}}>
            An MVP for scaling domain expertise and knowledge management 🚀 
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: '2rem', mb: '2rem', ml: '2rem', mr: '2rem', textAlign: 'left'}}>
            Click the icon on the upper right to manage requests and configure the Gemini generator ✨
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, padding: '2rem' }}>
          <TextField
            label="Describe your project"
            variant="outlined"
            fullWidth
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            sx={{ minWidth: 160 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Names'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {!!names.length && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Gemini Suggestions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {names.map((name, idx) => (
                <Chip key={idx} label={name} color="secondary" sx={{ fontSize: 16, p: 2 }} />
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default WelcomeTab;