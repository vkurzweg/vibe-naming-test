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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
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
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { 
  fetchFormConfigs, 
  activateFormConfig, 
  deleteFormConfig 
} from '../../features/formConfig/formConfigSlice';
import { fetchReviewRequests } from '../../features/review/reviewSlice';
import { fetchUserRequests } from '../../features/requests/requestsSlice';
import { getStatusColor, getStatusIcon } from '../../theme/professionalTheme';
import FormConfigModal from '../../components/FormConfig/FormConfigModal';
import RequestDetailsModal from '../../components/Requests/RequestDetailsModal';

const ProfessionalAdminDashboard = () => {
  const dispatch = useDispatch();
  const { formConfigs, activeFormConfig, loading: formConfigLoading, error: formConfigError } = useSelector((state) => state.formConfig);
  const { requests: reviewRequests, loading: reviewLoading, error: reviewError } = useSelector((state) => state.review);
  const { requests: allRequests, loading: requestsLoading, error: requestsError } = useSelector((state) => state.requests);
  
  const [activeTab, setActiveTab] = useState(0);
  const [formConfigModalOpen, setFormConfigModalOpen] = useState(false);
  const [selectedFormConfig, setSelectedFormConfig] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  useEffect(() => {
    dispatch(fetchFormConfigs());
    
    // Fetch review requests and user requests for the Review tab
    if (activeTab === 1) {
      console.log('Fetching review data for admin dashboard...');
      dispatch(fetchReviewRequests({
        status: 'all',
        page: 1,
        limit: 100
      }));
      
      dispatch(fetchUserRequests({
        page: 1,
        limit: 100
      }));
    }
  }, [dispatch, activeTab]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Fetch data when switching to the Review tab
    if (newValue === 1) {
      dispatch(fetchReviewRequests({
        status: 'all',
        page: 1,
        limit: 100
      }));
      
      dispatch(fetchUserRequests({
        page: 1,
        limit: 100
      }));
    }
  };
  
  // Handle viewing request details
  const handleViewRequest = (requestId) => {
    setSelectedRequestId(requestId);
    setDetailsModalOpen(true);
  };
  
  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };
  
  // Get status chip props
  const getStatusChipProps = (status) => ({
    label: status?.replace('_', ' ').toUpperCase(),
    sx: {
      backgroundColor: getStatusColor(status),
      color: '#fff',
      fontWeight: 600,
      fontSize: '0.75rem',
    },
    size: 'small',
    icon: getStatusIcon(status),
  });
  
  // Process review data
  const allRequestsData = Array.isArray(allRequests?.data) ? allRequests.data : [];
  const reviewRequestsData = Array.isArray(reviewRequests) ? reviewRequests : [];
  
  // Combine and deduplicate requests
  const combinedRequests = [...allRequestsData, ...reviewRequestsData].reduce((acc, request) => {
    if (!acc.find(r => r._id === request._id)) {
      acc.push(request);
    }
    return acc;
  }, []);
  
  // Filter requests based on search and status
  const filteredRequests = combinedRequests.filter(request => {
    const matchesSearch = !searchQuery || 
      request.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Show loading state if either data source is loading
  const isRequestsLoading = requestsLoading || reviewLoading;
  
  // Show error if either data source has an error
  const hasRequestsError = requestsError || reviewError;
  const requestsErrorMessage = requestsError || reviewError || 'An error occurred while fetching requests';
  
  // Use formConfigLoading and formConfigError for form config tab
  const loading = formConfigLoading;
  const error = formConfigError;
  
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
              label="Review Requests" 
              icon={<AssignmentIcon />} 
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
        
        {/* Tab 2: Review Requests */}
        {activeTab === 1 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight={600}>
                Review Requests
              </Typography>
            </Box>
            
            {/* Search and Filter */}
            <Box mb={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Requests Table */}
            {hasRequestsError ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {requestsErrorMessage}
                <Button 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => {
                    dispatch(fetchReviewRequests());
                    dispatch(fetchUserRequests());
                  }}
                >
                  Retry
                </Button>
              </Alert>
            ) : isRequestsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : filteredRequests.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No requests found. Try adjusting your search or filter criteria.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Request</TableCell>
                      <TableCell>Requestor</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow 
                        key={request._id} 
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleViewRequest(request._id)}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {request.title || 'Untitled Request'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {typeof request.description === 'object' 
                                ? request.description?.text || 'No description' 
                                : request.description || 'No description'
                              }
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.requestor?.name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip {...getStatusChipProps(request.status)} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(request.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewRequest(request._id);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
        
        {/* Tab 3: User Management */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h5" fontWeight={600} mb={3}>
              User Management
            </Typography>
            <Alert severity="info">
              User management functionality will be implemented in a future update.
            </Alert>
          </Box>
        )}
        
        {/* Tab 4: System Settings */}
        {activeTab === 3 && (
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
      
      {/* Request Details Modal */}
      <RequestDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        requestId={selectedRequestId}
      />
    </Box>
  );
};

export default ProfessionalAdminDashboard;
