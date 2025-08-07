import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { format, parseISO } from 'date-fns';
import { Container, Row, Col } from 'react-bootstrap';
import { 
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  Skeleton,
  useMediaQuery,
  alpha,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
} from '@mui/material';

// Icons
import {
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Support as SupportIcon,
  Archive as ArchiveIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Cancel as CancelIcon,
  PauseCircle as PauseCircleIcon,
} from '@mui/icons-material';
import { showSnackbar } from '../../features/ui/uiSlice';
import RequestDetailsModal from '../../components/Requests/RequestDetailsModal';
import DynamicFormRenderer from '../../components/DynamicForm/DynamicFormRenderer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import api from '../../services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { styled } from '@mui/system';

// Custom styled button component to ensure theme colors are applied
const StyledButton = styled(Button)(({ theme }) => ({
  '&.MuiButton-containedPrimary': {
    backgroundColor: theme.palette.primary.main + ' !important',
    color: theme.palette.primary.contrastText + ' !important',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark + ' !important',
    }
  },
  '&.MuiButton-outlinedPrimary': {
    borderColor: theme.palette.primary.main + ' !important',
    color: theme.palette.primary.main + ' !important',
    '&:hover': {
      backgroundColor: theme.palette.primary.main + '11 !important',
    }
  },
  '&.MuiButton-textPrimary': {
    color: theme.palette.primary.main + ' !important',
  }
}));

const ProfessionalSubmitterDashboard = React.memo(() => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Tab state (replacing modal state)
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  
  // State for expanded request card (replaces modal)
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  
  // Form submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Search Names tab state
  const [searchNamesFilter, setSearchNamesFilter] = useState('');
  const [searchNamesPage, setSearchNamesPage] = useState(1);

  // Form handling with React Hook Form
  const { handleSubmit, control, reset, formState: { errors }, watch } = useForm({
    resolver: zodResolver(z.object({})), // Will be dynamically updated based on form config
    mode: 'onChange',
  });

  const [activeFormConfig, setActiveFormConfig] = useState(null);

  // React Query for fetching user requests with real-time updates
  const { 
    data: userRequests = [], 
    isLoading: requestsLoading, 
    error: requestsError,
    refetch: refetchRequests 
  } = useQuery({
    queryKey: ['userRequests'],
    queryFn: async () => {
      const response = await api.get('/api/v1/name-requests/my-requests');
      // Server returns data directly, ensure it's an array
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30000,
    cacheTime: 300000,
    retry: 2,
    onSuccess: (data) => {
      // Auto-expand the first request if there is one and none is currently expanded
      if (data?.length > 0 && !expandedRequestId) {
        setExpandedRequestId(data[0].id);
      }
    }
  });

  // React Query for fetching form configuration
  const { 
    data: formConfig, 
    isLoading: formConfigLoading,
    error: formConfigError
  } = useQuery({
    queryKey: ['formConfig'],
    queryFn: async () => {
      const response = await api.get('/api/v1/form-configurations/active');
      // Server returns data directly, handle both nested and direct structure
      const data = response.data;
      return data?.data || data || {};
    },
    staleTime: 300000,
    cacheTime: 600000,
    onSuccess: (data) => {
      setActiveFormConfig(data);
      
      // Dynamically create Zod schema based on form configuration
      if (data && data.fields) {
        const schemaObject = {};
        data.fields.forEach(field => {
          if (field.required) {
            schemaObject[field.name] = z.any().nonempty(`${field.label || field.name} is required`);
          } else {
            schemaObject[field.name] = z.any().optional();
          }
        });
        
        // Update the form's resolver with the new schema
        reset({}, { resolver: zodResolver(z.object(schemaObject)) });
      }
    },
  });

  // React Query mutation for submitting a new request
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
      // Reset form and show success message
      reset();
      setSubmitSuccess(true);
      toast.success('Request submitted successfully!');
      
      // Invalidate and refetch requests to show the new one
      queryClient.invalidateQueries(['userRequests']);
      
      // Clear success message after 5 seconds if user doesn't navigate away
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    },
    onError: (error) => {
      setSubmitError(error.message || 'Something went wrong. Please try again.');
      toast.error('Failed to submit request');
    }
  });

  // Form submission handler
  const onSubmit = (data) => {
    submitRequestMutation.mutate(data);
  };

  // Fetch all approved requests for Search Names tab
  const { data: approvedRequests = [], isLoading: approvedRequestsLoading } = useQuery({
    queryKey: ['approved-requests'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/name-requests');
        console.log('Approved requests response:', response.data);
        // Filter for approved requests only
        return response.data.filter(request => request.status === 'approved');
      } catch (error) {
        console.error('Error fetching approved requests:', error);
        throw error;
      }
    },
    staleTime: 300000, // 5 minutes
    cacheTime: 600000, // 10 minutes
  });

  // Search Names data sorted by most recent approval
  const searchNamesData = useMemo(() => {
    return [...approvedRequests].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return dateB - dateA; // Most recent first
    });
  }, [approvedRequests]);

  // Filtered search names data
  const filteredSearchNamesData = useMemo(() => {
    let data = searchNamesData;
    
    // Apply search filter
    if (searchNamesFilter) {
      data = data.filter(request => {
        // Extract title from form data based on form configuration
        const title = request.name || request.title || request.productName || 
                     (request.formData && (request.formData.name || request.formData.title || request.formData.productName));
        
        if (!title) return false;
        
        return title.toLowerCase().includes(searchNamesFilter.toLowerCase());
      });
    }
    
    return data.slice((searchNamesPage - 1) * 10, searchNamesPage * 10);
  }, [searchNamesData, searchNamesFilter, searchNamesPage]);

  // Performance optimization: Memoized filtered requests
  const filteredRequests = useMemo(() => {
    if (!userRequests) return [];
    
    return userRequests.filter(request => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        (request.requestType || '').toLowerCase().includes(searchLower) ||
        (request.status || '').toLowerCase().includes(searchLower) ||
        (request.formData && Object.values(request.formData).some(value => 
          String(value).toLowerCase().includes(searchLower)
        ))
      );
    });
  }, [userRequests, searchQuery]);

  // Performance optimization: Memoized status steps
  const statusSteps = useMemo(() => [
    {
      label: 'Submitted',
      description: 'Request submitted for review',
      icon: <AssignmentIcon />,
      status: 'submitted'
    },
    {
      label: 'Brand Review',
      description: 'Under brand team review',
      icon: <BusinessIcon />,
      status: 'brand_review'
    },
    {
      label: 'Legal Review',
      description: 'Legal compliance check',
      icon: <GavelIcon />,
      status: 'legal_review'
    },
    {
      label: 'Approved',
      description: 'Request approved and ready',
      icon: <CheckCircleIcon />,
      status: 'approved'
    }
  ], []);

  // Performance optimization: Memoized helper functions
  const getActiveStep = useCallback((status) => {
    const statusMap = {
      'draft': -1,
      'submitted': 0,
      'under_review': 0,
      'brand_review': 1,
      'legal_review': 2,
      'approved': 3,
      'on_hold': -1,
      'cancelled': -1
    };
    return statusMap[status] || 0;
  }, []);

  const getStatusColor = useCallback((status) => {
    const colorMap = {
      'draft': theme.palette.grey[500],
      'submitted': theme.palette.info.main,
      'under_review': theme.palette.warning.main,
      'brand_review': theme.palette.warning.main,
      'legal_review': theme.palette.warning.main,
      'approved': theme.palette.success.main,
      'on_hold': theme.palette.warning.main,
      'cancelled': theme.palette.error.main
    };
    return colorMap[status] || theme.palette.grey[500];
  }, [theme.palette]);

  // Accessibility: Keyboard event handlers
  const handleKeyDown = useCallback((event, action, ...args) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action(...args);
    }
  }, []);

  // Performance optimization: Memoized mutation handlers
  const holdRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      const response = await api.patch(`/api/name-requests/${requestId}/hold`);
      return response.data;
    },
    onMutate: async (requestId) => {
      await queryClient.cancelQueries(['userRequests']);
      const previousRequests = queryClient.getQueryData(['userRequests']);
      
      queryClient.setQueryData(['userRequests'], (old = []) =>
        old.map(request =>
          request.id === requestId
            ? { ...request, status: 'on_hold', updatedAt: new Date().toISOString() }
            : request
        )
      );
      
      return { previousRequests };
    },
    onError: (err, requestId, context) => {
      queryClient.setQueryData(['userRequests'], context.previousRequests);
      toast.error('Failed to hold request. Please try again.');
    },
    onSuccess: () => {
      toast.success('Request put on hold successfully!');
      queryClient.invalidateQueries(['userRequests']);
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      const response = await api.patch(`/api/name-requests/${requestId}/cancel`);
      return response.data;
    },
    onMutate: async (requestId) => {
      await queryClient.cancelQueries(['userRequests']);
      const previousRequests = queryClient.getQueryData(['userRequests']);
      
      queryClient.setQueryData(['userRequests'], (old = []) =>
        old.map(request =>
          request.id === requestId
            ? { ...request, status: 'cancelled', updatedAt: new Date().toISOString() }
            : request
        )
      );
      
      return { previousRequests };
    },
    onError: (err, requestId, context) => {
      queryClient.setQueryData(['userRequests'], context.previousRequests);
      toast.error('Failed to cancel request. Please try again.');
    },
    onSuccess: () => {
      toast.success('Request cancelled successfully!');
      queryClient.invalidateQueries(['userRequests']);
    },
  });

  const handleHoldRequest = useCallback((requestId) => {
    holdRequestMutation.mutate(requestId);
  }, [holdRequestMutation]);

  const handleCancelRequest = useCallback((requestId) => {
    if (window.confirm('Are you sure you want to cancel this request? This action cannot be undone.')) {
      cancelRequestMutation.mutate(requestId);
    }
  }, [cancelRequestMutation]);

  const handleViewRequest = useCallback((requestId) => {
    setSelectedRequestId(requestId);
    setDetailsModalOpen(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setDetailsModalOpen(false);
    setSelectedRequestId(null);
  }, []);

  // Toggle expansion for a request card
  const handleToggleExpand = useCallback((requestId) => {
    setExpandedRequestId(prevId => prevId === requestId ? null : requestId);
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleOpenRequestDetails = useCallback((requestId) => {
    // Instead of opening modal, expand the card
    handleToggleExpand(requestId);
  }, [handleToggleExpand]);

  const renderErrorPlaceholder = useCallback((errorMessage) => (
    <Alert severity="error" sx={{ mt: '1.5rem' }}>
      {errorMessage || 'Something went wrong. Please try again later.'}
    </Alert>
  ), []);

  const renderLoadingSkeleton = useCallback(() => (
    <Box sx={{ p: '1.5rem' }}>
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} variant="rectangular" height={80} sx={{ mb: '1.5rem' }} />
      ))}
    </Box>
  ), []);

  // Helper function to render field values in a user-friendly format
  const renderFieldValue = (value) => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // Handle arrays
        return (
          <Box sx={{ ml: 1 }}>
            {value.map((item, index) => (
              <Box key={index} sx={{ mb: 0.5 }}>
                • {typeof item === 'object' ? renderFieldValue(item) : String(item)}
              </Box>
            ))}
          </Box>
        );
      } else {
        // Handle objects
        return (
          <Box sx={{ ml: 1 }}>
            {Object.entries(value).map(([key, val]) => (
              <Box key={key} sx={{ mb: 0.5 }}>
                <Typography component="span" variant="body2" sx={{ fontWeight: 'medium' }}>
                  {key}:
                </Typography>{' '}
                {typeof val === 'object' ? renderFieldValue(val) : String(val)}
              </Box>
            ))}
          </Box>
        );
      }
    }
    
    // Default case: convert to string
    return String(value);
  };

  return (
    <Container fluid className="dashboard-container">
      <Paper
        elevation={0}
        sx={{
          borderRadius: (theme) => theme.shape.borderRadius,
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          mb: '1.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="submitter dashboard tabs"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{ 
              '& .MuiTab-root': { 
                fontSize: '0.875rem',
                textTransform: 'none',
                minWidth: 'auto',
                px: '1rem',
              } 
            }}
          >
            <Tab 
              label="My Requests" 
              id="tab-0"
              aria-controls="tabpanel-0"
              icon={<AssignmentIcon />}
              iconPosition="start"
            />
            <Tab 
              label="New Request" 
              id="tab-1"
              aria-controls="tabpanel-1"
              icon={<AddIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Search Names" 
              id="tab-2"
              aria-controls="tabpanel-2"
              icon={<SearchIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Guidelines" 
              id="tab-3"
              aria-controls="tabpanel-3"
              icon={<SupportIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {/* My Requests Tab Panel */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: '1.5rem' }}>
            <Box sx={{ mb: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <TextField
                placeholder="Search requests..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: '250px' } }}
              />
            </Box>
            
            {requestsError && renderErrorPlaceholder(requestsError.message)}
            
            {requestsLoading ? (
              renderLoadingSkeleton()
            ) : filteredRequests.length === 0 ? (
              <Alert severity="info" sx={{ mt: '1rem' }}>
                No requests found.
              </Alert>
            ) : (
              <Box>
                {filteredRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    sx={{ 
                      mb: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                    }}
                    onClick={() => handleToggleExpand(request.id)}
                  >
                    <CardContent 
                      sx={{ 
                        p: '1rem',
                        '&:last-child': { pb: '1rem' }
                      }}
                    >
                      {/* Status Stepper - Now visible without expansion */}
                      <Box sx={{ mb: 2 }}>
                        <Stepper activeStep={getActiveStep(request.status)} alternativeLabel>
                          {statusSteps.map((step) => (
                            <Step key={step.label} completed={getActiveStep(request.status) >= statusSteps.indexOf(step)}>
                              <StepLabel 
                                StepIconProps={{ 
                                  sx: { 
                                    color: getActiveStep(request.status) >= statusSteps.indexOf(step) ? getStatusColor(request.status) : undefined 
                                  } 
                                }}
                              >
                                {step.label}
                              </StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center'
                      }}>
                        <Box>
                          <Typography variant="h6" component="div">
                            {request.formData?.productName || request.formData?.name || request.formData?.title || 'Unnamed Request'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(request.createdAt).toLocaleDateString()} • {request.status.replace('_', ' ')}
                          </Typography>
                        </Box>
                        <Chip 
                          label={request.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(request.status),
                            color: theme.palette.getContrastText(getStatusColor(request.status)),
                            fontWeight: 600,
                            ml: 1
                          }}
                        />
                      </Box>
                      
                      {/* Action buttons - Now visible without expansion */}
                      {(request.status === 'submitted' || request.status === 'brand_review' || request.status === 'legal_review') && (
                        <Box sx={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', mt: 2 }}>
                          <Button 
                            variant="outlined"
                            color="warning"
                            size="small"
                            startIcon={<PauseCircleIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHoldRequest(request.id);
                            }}
                          >
                            Put on Hold
                          </Button>
                          <Button 
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRequest(request.id);
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                      
                      {/* Show More/Less button */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button
                          variant="text"
                          onClick={() => handleToggleExpand(request.id)}
                          endIcon={expandedRequestId === request.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        >
                          {expandedRequestId === request.id ? 'Show Less' : 'Show More'}
                        </Button>
                      </Box>
                      
                      <Collapse in={expandedRequestId === request.id} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: '1.5rem' }}>
                          <Divider sx={{ mb: '1.5rem' }} />
                          
                          {/* Request details */}
                          <Box sx={{ mb: '1.5rem' }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Request Details
                            </Typography>
                            <Grid container spacing={2}>
                              {formConfig && formConfig.fields && formConfig.fields.map((field) => {
                                const value = request.formData?.[field.name];
                                if (!value) return null;
                                
                                return (
                                  <Grid item xs={12} sm={6} key={field.name}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      {field.label || field.name}
                                    </Typography>
                                    <Typography variant="body2">
                                      {renderFieldValue(value)}
                                    </Typography>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </Box>
                          
                          {/* Status History */}
                          <Box sx={{ mb: '1.5rem' }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Status History
                            </Typography>
                            <Box sx={{ ml: 2 }}>
                              {request.statusHistory && request.statusHistory.length > 0 ? (
                                request.statusHistory.map((statusChange, index) => (
                                  <Box key={index} sx={{ mb: 1 }}>
                                    <Typography variant="body2">
                                      <strong>{statusChange.status.replace('_', ' ')}</strong> - {new Date(statusChange.timestamp).toLocaleString()}
                                    </Typography>
                                    {statusChange.comments && (
                                      <Typography variant="body2" color="text.secondary">
                                        Comment: {statusChange.comments}
                                      </Typography>
                                    )}
                                  </Box>
                                ))
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No status history available
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </TabPanel>
        
        {/* New Request Tab Panel with Dynamic Form */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: '1.5rem' }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Submit a New Request
            </Typography>
            
            {formConfigError && renderErrorPlaceholder(formConfigError.message)}
            
            {formConfigLoading ? (
              renderLoadingSkeleton()
            ) : !formConfig ? (
              <Alert severity="warning" sx={{ mt: '1rem' }}>
                No active form configuration found. Please contact an administrator.
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
                  {submitSuccess && (
                    <Alert severity="success" sx={{ mb: '1.5rem' }}>
                      Request submitted successfully!
                    </Alert>
                  )}
                  
                  {submitError && (
                    <Alert severity="error" sx={{ mb: '1.5rem' }}>
                      {submitError}
                    </Alert>
                  )}
                  
                  {/* Dynamic Form Renderer */}
                  <DynamicFormRenderer
                    formConfig={formConfig}
                    control={control}
                    errors={errors}
                    watch={watch}
                    setValue={reset}
                    role="submitter"
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
        
        {/* Search Names Tab Panel */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: '1.5rem' }}>
            {/* Search and Filters */}
            <Box sx={{ mb: '1.5rem' }}>
              <TextField
                fullWidth
                placeholder="Search approved names..."
                value={searchNamesFilter}
                onChange={(e) => setSearchNamesFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                aria-label="Search approved names"
                size="small"
                sx={{ mb: { xs: 2, md: 0 } }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {filteredSearchNamesData.length} of {searchNamesData.length} approved names
              </Typography>
            </Box>
            
            {approvedRequestsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {filteredSearchNamesData.length === 0 ? (
                  <Alert severity="info">
                    No approved names found.
                  </Alert>
                ) : (
                  <>
                    {filteredSearchNamesData.map(request => (
                      <Card 
                        key={request.id} 
                        sx={{ 
                          mb: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme => theme.shadows[3],
                          }
                        }}
                        onClick={() => {
                          setSelectedRequestId(request.id);
                          setDetailsModalOpen(true);
                        }}
                      >
                        <CardContent sx={{ p: '1rem', '&:last-child': { pb: '1rem' } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="h6" component="h3">
                                {request.name || request.title || request.productName || 
                                 (request.formData && (request.formData.name || request.formData.title || request.formData.productName)) || 
                                 'Unnamed Request'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Approved on {request.updatedAt ? format(parseISO(request.updatedAt), 'MMM d, yyyy') : 
                                            (request.createdAt ? format(parseISO(request.createdAt), 'MMM d, yyyy') : 'Unknown date')}
                              </Typography>
                            </Box>
                            <Chip 
                              label="Approved" 
                              color="success" 
                              size="small" 
                              icon={<CheckCircleIcon />} 
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Pagination */}
                    {searchNamesData.length > 10 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: '1.5rem' }}>
                        <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                          <Button 
                            variant="outlined" 
                            disabled={searchNamesPage === 1}
                            onClick={() => setSearchNamesPage(prev => Math.max(prev - 1, 1))}
                          >
                            Previous
                          </Button>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mx: '0.5rem' }}>
                            Page {searchNamesPage} of {Math.ceil(searchNamesData.length / 10)}
                          </Typography>
                          <Button 
                            variant="outlined" 
                            disabled={searchNamesPage >= Math.ceil(searchNamesData.length / 10)}
                            onClick={() => setSearchNamesPage(prev => Math.min(prev + 1, Math.ceil(searchNamesData.length / 10)))}
                          >
                            Next
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        </TabPanel>
        
        {/* Guidelines Tab Panel */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: '1.5rem' }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Naming Request Guidelines
            </Typography>
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: '1.5rem', 
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: (theme) => `${theme.shape.borderRadius}px`,
              }}
            >
              <Typography variant="body1" paragraph>
                Please follow these guidelines when submitting naming requests:
              </Typography>
              
              <Box component="ul" sx={{ pl: '2rem' }}>
                <Typography component="li" variant="body1" paragraph>
                  Be clear and specific about your naming needs.
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Include relevant context about your project or product.
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Specify any constraints or requirements for the name.
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Be aware of naming requests approval typically takes 3-5 business days.
                </Typography>
              </Box>
            </Paper>
          </Box>
        </TabPanel>
        
        {/* Archive Tab Panel */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: '1.5rem' }}>
            <Box sx={{ mb: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <Typography variant="h6" component="h2" sx={{ m: 0 }}>
                Request Archive
              </Typography>
              <TextField
                placeholder="Search archived requests..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: '250px' } }}
              />
            </Box>
            
            {requestsError && renderErrorPlaceholder(requestsError.message)}
            
            {requestsLoading ? (
              renderLoadingSkeleton()
            ) : (
              <Box>
                {userRequests
                  .filter(request => ['rejected', 'cancelled', 'completed'].includes(request.status))
                  .map((request) => (
                    <Card 
                      key={request.id} 
                      onClick={() => handleOpenRequestDetails(request.id)}
                      sx={{ 
                        mb: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" component="div">
                              {request.formData?.productName || request.formData?.name || request.formData?.title || 'Unnamed Request'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Submitted: {format(parseISO(request.createdAt || request.created_at), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                          <Chip
                            label={request.status}
                            color={
                              request.status === 'completed' ? 'success' :
                              request.status === 'rejected' ? 'error' :
                              'default'
                            }
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>
      
      {/* TabPanel component for accessibility */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ p: '1.5rem' }}>
          <Typography variant="h6" component="h2" gutterBottom>
            My Requests
          </Typography>
        </Box>
      </TabPanel>
    </Container>
  );
});

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
      {value === index && (
        <>{children}</>
      )}
    </div>
  );
};

ProfessionalSubmitterDashboard.displayName = 'ProfessionalSubmitterDashboard';

export default ProfessionalSubmitterDashboard;
