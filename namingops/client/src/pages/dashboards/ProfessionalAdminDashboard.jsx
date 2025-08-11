import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Tabs, Tab, Alert, CircularProgress,
  TextField, IconButton, Card, CardContent, CardActions, Chip, Divider,
  Grid, MenuItem, Select, FormControl, InputLabel, Pagination, AlertTitle,
  List, ListItem, ListItemText, Switch, FormControlLabel
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Send as SendIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import DynamicFormRenderer from '../../components/DynamicForm/DynamicFormRenderer';
import FormConfigManager from '../../features/admin/FormConfigManager';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getStatusColor } from '../../theme/newColorPalette';
import useRequestManagement from '../../hooks/useRequestManagement';

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

const ProfessionalAdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  
  // Import the request management hook functions
  const { updateStatus, deleteRequest, activateFormConfig } = useRequestManagement();
  
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [expanded, setExpanded] = useState({});
  const [editingRequest, setEditingRequest] = useState(null);

  const handleToggleExpand = useCallback((id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);
  
  // Get all requests 
  const { data: allRequests = [], isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ['allRequests'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/name-requests');
        console.log('All requests data:', response.data);
        
        // Transform MongoDB data structure for frontend
        return Array.isArray(response.data) 
          ? response.data.map(item => ({
              ...item,
              id: item._id || item.id // Ensure id property exists
            }))
          : [];
      } catch (error) {
        console.error('Error fetching all requests:', error);
        throw error;
      }
    },
    staleTime: 300000, // 5 minutes
    cacheTime: 600000, // 10 minutes
  });

  // Get form configurations
  const { data: formConfigs = [], isLoading: formConfigsLoading, error: formConfigsError } = useQuery({
    queryKey: ['formConfigs'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/form-configurations');
        console.log('Form configs:', response.data);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching form configurations:', error);
        throw error;
      }
    },
    staleTime: 300000, // 5 minutes
    cacheTime: 600000, // 10 minutes
  });

  // Get active form configuration
  const { data: activeFormConfig, isLoading: activeFormConfigLoading, error: activeFormConfigError } = useQuery({
    queryKey: ['activeFormConfig'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/form-configurations/active');
        return response.data;
      } catch (error) {
        console.error('Error fetching active form configuration:', error);
        throw error;
      }
    },
    staleTime: 300000, // 5 minutes
    cacheTime: 600000, // 10 minutes
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { handleSubmit, control, reset, formState: { errors }, watch } = useForm({
    resolver: zodResolver(z.object({})),
    mode: 'onChange',
  });

  useEffect(() => {
    if (activeFormConfig && activeFormConfig.fields) {
      const schemaObject = {};
      activeFormConfig.fields.forEach(field => {
        if (field.required) {
          schemaObject[field.name] = z.any().nonempty(`${field.label || field.name} is required`);
        } else {
          schemaObject[field.name] = z.any().optional();
        }
      });
      reset({}, { resolver: zodResolver(z.object(schemaObject)) });
    }
  }, [activeFormConfig, reset]);

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
      queryClient.invalidateQueries(['allRequests']);
      setTimeout(() => setSubmitSuccess(false), 5000);
    },
    onError: (error) => {
      setSubmitError(error.message || 'Something went wrong. Please try again.');
    }
  });

  const onSubmit = (data) => {
    submitRequestMutation.mutate(data);
  };

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    if (!allRequests) return [];
    
    let result = [...allRequests];
    
    // Filter by status if needed
    if (statusFilter !== 'all') {
      result = result.filter(req => req.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(req => {
        const nameMatches = req.requestData?.name?.toLowerCase().includes(lowerSearchTerm);
        const submitterMatches = req.submitter?.name?.toLowerCase().includes(lowerSearchTerm);
        return nameMatches || submitterMatches;
      });
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'date_desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'name_asc':
          return (a.requestData?.name || '').localeCompare(b.requestData?.name || '');
        case 'name_desc':
          return (b.requestData?.name || '').localeCompare(a.requestData?.name || '');
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    return result;
  }, [allRequests, statusFilter, searchTerm, sortBy]);

  // Pagination
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRequests.slice(start, end);
  }, [filteredRequests, page, rowsPerPage]);

  const pageCount = Math.ceil(filteredRequests.length / rowsPerPage);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleStatusChange = useCallback((requestId, newStatus) => {
    updateStatus.mutate({ requestId, status: newStatus });
  }, [updateStatus]);
  
  const handleDeleteRequest = useCallback((requestId) => {
    if (window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      deleteRequest.mutate(requestId);
    }
  }, [deleteRequest]);
  
  const handleActivateFormConfig = useCallback((configId) => {
    activateFormConfig.mutate(configId);
  }, [activateFormConfig]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when search changes
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };
  
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1); // Reset to first page when sort changes
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1); // Reset to first page on tab change
  };

  return (
    <div className="px-5">
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
            value={activeTab}
            onChange={handleTabChange}
            aria-label="admin dashboard tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<StorageIcon />}
              label="All Requests" 
              id="tab-0"
              aria-controls="tabpanel-0" 
            />
            <Tab 
              icon={<SettingsIcon />}
              label="Form Configuration" 
              id="tab-1" 
              aria-controls="tabpanel-1" 
            />
            <Tab 
              icon={<AddIcon />}
              label="New Request" 
              id="tab-2" 
              aria-controls="tabpanel-2" 
            />
          </Tabs>
        </Box>
        
        {/* All Requests Tab Panel */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: '1.5rem', px: 0 }}>
            {/* Filter and sort controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              {/* Search input */}
              <TextField
                placeholder="Search requests..."
                variant="outlined"
                size="small"
                onChange={handleSearchChange}
                value={searchTerm}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
                }}
                sx={{ width: { xs: '100%', sm: '40%' } }}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                {/* Status filter */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    label="Status"
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="brand_review">Brand Review</MenuItem>
                    <MenuItem value="legal_review">Legal Review</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="on_hold">On Hold</MenuItem>
                    <MenuItem value="canceled">Canceled</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Sort options */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    label="Sort By"
                  >
                    <MenuItem value="date_desc">Newest First</MenuItem>
                    <MenuItem value="date_asc">Oldest First</MenuItem>
                    <MenuItem value="name_asc">Name (A-Z)</MenuItem>
                    <MenuItem value="name_desc">Name (Z-A)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            {requestsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : requestsError ? (
              <Alert severity="error">
                <AlertTitle>Error</AlertTitle>
                Failed to load requests. Please try again.
              </Alert>
            ) : filteredRequests.length === 0 ? (
              <Alert severity="info">
                <AlertTitle>No Requests</AlertTitle>
                There are no requests matching your filters.
              </Alert>
            ) : (
              <>
                {/* Request cards */}
                {paginatedRequests.map(request => (
                  <Card key={request.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6">
                            {request.requestData?.name || 'Unnamed Request'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Submitted by: {request.submitter?.name || 'Unknown'} • {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Chip
                            label={getStatusLabel(request.status)}
                            sx={{
                              backgroundColor: getStatusColor(request.status),
                              color: 'white',
                            }}
                            size="small"
                          />
                          <Button 
                            size="small" 
                            onClick={() => handleToggleExpand(request.id)}
                            sx={{ ml: 1 }}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Box>
                      
                      {expanded[request.id] && (
                        <Box sx={{ mt: 2 }}>
                          <Divider sx={{ my: 2 }} />
                          
                          {/* Request details */}
                          <Typography variant="subtitle1" gutterBottom>
                            Request Details
                          </Typography>
                          
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            {Object.entries(request.requestData || {}).map(([key, value]) => (
                              <React.Fragment key={key}>
                                <Grid item xs={4} sm={3}>
                                  <Typography variant="body2" color="textSecondary">
                                    {key}:
                                  </Typography>
                                </Grid>
                                <Grid item xs={8} sm={9}>
                                  <Typography variant="body2">
                                    {typeof value === 'string' ? value : JSON.stringify(value)}
                                  </Typography>
                                </Grid>
                              </React.Fragment>
                            ))}
                          </Grid>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          {/* Admin Actions */}
                          <Typography variant="subtitle1" gutterBottom>
                            Admin Actions
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button 
                              variant="outlined"
                              size="small"
                              color="primary"
                              onClick={() => handleStatusChange(request.id, 'submitted')}
                            >
                              Set Submitted
                            </Button>
                            <Button 
                              variant="outlined"
                              size="small"
                              color="primary"
                              onClick={() => handleStatusChange(request.id, 'brand_review')}
                            >
                              Set Brand Review
                            </Button>
                            <Button 
                              variant="outlined"
                              size="small"
                              color="primary"
                              onClick={() => handleStatusChange(request.id, 'legal_review')}
                            >
                              Set Legal Review
                            </Button>
                            <Button 
                              variant="outlined"
                              size="small"
                              color="success"
                              onClick={() => handleStatusChange(request.id, 'approved')}
                              startIcon={<CheckIcon />}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={() => handleStatusChange(request.id, 'rejected')}
                              startIcon={<CloseIcon />}
                            >
                              Reject
                            </Button>
                            <Button 
                              variant="outlined"
                              size="small"
                              onClick={() => handleStatusChange(request.id, 'on_hold')}
                              startIcon={<AccessTimeIcon />}
                            >
                              Put On Hold
                            </Button>
                            <Button 
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={() => handleDeleteRequest(request.id)}
                              startIcon={<DeleteIcon />}
                            >
                              Delete Request
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={pageCount} 
                    page={page} 
                    onChange={handleChangePage} 
                    color="primary" 
                  />
                </Box>
              </>
            )}
          </Box>
        </TabPanel>
        
        {/* Form Configuration Tab Panel */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: '1.5rem', px: 0 }}>
            {formConfigsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : formConfigsError ? (
              <Alert severity="error">
                <AlertTitle>Error</AlertTitle>
                Failed to load form configurations. Please try again.
              </Alert>
            ) : (
              <>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Current Form Configurations
                  </Typography>
                  
                  {formConfigs.length === 0 ? (
                    <Alert severity="info">
                      <AlertTitle>No Configurations</AlertTitle>
                      No form configurations found. Create a new one below.
                    </Alert>
                  ) : (
                    <List>
                      {formConfigs.map((config) => (
                        <Card 
                          key={config.id} 
                          sx={{ 
                            mb: 2, 
                            border: '1px solid', 
                            borderColor: config.active ? 'success.main' : 'divider',
                            backgroundColor: config.active ? 'rgba(76, 175, 80, 0.08)' : 'inherit'
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="h6">
                                  {config.name} {config.active && <Chip label="Active" color="success" size="small" />}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Created: {new Date(config.createdAt).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {config.description || 'No description provided.'}
                                </Typography>
                              </Box>
                              <Box>
                                {!config.active && (
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    onClick={() => handleActivateFormConfig(config.id)}
                                    sx={{ mr: 1 }}
                                  >
                                    Activate
                                  </Button>
                                )}
                                <Button 
                                  size="small" 
                                  onClick={() => handleToggleExpand(config.id)}
                                >
                                  View Details
                                </Button>
                              </Box>
                            </Box>
                            
                            {expanded[config.id] && (
                              <Box sx={{ mt: 2 }}>
                                <Divider sx={{ my: 2 }} />
                                
                                <Typography variant="subtitle1" gutterBottom>
                                  Form Fields ({config.fields?.length || 0})
                                </Typography>
                                
                                <List dense>
                                  {config.fields?.map((field, index) => (
                                    <ListItem key={`${field.name}-${index}`}>
                                      <ListItemText 
                                        primary={field.label || field.name} 
                                        secondary={`Type: ${field.type}, Required: ${field.required ? 'Yes' : 'No'}`}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </List>
                  )}
                </Box>
                
                <Divider sx={{ my: 4 }} />
                
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Create/Edit Form Configuration
                  </Typography>
                  <FormConfigManager />
                </Box>
              </>
            )}
          </Box>
        </TabPanel>
        
        {/* New Request Tab Panel */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: '1.5rem', px: 0 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Submit New Request
            </Typography>
            {submitSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Request submitted successfully!
              </Alert>
            )}
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}
            {activeFormConfigLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : activeFormConfigError ? (
              <Alert severity="error">
                Failed to load form configuration. Please try again later.
              </Alert>
            ) : !activeFormConfig ? (
              <Alert severity="warning">
                <AlertTitle>No Active Form Configuration</AlertTitle>
                Please activate a form configuration in the Form Configuration tab.
              </Alert>
            ) : (
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Paper
                  elevation={0}
                  sx={{
                    p: '1.5rem',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    borderRadius: (theme) => `${theme.shape.borderRadius}px`,
                  }}
                >
                  <DynamicFormRenderer
                    formConfig={activeFormConfig}
                    control={control}
                    errors={errors}
                    watch={watch}
                    setValue={reset}
                    role="admin"
                  />
                  <Box sx={{ mt: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
                      size="large"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </div>
  );
};

export default ProfessionalAdminDashboard;
