import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Paper, TextField, CircularProgress, Alert, Grid, List, ListItem, ListItemText, Divider, Card, CardContent
} from '@mui/material';
import { fetchGeminiNames, fetchGeminiConfig } from '../../services/gemini';
import { composeGeminiPrompt } from './PromptComposer';
import GeminiSparkle from './GeminiButton';
import Markdown from 'markdown-to-jsx';

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
              <Card
                elevation={2}
                sx={{
                  mt: 0,
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: 2,
                  bgcolor: theme => theme.palette.background.paper,
                }}
              >
                <CardContent
                  sx={{
                    px: { xs: 3, md: 5 },
                    py: { xs: 3, md: 4 },
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, textAlign: 'left', fontWeight: 600 }}>
                    Gemini Suggestions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {names.map((name, idx) => (
                      <Typography
                        key={idx}
                        variant="body1"
                        color="text.secondary"
                        sx={{
                          textAlign: 'left',
                          fontWeight: 400,
                          py: 1,
                          mb: 0,
                          borderBottom: idx < names.length - 1 ? `1px solid ${theme => theme.palette.divider}` : 'none'
                        }}
                        component="div"
                      >
                        <Markdown
                          options={{
                            forceBlock: true,
                            overrides: {
                              p: {
                                component: Typography,
                                props: {
                                  variant: "body1",
                                  color: "text.secondary",
                                  sx: { m: 0 }
                                }
                              }
                            }
                          }}
                        >
                          {name}
                        </Markdown>
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default WelcomeTab;