import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Box, TextField, Button, Alert, CircularProgress, IconButton, Switch, Divider } from '@mui/material';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
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
      <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Gemini Generator Configuration
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>Base Prompt</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="Base Prompt"
              variant="outlined"
              value={basePrompt.text}
              onChange={e => setBasePrompt({ ...basePrompt, text: e.target.value })}
              fullWidth
              multiline
              minRows={2}
              helperText="General instructions to guide Gemini's naming style."
              sx={{ flex: 1 }}
            />
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">Active</Typography>
              <Switch
                checked={basePrompt.active}
                onChange={e => setBasePrompt({ ...basePrompt, active: e.target.checked })}
              />
            </Box>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        {fieldListSections.map(section => (
          <Box key={section.key} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>{section.label}</Typography>
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
                            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, background: dragSnapshot.isDragging ? '#f0f0fa' : 'transparent', borderRadius: 1, boxShadow: dragSnapshot.isDragging ? 2 : 0 }}
                          >
                            <span {...dragProvided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                              <DragIndicator fontSize="small" sx={{ color: '#b0b0c3', mr: 1 }} />
                            </span>
                            <TextField
                              value={item.text}
                              onChange={e => handleListChange(section.key, idx, 'text', e.target.value)}
                              label={`${section.label.slice(0, -1)} ${idx + 1}`}
                              fullWidth
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <Typography variant="body2">Active</Typography>
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
            >
              Add {section.label.slice(0, -1)}
            </Button>
          </Box>
        ))}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
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
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
      </Paper>
    </Box>
  );
};

export default GeminiConfigTab;