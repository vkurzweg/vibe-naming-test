import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Paper, TextField, CircularProgress, Alert, Grid
} from '@mui/material';
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
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 } }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Box sx={{ mb: { xs: 2, md: 3 } }}>
              <Typography variant="h4" fontWeight={700} sx={{ mb: { xs: 2, md: 3 } }}>
                Welcome to NamingHQ
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 1, md: 2 } }}>
                This MVP is for scaling knowledge management across domains 🚀 
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 2, md: 4 } }}>
                Click the icon on the upper right to access dashboards for other roles
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={9}>
            <TextField
              label="What are you naming?"
              variant="outlined"
              fullWidth
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
              }}
            />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <GeminiSparkle
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              sx={{
                width: '100%',
                minWidth: 0,
                height: '56px',
                fontSize: { xs: '0.95rem', md: '1rem' },
                fontWeight: 400,
              }}
            />
          </Grid>
          <Grid item xs={12}>
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
                      fontSize: { xs: '0.95rem', md: '1.1rem' },
                      color: 'text.primary',
                      fontFamily: 'inherit',
                      lineHeight: 1.7,
                      letterSpacing: '0.01em',
                    },
                  }}
                />
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default WelcomeTab;