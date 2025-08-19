import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Paper, TextField, Button, CircularProgress, Alert
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { fetchGeminiNames, fetchGeminiConfig } from '../../services/gemini';
import { composeGeminiPrompt } from './PromptComposer';
import GeminiSparkle from './GeminiButton';

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
      const composedPrompt = composeGeminiPrompt(config, prompt);
      const response = await fetchGeminiNames(composedPrompt);
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 5 }}>
            Welcome to NamingHQ
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            An MVP for scaling domain expertise and knowledge management 🚀 
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 8 }}>
            Click the icon on the upper right to manage requests and configure the Gemini generator ✨
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 8 }}>
          <TextField
            label="What are you naming?"
            variant="outlined"
            fullWidth
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
          />
          <GeminiSparkle onClick={handleGenerate} disabled={loading || !prompt.trim()} />
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
        {!!names.length && (
          <Paper
            elevation={0}
              variant="outlined"
            sx={{
              mt: 0,
              mb: 3,
              p: 0,
              ml: 0,
              boxShadow: '0 2px 12px 0 rgba(90,70,255,0.15)',
              filter: 'brightness(1.1)',
              borderImage: 'linear-gradient(90deg, #5a46ff, #e05cff, #00d5ff, #00ffc8) 1',
              maxWidth: 'none',
              alignSelf: 'flex-start',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, px: 3, pt: 3, textAlign: 'left' }}>
              Gemini Suggestions
            </Typography>
            <TextField
              value={names.join('\n\n')}
              variant="standard"
              fullWidth
              multiline
              minRows={Math.min(6, names.length)}
              inputProps={{ style: { textAlign: 'left' } }}
              InputProps={{
                readOnly: true,
                disableUnderline: true,
                sx: {
                  background: 'transparent',
                  px: 3,
                  pb: 3,
                  fontSize: '1.1rem',
                  color: 'text.primary',
                  fontFamily: 'inherit',
                  lineHeight: 1.7,
                  letterSpacing: '0.01em',
                },
              }}
            />
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default WelcomeTab;