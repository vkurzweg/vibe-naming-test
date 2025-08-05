import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { format, parseISO } from 'date-fns';
import { Container, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  Skeleton,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Support as SupportIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { showSnackbar } from '../../features/ui/uiSlice';
import RequestDetailsModal from '../../components/Requests/RequestDetailsModal';
import SubmitRequestModal from '../../components/Requests/SubmitRequestModal';

const ProfessionalSubmitterDashboard = React.memo(() => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [submitRequestModalOpen, setSubmitRequestModalOpen] = useState(false);

  // React Query for fetching user requests with real-time updates
  const { 
    data: userRequests = [], 
    isLoading: requestsLoading, 
    error: requestsError,
    refetch: refetchRequests 
  } = useQuery({
    queryKey: ['userRequests'],
    queryFn: async () => {
      const response = await fetch('/api/name-requests/my-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user requests');
      const data = await response.json();
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    },
    staleTime: 30000,
    cacheTime: 300000,
    retry: 2,
  });

  // React Query for fetching form configuration
  const { 
    data: formConfig, 
    isLoading: formConfigLoading 
  } = useQuery({
    queryKey: ['formConfig'],
    queryFn: async () => {
      const response = await fetch('/api/form-configurations/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch form configuration');
      const data = await response.json();
      return data?.data || {};
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

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
      const response = await fetch(`/api/name-requests/${requestId}/hold`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to hold request');
      }
      const data = await response.json();
      return data.data || {};
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
      const response = await fetch(`/api/name-requests/${requestId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to cancel request');
      }
      const data = await response.json();
      return data.data || {};
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

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    // Accessibility: Announce tab change to screen readers
    const tabNames = ['Overview', 'My Requests', 'Guidelines', 'Archive'];
    const announcement = `Switched to ${tabNames[newValue]} tab`;
    
    // Create temporary element for screen reader announcement
    const announcement_element = document.createElement('div');
    announcement_element.setAttribute('aria-live', 'polite');
    announcement_element.setAttribute('aria-atomic', 'true');
    announcement_element.style.position = 'absolute';
    announcement_element.style.left = '-10000px';
    announcement_element.textContent = announcement;
    document.body.appendChild(announcement_element);
    
    setTimeout(() => {
      document.body.removeChild(announcement_element);
    }, 1000);
  }, []);

  // Accessibility: Enhanced search with proper ARIA attributes
  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setSearchQuery(value);
    
    // Accessibility: Announce search results count
    const resultsCount = userRequests?.filter(request => {
      if (!value) return true;
      const searchLower = value.toLowerCase();
      return (
        (request.requestType || '').toLowerCase().includes(searchLower) ||
        (request.status || '').toLowerCase().includes(searchLower)
      );
    }).length || 0;
    
    if (value) {
      const announcement = `${resultsCount} request${resultsCount !== 1 ? 's' : ''} found`;
      // Announce to screen readers
      setTimeout(() => {
        const searchResults = document.getElementById('search-results-announcement');
        if (searchResults) {
          searchResults.textContent = announcement;
        }
      }, 300);
    }
  }, [userRequests]);

  // Enhanced request card with accessibility features
  const renderRequestWithStatusProgression = useCallback((request) => (
    <Card
      key={request.id}
      sx={{
        mb: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(getStatusColor(request.status), 0.2)}`,
        background: `linear-gradient(135deg, ${alpha(getStatusColor(request.status), 0.05)}, transparent)`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          border: `1px solid ${alpha(getStatusColor(request.status), 0.4)}`,
        },
        '&:focus-within': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
        }
      }}
      // Accessibility: Proper ARIA attributes
      role="article"
      aria-labelledby={`request-title-${request.id}`}
      aria-describedby={`request-status-${request.id}`}
      tabIndex={0}
      onKeyDown={(e) => handleKeyDown(e, handleViewRequest, request.id)}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Request Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography 
              id={`request-title-${request.id}`}
              variant="h6" 
              sx={{ fontWeight: 600, mb: 1 }}
              component="h3"
            >
              {formConfig?.fields?.find(f => f.name === 'requestType')?.options?.find(opt => opt.value === request.requestType)?.label || request.requestType || 'Naming Request'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submitted {request.createdAt ? format(parseISO(request.createdAt), 'MMM d, yyyy') : 'Recently'}
            </Typography>
          </Box>
          <Chip
            id={`request-status-${request.id}`}
            label={request.status?.replace('_', ' ').toUpperCase() || 'DRAFT'}
            sx={{
              backgroundColor: alpha(getStatusColor(request.status), 0.1),
              color: getStatusColor(request.status),
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
            aria-label={`Request status: ${request.status?.replace('_', ' ') || 'draft'}`}
          />
        </Box>

        {/* Dynamic Request Data Display */}
        {renderDynamicRequestData(request)}

        {/* Status Progression Stepper */}
        <Box sx={{ mb: 3, mt: 3 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}
            component="h4"
          >
            Progress Timeline
          </Typography>
          <Stepper 
            activeStep={getActiveStep(request.status)} 
            orientation="horizontal"
            aria-label="Request progress timeline"
            sx={{
              '& .MuiStepLabel-root': {
                cursor: 'default',
              },
              '& .MuiStepIcon-root': {
                fontSize: '1.2rem',
              },
              '& .MuiStepIcon-root.Mui-active': {
                color: getStatusColor(request.status),
              },
              '& .MuiStepIcon-root.Mui-completed': {
                color: theme.palette.success.main,
              },
              '& .MuiStepConnector-line': {
                borderTopWidth: 2,
              },
              '& .MuiStepLabel-label': {
                fontSize: '0.75rem',
                fontWeight: 500,
              },
              '& .MuiStepLabel-label.Mui-active': {
                color: getStatusColor(request.status),
                fontWeight: 600,
              },
              '& .MuiStepLabel-label.Mui-completed': {
                color: theme.palette.success.main,
              }
            }}
          >
            {statusSteps.map((step, index) => (
              <Step key={step.status}>
                <StepLabel
                  StepIconComponent={({ active, completed }) => (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: completed 
                          ? theme.palette.success.main 
                          : active 
                            ? getStatusColor(request.status)
                            : theme.palette.grey[300],
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                      aria-label={`Step ${index + 1}: ${step.label}${completed ? ' completed' : active ? ' current' : ' pending'}`}
                    >
                      {completed ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : index + 1}
                    </Box>
                  )}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: getStatusColor(request.status) }}>
              {Math.round(((getActiveStep(request.status) + 1) / statusSteps.length) * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((getActiveStep(request.status) + 1) / statusSteps.length) * 100}
            aria-label={`Request progress: ${Math.round(((getActiveStep(request.status) + 1) / statusSteps.length) * 100)}% complete`}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(getStatusColor(request.status), 0.1),
              '& .MuiLinearProgress-bar': {
                backgroundColor: getStatusColor(request.status),
                borderRadius: 3,
              }
            }}
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }} role="group" aria-label="Request actions">
          <Button
            size="small"
            onClick={() => handleViewRequest(request.id)}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              color: theme.palette.primary.main,
              '&:focus': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
              }
            }}
            aria-describedby={`request-title-${request.id}`}
          >
            View Details
          </Button>
          {(request.status === 'draft' || request.status === 'submitted') && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => handleHoldRequest(request.id)}
              disabled={holdRequestMutation.isLoading}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                '&:focus': {
                  outline: `2px solid ${theme.palette.warning.main}`,
                  outlineOffset: '2px',
                }
              }}
              aria-label={`Put request on hold: ${formConfig?.fields?.find(f => f.name === 'requestType')?.options?.find(opt => opt.value === request.requestType)?.label || request.requestType || 'Naming Request'}`}
            >
              {holdRequestMutation.isLoading ? 'Holding...' : 'Hold'}
            </Button>
          )}
          {request.status !== 'approved' && request.status !== 'cancelled' && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => handleCancelRequest(request.id)}
              disabled={cancelRequestMutation.isLoading}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                '&:focus': {
                  outline: `2px solid ${theme.palette.error.main}`,
                  outlineOffset: '2px',
                }
              }}
              aria-label={`Cancel request: ${formConfig?.fields?.find(f => f.name === 'requestType')?.options?.find(opt => opt.value === request.requestType)?.label || request.requestType || 'Naming Request'}`}
            >
              {cancelRequestMutation.isLoading ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  ), [formConfig, statusSteps, getActiveStep, getStatusColor, handleViewRequest, handleHoldRequest, handleCancelRequest, holdRequestMutation.isLoading, cancelRequestMutation.isLoading, theme]);

  const renderDynamicRequestData = useCallback((request) => {
    if (!formConfig?.fields) {
      return <Typography>Loading form configuration...</Typography>;
    }

    return (
      <Box sx={{ mt: 2 }}>
        {formConfig.fields.map((field) => {
          const value = request.formData?.[field.name] || request[field.name];
          if (!value) return null;

          return (
            <Box key={field.name} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {field.label || field.name}
              </Typography>
              <Typography variant="body2">
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  }, [formConfig]);

  return (
    <Container maxWidth="xl">
      {/* Accessibility: Screen reader announcements */}
      <div 
        id="search-results-announcement" 
        aria-live="polite" 
        aria-atomic="true"
        style={{ 
          position: 'absolute', 
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      />
      
      <Box sx={{ width: '100%', mb: 3 }}>
        {/* Enhanced Tabs with proper accessibility */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Dashboard navigation tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
              minHeight: 48,
              '&:focus': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          <Tab 
            icon={<SupportIcon />} 
            label="Overview" 
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab 
            icon={<AssignmentIcon />} 
            label="My Requests" 
            id="tab-1"
            aria-controls="tabpanel-1"
          />
          <Tab 
            icon={<SupportIcon />} 
            label="Guidelines" 
            id="tab-2"
            aria-controls="tabpanel-2"
          />
          <Tab 
            icon={<ArchiveIcon />} 
            label="Archive" 
            id="tab-3"
            aria-controls="tabpanel-3"
          />
        </Tabs>
      </Box>

      {/* Tab Panels with proper accessibility */}
      <div role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1" hidden={activeTab !== 1}>
        {activeTab === 1 && (
          <>
            {/* Enhanced Search with accessibility */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search your requests..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:focus-within': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: '2px',
                    }
                  }
                }}
                aria-label="Search requests"
                aria-describedby="search-results-announcement"
              />
            </Box>
            
            {/* Results with proper heading structure */}
            <Box component="section" aria-labelledby="requests-heading">
              <Typography 
                id="requests-heading"
                variant="h6" 
                sx={{ fontWeight: 600, mb: 2 }}
                component="h2"
              >
                My Requests ({filteredRequests.length})
              </Typography>
              
              {filteredRequests.length === 0 ? (
                <Box textAlign="center" py={4} role="status" aria-live="polite">
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      mb: 1
                    }}
                  >
                    {searchQuery ? 'No requests found' : 'No Active Requests'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{
                      color: theme.palette.text.secondary,
                      mb: 3,
                      maxWidth: 400,
                      mx: 'auto',
                      lineHeight: 1.6,
                    }}
                  >
                    {searchQuery 
                      ? 'Try adjusting your search terms or clear the search to see all requests.'
                      : 'Get started by submitting your first naming request. Our team will guide you through the process.'
                    }
                  </Typography>
                  {!searchQuery && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => setSubmitRequestModalOpen(true)}
                      sx={{
                        py: 1,
                        px: 3,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.8)})`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${theme.palette.primary.main})`,
                        },
                        '&:focus': {
                          outline: `2px solid ${theme.palette.primary.main}`,
                          outlineOffset: '2px',
                        }
                      }}
                      aria-label="Submit a new naming request"
                    >
                      Submit a Request
                    </Button>
                  )}
                </Box>
              ) : (
                <Box component="section" aria-label="List of requests">
                  {filteredRequests.map(renderRequestWithStatusProgression)}
                </Box>
              )}
            </Box>
          </>
        )}
      </div>

      {/* Request Details Modal */}
      <RequestDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        requestId={selectedRequestId}
      />

      {/* Submit Request Modal */}
      <SubmitRequestModal
        open={submitRequestModalOpen}
        onClose={() => setSubmitRequestModalOpen(false)}
      />
    </Container>
  );
});

ProfessionalSubmitterDashboard.displayName = 'ProfessionalSubmitterDashboard';

export default ProfessionalSubmitterDashboard;
