import React, { useState } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, CircularProgress, Alert, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, Divider, List, ListItem, ListItemText, Button
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
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

// Shared dashboard styles
import {
  dashboardContainerSx,
} from '../../theme/dashboardStyles';

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
      // Ensure every request has a valid id property
      return Array.isArray(response.data)
        ? response.data.map(item => ({
            ...item,
            id: item.id || item._id // <-- Fix: always provide id
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
              onStatusChange={updateStatus} // Pass the mutation function directly
              onClaimRequest={claimRequest}
              showClaimButton={true}
              currentUserId={user?.id}
              formConfig={activeFormConfig}
            />
        </TabPanel>

        {/* Form Configuration Tab Panel */}
        <TabPanel value={activeTab} index={1}>
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
              </>
            )}
        </TabPanel>

        {/* New Request Tab Panel */}
        <TabPanel value={activeTab} index={2}>
            <NewRequestForm onSuccess={() => { /* Optionally handle success, e.g. show a toast or switch tabs */ }} />
        </TabPanel>
      </Paper>
    </ResponsiveContainer>
  );
};

export default ProfessionalAdminDashboard;