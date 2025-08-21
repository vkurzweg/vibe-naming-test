import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Box, TextField, Button, Alert, CircularProgress, IconButton, Switch, Divider, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../../services/api';
import {
  DragDropContext,
  Droppable,
  Draggable
} from '@hello-pangea/dnd';

const fieldListSections = [
  { key: 'principles', label: 'Principles' },
  { key: 'dos', label: "Do's" },
  { key: 'donts', label: "Don'ts" },
];

const GeminiConfigTab = () => {
  const [basePrompt, setBasePrompt] = useState({ text: '', active: true });
  const [principles, setPrinciples] = useState([]);
  const [dos, setDos] = useState([]);
  const [donts, setDonts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const lastLoaded = useRef({});

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/v1/gemini/config');
        if (res.data) {
          setBasePrompt(res.data.basePrompt || { text: '', active: true });
          setPrinciples(res.data.principles || []);
          setDos(res.data.dos || []);
          setDonts(res.data.donts || []);
          lastLoaded.current = {
            basePrompt: res.data.basePrompt || { text: '', active: true },
            principles: res.data.principles || [],
            dos: res.data.dos || [],
            donts: res.data.donts || [],
          };
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
      await api.post('/api/v1/gemini/config', {
        basePrompt,
        principles,
        dos,
        donts,
      });
      setSuccess('Configuration saved!');
      lastLoaded.current = { basePrompt, principles, dos, donts };
    } catch (err) {
      setError('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBasePrompt(lastLoaded.current.basePrompt);
    setPrinciples(lastLoaded.current.principles);
    setDos(lastLoaded.current.dos);
    setDonts(lastLoaded.current.donts);
    setError('');
    setSuccess('');
  };

  // Helpers for list management
  const handleListChange = (section, idx, field, value) => {
    const setter =
      section === 'principles' ? setPrinciples : section === 'dos' ? setDos : setDonts;
    const list = section === 'principles' ? [...principles] : section === 'dos' ? [...dos] : [...donts];
    list[idx][field] = value;
    setter(list);
  };
  const handleAddItem = (section) => {
    const setter =
      section === 'principles' ? setPrinciples : section === 'dos' ? setDos : setDonts;
    setter((prev) => [...prev, { text: '', active: true }]);
  };
  const handleDeleteItem = (section, idx) => {
    const setter =
      section === 'principles' ? setPrinciples : section === 'dos' ? setDos : setDonts;
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  // Drag and drop handlers
  const handleDragEnd = (section, result) => {
    if (!result.destination) return;
    const items = section === 'principles' ? Array.from(principles)
      : section === 'dos' ? Array.from(dos)
      : Array.from(donts);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    if (section === 'principles') setPrinciples(items);
    if (section === 'dos') setDos(items);
    if (section === 'donts') setDonts(items);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{
        p: { xs: 2, sm: 4 },
        maxWidth: 900,
        mx: 'auto',
        mt: 3,
        bgcolor: theme => theme.palette.background.paper,
        boxShadow: 2,
      }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Gemini Configuration
        </Typography>
        <Divider sx={{ my: 2 }} />

        {/* Base Prompt */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: theme => theme.palette.background.paper,
            borderRadius: 2,
            mb: 3,
            width: '100%',
          }}
        >
          <TextField
            label="Base Prompt to Gemini (auto-generated)"
            value={
              `You are an expert naming assistant. When evaluating or generating names, apply the principles and criteria set by the admin.
${principles.filter(p => p.text).length > 0 ? `Principles: ${principles.filter(p => p.text).map(p => p.text).join('; ')}` : ''}
${dos.filter(d => d.text).length > 0 ? `Always: ${dos.filter(d => d.text).map(d => d.text).join('; ')}` : ''}
${donts.filter(d => d.text).length > 0 ? `Never: ${donts.filter(d => d.text).map(d => d.text).join('; ')}` : ''}

Use these guidelines to ensure your naming recommendations and evaluations are aligned with our standards. Respond in clear, concise language and explain how your suggestions meet the configured criteria.`
            }
            multiline
            minRows={7}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
            sx={{
              width: '100%',
              fontSize: '1rem',
              fontFamily: theme => theme.typography.fontFamily,
              color: theme => theme.palette.text.secondary,
              backgroundColor: theme => theme.palette.background.paper,
              '.MuiInputBase-input': {
                p: 2,
                fontSize: '1rem',
                color: theme => theme.palette.text.secondary,
                backgroundColor: theme => theme.palette.background.paper,
                borderRadius: 2,
              }
            }}
            helperText="This prompt is dynamically generated and will be sent to Gemini when users request name evaluations or suggestions."
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Config Sections as Accordions */}
        {fieldListSections.map(section => (
          <Accordion key={section.key} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={600}>{section.label}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <DragDropContext onDragEnd={result => handleDragEnd(section.key, result)}>
                <Droppable droppableId={section.key} direction="vertical">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {(section.key === 'principles' ? principles : section.key === 'dos' ? dos : donts).map((item, idx) => (
                        <Draggable key={idx} draggableId={`${section.key}-${idx}`} index={idx}>
                          {(dragProvided, dragSnapshot) => (
                            <Box
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                                background: dragSnapshot.isDragging ? theme => theme.palette.action.selected : theme => theme.palette.background.paper,
                                borderRadius: 2,
                                boxShadow: dragSnapshot.isDragging ? 2 : 0,
                                p: 1.5,
                              }}
                            >
                              <span {...dragProvided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                                <DragIndicator fontSize="small" sx={{ color: 'text.disabled', mr: 1 }} />
                              </span>
                              <TextField
                                value={item.text}
                                onChange={e => handleListChange(section.key, idx, 'text', e.target.value)}
                                label={`${section.label.slice(0, -1)} ${idx + 1}`}
                                fullWidth
                                size="small"
                                sx={{
                                  flex: 1,
                                  '.MuiInputBase-input': {
                                    fontSize: '0.95rem',
                                    color: theme => theme.palette.text.primary,
                                  }
                                }}
                              />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Active</Typography>
                              <Switch
                                checked={item.active}
                                onChange={e => handleListChange(section.key, idx, 'active', e.target.checked)}
                                size="small"
                              />
                              <IconButton onClick={() => handleDeleteItem(section.key, idx)} size="small" aria-label="Delete">
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => handleAddItem(section.key)}
                sx={{ mt: 1 }}
                fullWidth
              >
                Add {section.label.slice(0, -1)}
              </Button>
            </AccordionDetails>
          </Accordion>
        ))}

        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleReset}
            disabled={loading || saving}
          >
            Reset
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Paper>
    </Box>
  );
};

export default GeminiConfigTab;