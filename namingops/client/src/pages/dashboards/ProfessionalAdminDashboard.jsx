import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Chip,
  Divider,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from '@mui/icons-material';
import { 
  fetchFormConfigs, 
  activateFormConfig, 
  deleteFormConfig 
} from '../../features/formConfig/formConfigSlice';
import FormConfigModal from '../../components/FormConfig/FormConfigModal';

const ProfessionalAdminDashboard = () => {
  const dispatch = useDispatch();
  const { formConfigs, activeFormConfig, loading, error } = useSelector((state) => state.formConfig);
  
  const [activeTab, setActiveTab] = useState(0);
  const [formConfigModalOpen, setFormConfigModalOpen] = useState(false);
  const [selectedFormConfig, setSelectedFormConfig] = useState(null);
  
  useEffect(() => {
    dispatch(fetchFormConfigs());
  }, [dispatch]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleCreateFormConfig = () => {
    setSelectedFormConfig(null);
    setFormConfigModalOpen(true);
  };
  
  const handleEditFormConfig = (formConfig) => {
    setSelectedFormConfig(formConfig);
    setFormConfigModalOpen(true);
  };
  
  const handleCloseFormConfigModal = () => {
    setFormConfigModalOpen(false);
    // Refresh form configs after modal is closed
    dispatch(fetchFormConfigs());
  };
  
  const handleActivateFormConfig = (id) => {
    dispatch(activateFormConfig(id))
      .unwrap()
      .then(() => {
        dispatch(fetchFormConfigs());
      });
  };
  
  const handleDeleteFormConfig = (id) => {
    if (window.confirm('Are you sure you want to delete this form configuration? This action cannot be undone.')) {
      dispatch(deleteFormConfig(id))
        .unwrap()
        .then(() => {
          dispatch(fetchFormConfigs());
        });
    }
  };
  
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box mb={4}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage system settings, form configurations, and user roles
        </Typography>
        
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="admin dashboard tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="Form Configurations" 
              icon={<DescriptionIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="User Management" 
              icon={<PeopleIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="System Settings" 
              icon={<SettingsIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
      </Box>
      
      {/* Tab Content */}
      <Box sx={{ mt: 2, flexGrow: 1 }}>
        {/* Tab 1: Form Configurations */}
        {activeTab === 0 && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight={600}>
                Form Configurations
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateFormConfig}
              >
                New Form Configuration
              </Button>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : formConfigs.length === 0 ? (
              <Alert severity="info">
                No form configurations found. Click &quot;New Form Configuration&quot; to create one.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {formConfigs.map((formConfig) => (
                  <Grid item xs={12} md={6} lg={4} key={formConfig._id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {formConfig.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {formConfig.description || 'No description provided'}
                            </Typography>
                          </Box>
                          {formConfig.isActive && (
                            <Chip 
                              label="Active" 
                              color="primary" 
                              size="small" 
                              icon={<CheckCircleIcon />} 
                            />
                          )}
                        </Box>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Fields: {formConfig.fields?.length || 0}
                        </Typography>
                        
                        <Box mt={2} display="flex" justifyContent="space-between">
                          <Box>
                            <Tooltip title="Edit">
                              <IconButton 
                                color="primary" 
                                onClick={() => handleEditFormConfig(formConfig)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                color="error" 
                                onClick={() => handleDeleteFormConfig(formConfig._id)}
                                disabled={formConfig.isActive}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formConfig.isActive}
                                onChange={() => !formConfig.isActive && handleActivateFormConfig(formConfig._id)}
                                color="primary"
                                disabled={formConfig.isActive}
                              />
                            }
                            label="Active"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
        
        {/* Tab 2: User Management */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h5" fontWeight={600} mb={3}>
              User Management
            </Typography>
            <Alert severity="info">
              User management functionality will be implemented in a future update.
            </Alert>
          </Box>
        )}
        
        {/* Tab 3: System Settings */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h5" fontWeight={600} mb={3}>
              System Settings
            </Typography>
            <Alert severity="info">
              System settings functionality will be implemented in a future update.
            </Alert>
          </Box>
        )}
      </Box>
      
      {/* Form Config Modal */}
      <FormConfigModal
        open={formConfigModalOpen}
        onClose={handleCloseFormConfigModal}
        formConfig={selectedFormConfig}
      />
    </Box>
  );
};

export default ProfessionalAdminDashboard;
