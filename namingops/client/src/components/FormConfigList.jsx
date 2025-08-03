import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Tooltip,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const FormConfigList = ({ formConfigs, activeConfigId, onEdit, onDelete, onSetActive }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          md: '1fr 1fr 1fr',
        },
        gap: 3,
      }}
    >
      {formConfigs.map((config) => (
        <Box key={config._id} sx={{ height: '100%' }}>
          <Card
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              border: config._id === activeConfigId ? '2px solid' : '1px solid',
              borderColor: config._id === activeConfigId ? 'primary.main' : 'divider',
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="h6" component="div" gutterBottom>
                  {config.name}
                </Typography>
                {config._id === activeConfigId && (
                  <Chip label="Active" color="success" size="small" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {config.description || 'No description provided.'}
              </Typography>
            </CardContent>
            <CardActions
              sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
                px: 2,
                py: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Tooltip title={config._id === activeConfigId ? 'Deactivate' : 'Activate'}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config._id === activeConfigId}
                      onChange={() => onSetActive(config._id)}
                      color="primary"
                    />
                  }
                  label={config._id === activeConfigId ? 'Active' : 'Inactive'}
                  sx={{ mr: 'auto' }} // Pushes the actions to the right
                />
              </Tooltip>
              <Box>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => onEdit(config)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => onDelete(config._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardActions>
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default FormConfigList;
