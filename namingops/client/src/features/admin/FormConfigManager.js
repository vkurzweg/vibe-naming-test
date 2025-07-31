import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Typography, List, ListItem, ListItemText, Paper, CircularProgress } from '@mui/material';
import {
  fetchFormConfigurations,
  createFormConfiguration,
  updateFormConfiguration,
  deleteFormConfiguration,
} from './formConfigSlice';
import FormConfigDialog from './FormConfigDialog';

const FormConfigManager = () => {
  const dispatch = useDispatch();
  const { formConfigs, loading } = useSelector((state) => state.formConfig);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  useEffect(() => {
    dispatch(fetchFormConfigurations());
  }, [dispatch]);

  const handleOpenDialog = (config = null) => {
    setEditingConfig(config);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingConfig(null);
    setDialogOpen(false);
  };

  const handleSave = (formData) => {
    if (editingConfig) {
      dispatch(updateFormConfiguration({ id: editingConfig._id, formData }));
    } else {
      dispatch(createFormConfiguration(formData));
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    dispatch(deleteFormConfiguration(id));
  };

  if (loading && formConfigs.length === 0) {
    return <CircularProgress />;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Form Configurations</Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Create New Form
        </Button>
      </Box>
      <List>
        {formConfigs.map((config) => (
          <ListItem key={config._id} secondaryAction={
            <Box>
              <Button onClick={() => handleOpenDialog(config)} sx={{ mr: 1 }}>Edit</Button>
              <Button onClick={() => handleDelete(config._id)} color="error">Delete</Button>
            </Box>
          }>
            <ListItemText primary={config.name} secondary={config.description} />
          </ListItem>
        ))}
      </List>
      <FormConfigDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSave}
        initialData={editingConfig}
      />
    </Paper>
  );
};

export default FormConfigManager;
