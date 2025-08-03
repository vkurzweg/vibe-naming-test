import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Tooltip,
  Chip,
  Grid,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';

const FormConfigList = ({ formConfigs, activeConfigId, onEdit, onDelete, onSetActive, onPreview }) => {
  return (
    <Grid container spacing={3}>
      {formConfigs.map((config) => (
        <Grid item xs={12} md={6} lg={4} key={config._id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: config._id === activeConfigId ? '2px solid' : '1px solid', borderColor: config._id === activeConfigId ? 'primary.main' : 'divider' }}>
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
            <CardActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2, py: 1, background: theme => theme.palette.action.hover }}>
              <FormControlLabel
                control={
                  <Tooltip title={config._id === activeConfigId ? 'Deactivate' : 'Activate'}>
                    <Switch
                      checked={config._id === activeConfigId}
                      onChange={() => onSetActive(config._id)}
                      color="primary"
                    />
                  </Tooltip>
                }
                label={config._id === activeConfigId ? 'Active' : 'Inactive'}
              />
              <Box sx={{ ml: 'auto' }}>
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
        </Grid>
      ))}
    </Grid>
  );
};

export default FormConfigList;
