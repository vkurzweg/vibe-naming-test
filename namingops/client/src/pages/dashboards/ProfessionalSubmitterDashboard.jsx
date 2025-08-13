import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Alert, CircularProgress,
  Card, CardContent, Divider, Grid, styled, StepConnector, Button, Table, TableBody, TableRow, TableCell
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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

function humanizeFieldName(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Pretty print for value display
function prettyPrintValue(key, value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (key.toLowerCase() === 'user') {
      return `${value.name || ''}${value.email ? ` (${value.email})` : ''}`;
    }
    if (value.name) return value.name;
    if (value.title) return value.title;
    return JSON.stringify(value);
  }
  return String(value);
}

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
                  {myRequests.map(request => {
            // Debug: log the request object to inspect data structure
            console.log('Submitter card request:', request);

                    // Only show filled fields from formData
                    const formFields = request.formData && typeof request.formData === 'object'
                      ? Object.entries(request.formData).filter(([_, value]) =>
                          value !== null && value !== undefined && value !== ''
                        )
                      : [];

                    // User display (supports user or User)
                    const user = request.user || request.User;

                    // Status history formatting
                    const statusHistory = (request.statusHistory || []).map((history, idx) => {
                      const date = history.timestamp ? new Date(history.timestamp) : null;
                      return {
                        date: date && !isNaN(date) ? date.toLocaleDateString() : '',
                        status: STATUS_LABELS[history.status] || history.status
                      };
                    });

                    return (
                      <Card
                        key={request.id}
                        sx={{
                          borderLeft: `4px solid ${getStatusColor(request.status || 'submitted')}`,
                          borderRadius: '0.5rem',
                          boxShadow: 2
                        }}
                      >
                        <CardContent>
                          <Box>
                            {/* Date Submitted */}
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Date Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}
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

                            {/* Expand indicator at bottom of collapsed card */}
                            {!expanded[request.id] && (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 2, cursor: 'pointer' }}
                                onClick={() => handleToggleExpand(request.id)}>
                                <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                                  Expand
                                </Typography>
                                <ExpandMoreIcon
                                  sx={{
                                    transform: expanded[request.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s'
                                  }}
                                />
                              </Box>
                            )}
                          </Box>

                          {/* Expanded content */}
                          {expanded[request.id] && (
                            <Box sx={{ mt: '1rem' }}>
                              <Divider sx={{ my: '1rem' }} />
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Request Details
                              </Typography>
                              {formConfig?.fields && (
                                <Table size="small" sx={{ mb: 2, background: 'transparent' }}>
                                  <TableBody>
                                    {formConfig.fields.map(field => {
                                      const value = request.formData?.[field.name];
                                      return (
                                        <TableRow key={field.name}>
                                          <TableCell sx={{ border: 0, pl: 0, pr: 2, width: 180, color: 'text.secondary', fontWeight: 500 }}>
                                            {field.label || humanizeFieldName(field.name)}
                                          </TableCell>
                                          <TableCell sx={{ border: 0, pl: 0, color: value ? 'text.primary' : '#aaa', wordBreak: 'break-word' }}>
                                            {value === undefined || value === '' || value === null
                                              ? '—'
                                              : typeof value === 'object'
                                                ? JSON.stringify(value)
                                                : String(value)
                                            }
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              )}

                              {/* Status History: only show if there is more than one status (i.e., updated) */}
                              {statusHistory.length > 1 && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                    Status History
                                  </Typography>
                                  <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                                    {statusHistory.slice(1).map((item, idx) => (
                                      <li key={idx}>
                                        <Typography variant="body2">
                                          {item.status}: {item.date || <span style={{ color: '#aaa' }}>—</span>}
                                        </Typography>
                                      </li>
                                    ))}
                                  </ul>
                                </Box>
                              )}

                              {/* Status Action Buttons for Submitter */}
                              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                  variant="outlined"
                                  sx={{
                                    borderColor: '#FFD600',
                                    color: '#FFD600',
                                    fontWeight: 600,
                                    '&:hover': { borderColor: '#FFEA00', color: '#FFEA00', background: 'rgba(255,234,0,0.08)' }
                                  }}
                                  disabled={['approved', 'rejected', 'canceled', 'on_hold'].includes(request.status)}
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to put this request on hold?')) {
                                      holdRequestMutation.mutate(request.id);
                                    }
                                  }}
                                >
                                  Hold
                                </Button>
                                <Button
                                  variant="outlined"
                                  sx={{
                                    borderColor: '#D32F2F',
                                    color: '#D32F2F',
                                    fontWeight: 600,
                                    '&:hover': { borderColor: '#B71C1C', color: '#B71C1C', background: 'rgba(211,47,47,0.08)' }
                                  }}
                                  disabled={['approved', 'rejected', 'canceled'].includes(request.status)}
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to cancel this request?')) {
                                      cancelRequestMutation.mutate(request.id);
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
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