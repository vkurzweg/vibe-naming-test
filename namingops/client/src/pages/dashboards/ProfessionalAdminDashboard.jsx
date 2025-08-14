import React, { useState } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, CircularProgress, Alert, Button, Divider, Select, MenuItem
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import FormConfigManager from '../../features/admin/FormConfigManager';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import useRequestManagement from '../../hooks/useRequestManagement';
import ResponsiveContainer from '../../components/Layout/ResponsiveContainer';
import NewRequestForm from '../../components/Requests/NewRequestForm';
import ReviewQueue from '../../components/ReviewQueue/ReviewQueue';

// --- Gemini Admin UI for Form Fields ---
import {
  Checkbox,
  FormControlLabel
} from '@mui/material';

function FormConfigGeminiAdmin({ configId }) {
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch the form configuration by ID
  React.useEffect(() => {
    async function fetchConfig() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/v1/form-configurations/${configId}`);
        setFormConfig(res.data);
      } catch (err) {
        setError('Failed to load form configuration.');
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, [configId]);

  // Handler to toggle Gemini options
  const handleToggle = (fieldIdx, key) => {
    setFormConfig((prev) => {
      const fields = [...prev.fields];
      fields[fieldIdx] = { ...fields[fieldIdx], [key]: !fields[fieldIdx][key] };
      return { ...prev, fields };
    });
  };

  // Save changes to backend
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/v1/form-configurations/${configId}`, formConfig);
      setError('');
    } catch (err) {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!formConfig) return null;

  return (
    <Paper sx={{ p: 3, maxWidth: 700, mx: 'auto', mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Gemini Integration for Form Fields
      </Typography>
      {formConfig.fields.map((field, idx) => (
        <Box key={field.name} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
          <Typography variant="subtitle1">{field.label} <span style={{ color: '#888' }}>({field.name})</span></Typography>
          <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!field.geminiSuggest}
                  onChange={() => handleToggle(idx, 'geminiSuggest')}
                  color="primary"
                />
              }
              label="Gemini Suggest"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!field.geminiEvaluate}
                  onChange={() => handleToggle(idx, 'geminiEvaluate')}
                  color="primary"
                />
              }
              label="Gemini Evaluate"
            />
          </Box>
        </Box>
      ))}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Paper>
  );
}

// --- Tab Panel Helper ---
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
};

const ProfessionalAdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();

  // Admin request management hooks
  const { updateStatus, claimRequest, deleteRequest, activateFormConfig } = useRequestManagement();

  const [activeTab, setActiveTab] = useState(0);

  // All requests for review queue
  const { data: allRequests = [], isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ['requests', 'all'],
    queryFn: async () => {
      const response = await api.get('/api/v1/name-requests');
      return Array.isArray(response.data)
        ? response.data.map(item => ({
            ...item,
            id: item.id || item._id
          }))
        : [];
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

  // Form configs
  const { data: formConfigs = [], isLoading: formConfigsLoading, error: formConfigsError } = useQuery({
    queryKey: ['formConfigs'],
    queryFn: async () => {
      const response = await api.get('/api/v1/form-configurations');
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

  // Active form config
  const { data: activeFormConfig } = useQuery({
    queryKey: ['activeFormConfig'],
    queryFn: async () => {
      const response = await api.get('/api/v1/form-configurations/active');
      return response.data;
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Helper for selecting which config to edit
  const [selectedConfigId, setSelectedConfigId] = useState(null);

  return (
    <ResponsiveContainer className="px-2 px-sm-3 px-md-4">
      <Paper
        elevation={2}
        sx={{
          mt: '2rem',
          mb: '2rem',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="admin dashboard tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<BusinessIcon />}
              iconPosition="start"
              label="Review Queue"
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <Tab
              icon={<AddIcon />}
              iconPosition="start"
              label="New Request"
              id="tab-1"
              aria-controls="tabpanel-1"
            />
            <Tab
              icon={<SettingsIcon />}
              iconPosition="start"
              label="Form Configuration"
              id="tab-2"
              aria-controls="tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Review Queue Tab Panel */}
        <TabPanel value={activeTab} index={0}>
          <ReviewQueue
            requests={allRequests}
            loading={requestsLoading}
            error={requestsError}
            onStatusChange={updateStatus}
            onClaimRequest={claimRequest}
            showClaimButton={true}
            currentUserId={user?.id}
            formConfig={activeFormConfig}
          />
        </TabPanel>

        {/* Form Configuration Tab Panel */}
        <TabPanel value={activeTab} index={2}>
          {formConfigsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : formConfigsError ? (
            <Alert severity="error">
              Failed to load form configurations. Please try again.
            </Alert>
          ) : (
            <>
              <FormConfigManager />
              <Divider sx={{ my: 3 }} />
            </>
          )}
        </TabPanel>

        {/* New Request Tab Panel */}
        <TabPanel value={activeTab} index={1}>
          <NewRequestForm onSuccess={() => { /* Optionally handle success, e.g. show a toast or switch tabs */ }} />
        </TabPanel>
      </Paper>
    </ResponsiveContainer>
  );
};

export default ProfessionalAdminDashboard;