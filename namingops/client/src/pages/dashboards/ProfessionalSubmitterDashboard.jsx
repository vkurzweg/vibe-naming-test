import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Alert, CircularProgress,
  Card, CardContent, Divider, Grid, styled, StepConnector
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add as AddIcon,
  Search as SearchIcon, 
  Description as DescriptionIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStatusColor } from '../../theme/newColorPalette';
import StatusProgressionStepper from '../../components/StatusProgression/StatusProgressionStepper';
import ResponsiveContainer from '../../components/Layout/ResponsiveContainer';
import NewRequestForm from '../../components/Requests/NewRequestForm';
import StatusDropdown from '../../components/common/StatusDropdown';

// Shared status label mapping
const STATUS_LABELS = {
  submitted: 'Submitted',
  brand_review: 'Brand Review',
  legal_review: 'Legal Review',
  approved: 'Approved',
  rejected: 'Rejected',
  on_hold: 'On Hold',
  canceled: 'Canceled'
};

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

const ColoredStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.MuiStepConnector-alternativeLabel`]: {
    top: 10,
  },
  [`&.MuiStepConnector-active`]: {
    [`& .MuiStepConnector-line`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.MuiStepConnector-completed`]: {
    [`& .MuiStepConnector-line`]: {
      borderColor: theme.palette.success.main,
    },
  },
  [`& .MuiStepConnector-line`]: {
    borderColor: theme.palette.mode === 'dark' ? alpha('#ffffff', 0.2) : alpha('#000000', 0.1),
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const ProfessionalSubmitterDashboard = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [expanded, setExpanded] = useState({});

  // Get my requests
  const { data: myRequests = [], isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ['myRequests'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/name-requests/my-requests');
        const transformedData = Array.isArray(response.data) 
          ? response.data.map(request => ({
              ...request,
              id: request.id || request._id,
            }))
          : [];
        return transformedData;
      } catch (error) {
        console.error('Error fetching my requests:', error);
        throw error;
      }
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

  // Get form configuration for the new request form
  const { data: formConfig } = useQuery({
    queryKey: ['formConfig'],
    queryFn: async () => {
      const response = await api.get('/api/v1/form-configurations/active');
      return response.data;
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

  // Cancel request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      if (!requestId) throw new Error("Request ID is undefined");
      const response = await api.put(`/api/v1/name-requests/${requestId}/status`, { 
        status: 'canceled',
        comment: 'Request canceled by user'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myRequests']);
    },
    onError: (error) => {
      console.error(`Error canceling request: ${error.message}`);
      alert(`Failed to cancel request: ${error.message}`);
    }
  });

  // Hold request mutation
  const holdRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      if (!requestId) throw new Error("Request ID is undefined");
      const response = await api.put(`/api/v1/name-requests/${requestId}/status`, { 
        status: 'on_hold',
        comment: 'Request placed on hold by user'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myRequests']);
    },
    onError: (error) => {
      console.error(`Error putting request on hold: ${error.message}`);
      alert(`Failed to put request on hold: ${error.message}`);
    }
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(z.object({})),
    mode: 'onChange',
  });

  useEffect(() => {
    if (formConfig && formConfig.fields) {
      const schemaObject = {};
      formConfig.fields.forEach(field => {
        if (field.required) {
          schemaObject[field.name] = z.any().nonempty(`${field.label || field.name} is required`);
        } else {
          schemaObject[field.name] = z.any().optional();
        }
      });
      reset({}, { resolver: zodResolver(z.object(schemaObject)) });
    }
  }, [formConfig, reset]);

  // Submit new request mutation
  const submitRequestMutation = useMutation({
    mutationFn: async (formData) => {
      setSubmitting(true);
      try {
        const response = await api.post('/api/v1/name-requests', formData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to submit request');
      } finally {
        setSubmitting(false);
      }
    },
    onSuccess: () => {
      reset();
      setSubmitSuccess(true);
      setSubmitError(null);
      queryClient.invalidateQueries(['myRequests']);
      setTimeout(() => setSubmitSuccess(false), 5000);
    },
    onError: (error) => {
      setSubmitError(error.message || 'Something went wrong. Please try again.');
    }
  });

  const onSubmit = (data) => {
    submitRequestMutation.mutate(data);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleToggleExpand = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <ResponsiveContainer fluid className="px-5">
      <Paper 
        elevation={2}
        sx={{
          mt: '2rem',
          mb: '2rem',
          p: 0,
          borderRadius: '0.75rem',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="associate dashboard tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<DescriptionIcon />} 
              iconPosition="start" 
              label="Name Requests" 
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
              icon={<SearchIcon />} 
              iconPosition="start" 
              label="Search Names" 
              id="tab-2"
              aria-controls="tabpanel-2" 
            />
            <Tab 
              icon={<MenuBookIcon />} 
              iconPosition="start" 
              label="Guidelines" 
              id="tab-3"
              aria-controls="tabpanel-3" 
            />
          </Tabs>
        </Box>
        
        {/* My Requests Tab Panel */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ pt: '1.5rem', px: 0 }}>
            {requestsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: '2rem' }}>
                <CircularProgress />
              </Box>
            ) : requestsError ? (
              <Alert severity="error" sx={{ mb: '1.5rem' }}>
                Failed to load your requests. Please try again.
              </Alert>
            ) : myRequests.length === 0 ? (
              <Alert severity="info" sx={{ mb: '1.5rem' }}>
                You haven&apos;t submitted any name requests yet. Use the &quot;New Request&quot; tab to create one.
              </Alert>
            ) : (
              <>
                {/* Request cards */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', mb: '2rem' }}>
                  {myRequests.map(request => (
                    <Card 
                      key={request.id} 
                      sx={{ 
                        borderLeft: `4px solid ${getStatusColor(request.status || 'submitted')}`,
                        borderRadius: '0.5rem',
                        boxShadow: 2
                      }}
                    >
                      <CardContent>
                        <Box 
                          onClick={() => handleToggleExpand(request.id)}
                          sx={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start'
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '0.75rem' }}>
                              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                                {request.title || request.requestData?.name || 'Name Request'}
                              </Typography>
                              {/* Status Dropdown in upper right corner */}
                              <StatusDropdown
                                currentStatus={request.status}
                                options={[
                                  { value: 'on_hold', label: 'Hold' },
                                  { value: 'canceled', label: 'Cancel' }
                                ]}
                                statusLabels={STATUS_LABELS}
                                onChange={status => {
                                  if (status === 'on_hold') {
                                    if (window.confirm('Are you sure you want to put this request on hold?')) {
                                      holdRequestMutation.mutate(request.id);
                                    }
                                  } else if (status === 'canceled') {
                                    if (window.confirm('Are you sure you want to cancel this request?')) {
                                      cancelRequestMutation.mutate(request.id);
                                    }
                                  }
                                }}
                                disabled={['approved', 'rejected', 'canceled'].includes(request.status)}
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: '1rem' }}>
                              Submitted: {new Date(request.createdAt).toLocaleDateString()}
                            </Typography>
                            
                            {/* Status Progression Stepper with colored connector */}
                            <Box sx={{ mb: '1rem' }}>
                              <StatusProgressionStepper
                                status={request.status}
                                orientation="horizontal"
                                compact={true}
                                showTimestamps={false}
                                connectorComponent={ColoredStepConnector}
                                timestamps={{
                                  submitted: request.createdAt,
                                  brand_review: request.updatedAt,
                                  legal_review: request.updatedAt,
                                  approved: request.updatedAt
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>

                        {/* Expanded content */}
                        {expanded[request.id] && (
                          <Box sx={{ mt: '1rem' }}>
                            <Divider sx={{ my: '1rem' }} />
                            <Typography variant="subtitle2" sx={{ mb: '0.5rem', fontWeight: 'bold' }}>
                              Request Details
                            </Typography>
                            {request.requestData && Object.keys(request.requestData).length > 0 ? (
                              <Grid container spacing={2}>
                                {Object.entries(request.requestData).map(([key, value]) => (
                                  <Grid item xs={12} sm={6} key={key}>
                                    <Typography variant="body2" color="textSecondary" component="span">
                                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                                    </Typography>
                                    <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </Typography>
                                  </Grid>
                                ))}
                              </Grid>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                No additional details available.
                              </Typography>
                            )}
                            
                            <Typography variant="subtitle2" sx={{ mt: '1.5rem', mb: '0.5rem', fontWeight: 'bold' }}>
                              Status History
                            </Typography>
                            <Typography variant="body2">
                              {request.statusHistory && request.statusHistory.length > 0 ? (
                                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                                  {request.statusHistory.map((history, index) => (
                                    <li key={index}>
                                      <Typography variant="body2">
                                        {new Date(history.timestamp).toLocaleString()}: Changed to {STATUS_LABELS[history.status] || history.status}
                                      </Typography>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  No status history available.
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </TabPanel>
        
        {/* New Request Tab Panel */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 0 }}>
            <NewRequestForm onSuccess={() => {/* Optionally handle success, e.g. show a toast or switch tabs */}} />
          </Box>
        </TabPanel>
        
        {/* Search Names Tab Panel */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 0 }}>
            <Typography variant="h6" component="h2" sx={{ mb: '1.5rem' }}>
              Search Approved Names
            </Typography>
            
            <Alert severity="info" sx={{ mb: '1.5rem' }}>
              Search functionality will be available soon. This feature is still under development.
            </Alert>
          </Box>
        </TabPanel>
        
        {/* Guidelines Tab Panel */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 0 }}>
            <Typography variant="h6" component="h2" sx={{ mb: '1.5rem' }}>
              Naming Guidelines
            </Typography>
            
            <Alert severity="info" sx={{ mb: '1.5rem' }}>
              Naming guidelines content will be available soon. This feature is still under development.
            </Alert>
          </Box>
        </TabPanel>
      </Paper>
    </ResponsiveContainer>
  );
};

export default ProfessionalSubmitterDashboard;