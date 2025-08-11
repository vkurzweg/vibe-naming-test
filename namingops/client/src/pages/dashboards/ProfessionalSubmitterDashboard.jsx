import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Tabs, Tab, Alert, CircularProgress,
  Card, CardContent, Chip, Divider, Grid, styled, StepConnector
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add as AddIcon,
  Send as SendIcon,
  Search as SearchIcon, 
  Description as DescriptionIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import DynamicFormRenderer from '../../components/DynamicForm/DynamicFormRenderer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container } from 'react-bootstrap';
import { getStatusColor } from '../../theme/newColorPalette';
import StatusProgressionStepper from '../../components/StatusProgression/StatusProgressionStepper';
import ResponsiveContainer from '../../components/Layout/ResponsiveContainer';

// Helper function to get status label
const getStatusLabel = (status) => {
  const statusLabels = {
    'submitted': 'Submitted',
    'brand_review': 'Brand Review',
    'legal_review': 'Legal Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'on_hold': 'On Hold',
    'canceled': 'Canceled'
  };
  return statusLabels[status] || 'Unknown';
};

// Helper function to get review progress percentage
// This function is retained for future use
// eslint-disable-next-line no-unused-vars
const getReviewProgress = (status) => {
  const statusMap = {
    'submitted': 25,
    'brand_review': 50,
    'legal_review': 75,
    'approved': 100,
    'rejected': 100,
    'on_hold': 50,
    'canceled': 0
  };
  return statusMap[status] || 0;
};

// Helper function to get stepper active step
// This function is retained for future use
// eslint-disable-next-line no-unused-vars
const getStepperActiveStep = (status) => {
  const statusSteps = {
    'submitted': 0,
    'brand_review': 1,
    'legal_review': 2,
    'approved': 3,
    'rejected': 1, // Shows as started but not completed the process
    'on_hold': 1,  // Shows as started but not completed the process
    'canceled': 0  // Reset to beginning
  };
  return statusSteps[status] || 0;
};

// TabPanel component for accessibility
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

// Custom styled step connector with color
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
        console.log('My requests data:', response.data);
        // Transform data to ensure each request has an id property (MongoDB uses _id)
        const transformedData = Array.isArray(response.data) 
          ? response.data.map(request => ({
              ...request,
              id: request.id || request._id, // Use existing id or fallback to _id
            }))
          : [];
        console.log('Transformed requests with ids:', transformedData);
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
  const { data: formConfig, isLoading: formConfigLoading, error: formConfigError } = useQuery({
    queryKey: ['formConfig'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/form-configurations/active');
        console.log('Form config API response:', response);
        const data = response.data;
        console.log('Form config data structure:', data);
        return data;
      } catch (error) {
        console.error('Error fetching form configuration:', error);
        throw error;
      }
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

  // Cancel request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      if (!requestId) throw new Error("Request ID is undefined");
      // Use the correct API endpoint pattern with /api/v1/ prefix
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
      // Use PUT with status update instead of PATCH to non-existent /hold endpoint
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

  const handleCancelRequest = (requestId) => {
    if (!requestId) {
      console.error("Cannot cancel request: Request ID is undefined");
      return;
    }
    
    if (window.confirm('Are you sure you want to cancel this request?')) {
      cancelRequestMutation.mutate(requestId);
    }
  };

  const handleHoldRequest = (requestId) => {
    if (!requestId) {
      console.error("Cannot put request on hold: Request ID is undefined");
      return;
    }
    
    if (window.confirm('Are you sure you want to put this request on hold?')) {
      holdRequestMutation.mutate(requestId);
    }
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
                              
                              {/* Status tag in upper right corner */}
                              <Chip
                                label={getStatusLabel(request.status)}
                                sx={{
                                  backgroundColor: getStatusColor(request.status),
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  height: '1.5rem',
                                  fontWeight: 'medium'
                                }}
                                size="small"
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

                            {/* Action buttons - always visible */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'flex-end', 
                              gap: '0.75rem',
                              mt: '1rem'
                            }}>
                              {request.status !== 'approved' && request.status !== 'rejected' && request.status !== 'canceled' && (
                                <>
                                  {request.status !== 'on_hold' && (
                                    <Button
                                      startIcon={<PauseIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleHoldRequest(request.id);
                                      }}
                                      color="warning"
                                      variant="outlined"
                                      size="small"
                                    >
                                      Hold
                                    </Button>
                                  )}
                                  <Button
                                    startIcon={<CancelIcon />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelRequest(request.id);
                                    }}
                                    color="error"
                                    variant="outlined"
                                    size="small"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
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
                                        {new Date(history.timestamp).toLocaleString()}: Changed to {getStatusLabel(history.status)}
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
            <Typography variant="h6" component="h2" sx={{ mb: '1.5rem' }}>
              Submit a New Name Request
            </Typography>
            
            {formConfigLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: '2rem' }}>
                <CircularProgress />
              </Box>
            ) : formConfigError ? (
              <Alert severity="error" sx={{ mb: '1.5rem' }}>
                Failed to load form configuration. Please try again.
              </Alert>
            ) : formConfig ? (
              <>
                {submitSuccess && (
                  <Alert severity="success" sx={{ mb: '1.5rem' }}>
                    Your request has been submitted successfully!
                  </Alert>
                )}
                {submitError && (
                  <Alert severity="error" sx={{ mb: '1.5rem' }}>
                    {submitError}
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit(onSubmit)}>
                  {formConfig.fields && (
                    <DynamicFormRenderer
                      fields={formConfig.fields}
                      control={control}
                      errors={errors}
                    />
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '2rem' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </Box>
                </form>
              </>
            ) : (
              <Alert severity="warning">
                No form configuration available. Please contact an administrator.
              </Alert>
            )}
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
