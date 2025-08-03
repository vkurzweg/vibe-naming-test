import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  fetchFormConfigurations,
  saveFormConfiguration,
  deleteFormConfiguration,
  activateFormConfiguration,
  clearFormConfigError,
} from '../features/admin/formConfigSlice';
import FormConfigList from '../components/FormConfigList';
import FormConfigEditor from '../components/FormConfigEditor';

const FormConfigPage = () => {
  const dispatch = useDispatch();
  const { formConfigs, activeFormConfig, loading, error } = useSelector((state) => state.formConfig);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchFormConfigurations());
    return () => {
      dispatch(clearFormConfigError());
    };
  }, [dispatch]);

  const handleSave = async (formData) => {
    const configToSave = editingConfig ? { ...formData, _id: editingConfig._id } : formData;
    try {
      await dispatch(saveFormConfiguration(configToSave)).unwrap();
      setIsCreating(false);
      setEditingConfig(null);
    } catch (err) {
      console.error('Failed to save form configuration:', err);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this form configuration?')) {
      dispatch(deleteFormConfiguration(id));
    }
  };

  const handleSetActive = (id) => {
    dispatch(activateFormConfiguration(id));
  };

  const handleEdit = (config) => {
    setIsCreating(false);
    setEditingConfig(config);
  };

  const handleCreateNew = () => {
    setEditingConfig(null);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingConfig(null);
  };

  if (loading && !formConfigs.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Form Configurations</Typography>
        {!isCreating && !editingConfig && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleCreateNew}>
            New Configuration
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {typeof error === 'string' ? error : error.message || 'An error occurred'}
        </Alert>
      )}

      {isCreating || editingConfig ? (
        <FormConfigEditor
          config={editingConfig}
          onSave={handleSave}
          onCancel={handleCancel}
          loading={loading}
        />
      ) : (
        <FormConfigList
          formConfigs={formConfigs}
          activeConfigId={activeFormConfig?._id}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSetActive={handleSetActive}
        />
      )}
    </Box>
  );
};

export default FormConfigPage;
