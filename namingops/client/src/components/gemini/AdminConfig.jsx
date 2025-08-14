import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Button, Switch, IconButton, List, ListItem, ListItemText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  fetchGeminiConfig, addConfigItem, updateConfigItem, deleteConfigItem, updateBasePrompt
} from '../services/gemini';

const ConfigSection = ({ title, items, element, onAdd, onToggle, onEdit, onDelete }) => {
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditingValue(item.text);
  };

  const saveEdit = (item) => {
    if (editingValue.trim() && editingValue !== item.text) {
      onEdit(item._id, editingValue);
    }
    setEditingId(null);
    setEditingValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6">{title}</Typography>
      <List>
        {items.map(item => (
          <ListItem key={item._id}>
            {editingId === item._id ? (
              <>
                <TextField
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  size="small"
                  sx={{ mr: 2, flex: 1 }}
                />
                <Button
                  onClick={() => saveEdit(item)}
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                  disabled={!editingValue.trim()}
                >
                  Save
                </Button>
                <Button
                  onClick={cancelEdit}
                  variant="outlined"
                  color="secondary"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <ListItemText
                  primary={item.text}
                  secondary={item.active ? 'Active' : 'Inactive'}
                />
                <Button
                  onClick={() => startEdit(item)}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Switch checked={item.active} onChange={() => onToggle(item._id, !item.active)} />
                <IconButton onClick={() => onDelete(item._id)}><DeleteIcon /></IconButton>
              </>
            )}
          </ListItem>
        ))}
        <ListItem>
          <TextField
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder={`Add new ${title.toLowerCase()}`}
            size="small"
          />
          <Button onClick={() => { onAdd(newText); setNewText(''); }} disabled={!newText.trim()}>Add</Button>
        </ListItem>
      </List>
    </Box>
  );
};

export default function AdminGeminiConfig() {
  const [config, setConfig] = useState(null);
  const [editingBasePrompt, setEditingBasePrompt] = useState(false);
  const [basePromptValue, setBasePromptValue] = useState('');

  useEffect(() => {
    fetchGeminiConfig().then(cfg => {
      setConfig(cfg);
      setBasePromptValue(cfg?.basePrompt?.text || '');
    });
  }, []);

  if (!config) return null;

  // Handlers for add/toggle/delete/edit
  const handleAdd = (element) => (text) => addConfigItem(element, text).then(fetchGeminiConfig).then(setConfig);
  const handleToggle = (element) => (id, active) => updateConfigItem(element, id, { active }).then(fetchGeminiConfig).then(setConfig);
  const handleDelete = (element) => (id) => deleteConfigItem(element, id).then(fetchGeminiConfig).then(setConfig);
  const handleEdit = (element) => (id, newText) =>
    updateConfigItem(element, id, { text: newText })
      .then(fetchGeminiConfig)
      .then(setConfig);

  // Inline editing UI for basePrompt
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Gemini Generator Configuration</Typography>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Base Prompt</Typography>
        {editingBasePrompt ? (
          <>
            <TextField
              value={basePromptValue}
              onChange={e => setBasePromptValue(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mr: 1 }}
              disabled={!basePromptValue.trim()}
              onClick={() => {
                updateBasePrompt({ text: basePromptValue })
                  .then(fetchGeminiConfig)
                  .then(cfg => {
                    setConfig(cfg);
                    setEditingBasePrompt(false);
                  });
              }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => {
                setBasePromptValue(config.basePrompt.text);
                setEditingBasePrompt(false);
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ flex: 1 }}>
              {config.basePrompt.text}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ ml: 2 }}
              onClick={() => setEditingBasePrompt(true)}
            >
              Edit
            </Button>
          </Box>
        )}
      </Box>
      <ConfigSection
        title="Principles"
        items={config.principles}
        element="principles"
        onAdd={handleAdd('principles')}
        onToggle={handleToggle('principles')}
        onEdit={handleEdit('principles')}
        onDelete={handleDelete('principles')}
      />
      <ConfigSection
        title="Dos"
        items={config.dos}
        element="dos"
        onAdd={handleAdd('dos')}
        onToggle={handleToggle('dos')}
        onEdit={handleEdit('dos')}
        onDelete={handleDelete('dos')}
      />
      <ConfigSection
        title="Don'ts"
        items={config.donts}
        element="donts"
        onAdd={handleAdd('donts')}
        onToggle={handleToggle('donts')}
        onEdit={handleEdit('donts')}
        onDelete={handleDelete('donts')}
      />
    </Box>
  );
}