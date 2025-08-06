import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
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
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge,
  Avatar,
  Pagination,
  Skeleton,
  Stack,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-hot-toast';
import newColorPalette, { getStatusColor, getStatusIcon } from '../../theme/newColorPalette';
import {
  extractRequestTitle,
  extractRequestDescription,
  getDisplayableFormData,
  extractSubmitterInfo,
  formatRequestForRole,
  searchRequest
} from '../../utils/dynamicDataUtils';
import { Container, Row, Col } from 'react-bootstrap';
import FormConfigManager from '../../features/admin/FormConfigManager';

const ProfessionalAdminDashboard = React.memo(() => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user } = useSelector((state) => state.auth);
  const { formConfig } = useSelector((state) => state.formConfig || {});
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [selectedRows, setSelectedRows] = useState({});

  // Fetch all requests (admin has access to all)
  const { data: requests = [], isLoading: requestsLoading, error: requestsError, refetch: refetchRequests } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      const response = await api.get('/api/v1/name-requests');
      // Server returns data directly, ensure it's an array
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    retry: 2,
  });

  // Calculate stats client-side from requests data
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats', requests],
    queryFn: () => {
      if (!requests || !Array.isArray(requests)) {
        return {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          activeUsers: 0
        };
      }

      const totalRequests = requests.length;
      const pendingRequests = requests.filter(req => req.status === 'submitted' || req.status === 'brand_review' || req.status === 'legal_review').length;
      const approvedRequests = requests.filter(req => req.status === 'approved').length;
      const rejectedRequests = requests.filter(req => req.status === 'rejected').length;
      const activeUsers = new Set(requests.map(req => req.submittedBy)).size;

      return {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        activeUsers
      };
    },
    enabled: !!requests && Array.isArray(requests),
    staleTime: 30000,
  });

  // React Query mutations for admin operations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, comments }) => {
      const response = await api.put(`/api/name-requests/${requestId}/status`, { status, comments });
      if (!response.ok) throw new Error('Failed to update status');
      return response.data;
    },
    onMutate: async ({ requestId, status }) => {
      await queryClient.cancelQueries(['admin-requests']);
      const previousRequests = queryClient.getQueryData(['admin-requests']);
      
      queryClient.setQueryData(['admin-requests'], (old = []) =>
        old.map(request =>
          request.id === requestId
            ? { ...request, status, updatedAt: new Date().toISOString() }
            : request
        )
      );
      
      return { previousRequests };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['admin-requests'], context.previousRequests);
      toast.error('Failed to update status. Please try again.');
    },
    onSuccess: () => {
      toast.success('Status updated successfully!');
      queryClient.invalidateQueries(['admin-requests']);
      queryClient.invalidateQueries(['admin-stats', requests]);
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      const response = await api.delete(`/api/name-requests/${requestId}`);
      if (!response.ok) throw new Error('Failed to delete request');
      return response.data;
    },
    onMutate: async (requestId) => {
      await queryClient.cancelQueries(['admin-requests']);
      const previousRequests = queryClient.getQueryData(['admin-requests']);
      
      queryClient.setQueryData(['admin-requests'], (old = []) =>
        old.filter(request => request.id !== requestId)
      );
      
      return { previousRequests };
    },
    onError: (err, requestId, context) => {
      queryClient.setQueryData(['admin-requests'], context.previousRequests);
      toast.error('Failed to delete request. Please try again.');
    },
    onSuccess: () => {
      toast.success('Request deleted successfully!');
      queryClient.invalidateQueries(['admin-requests']);
      queryClient.invalidateQueries(['admin-stats', requests]);
    },
  });

  // Status progression configuration
  const getStatusSteps = useCallback(() => [
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

  // Dynamic request data rendering
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

  // TanStack Table columns configuration
  const requestColumns = useMemo(() => [
    {
      id: 'title',
      header: 'Request',
      accessorFn: (row) => extractRequestTitle(row, formConfig),
      cell: ({ getValue, row }) => (
        <Box>
          <Typography variant="subtitle2" noWrap>
            {getValue()}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {extractSubmitterInfo(row.original)?.name || 'Unknown'}
          </Typography>
        </Box>
      ),
      size: 200,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => {
        const status = getValue();
        return (
          <Chip
            label={status?.replace('_', ' ').toUpperCase()}
            size="small"
            sx={{
              backgroundColor: getStatusColor(status),
              color: theme.palette.getContrastText(getStatusColor(status)),
              fontWeight: 600,
            }}
          />
        );
      },
      size: 120,
    },
    {
      id: 'assignedTo',
      header: 'Assigned To',
      accessorKey: 'assignedTo',
      cell: ({ getValue }) => {
        const assignedTo = getValue();
        return assignedTo ? (
          <Chip
            avatar={<Avatar sx={{ width: 24, height: 24 }}>{assignedTo.charAt(0)}</Avatar>}
            label={assignedTo}
            size="small"
            variant="outlined"
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            Unassigned
          </Typography>
        );
      },
      size: 150,
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessorKey: 'createdAt',
      cell: ({ getValue }) => (
        <Typography variant="caption">
          {new Date(getValue()).toLocaleDateString()}
        </Typography>
      ),
      size: 100,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedRequest(row.original);
                setDetailsModalOpen(true);
              }}
              aria-label={`View details for ${extractRequestTitle(row.original, formConfig)}`}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this request?')) {
                  deleteRequestMutation.mutate(row.original.id);
                }
              }}
              disabled={deleteRequestMutation.isLoading}
              aria-label={`Delete ${extractRequestTitle(row.original, formConfig)}`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      size: 120,
      enableSorting: false,
    },
  ], [formConfig, theme, deleteRequestMutation]);

  // Filtered data for table
  const filteredData = useMemo(() => {
    let data = requests;
    
    if (statusFilter !== 'all') {
      data = data.filter(request => request.status === statusFilter);
    }
    
    return data;
  }, [requests, statusFilter]);

  // TanStack Table instance
  const table = useReactTable({
    data: filteredData,
    columns: requestColumns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  // Event handlers
  const handleTabChange = useCallback((event, newValue) => {
    setTabValue(newValue);
    const tabNames = ['Dashboard', 'User Management', 'System Config', 'Analytics'];
    toast(`Switched to ${tabNames[newValue]}`, { duration: 1000 });
  }, []);

  const handleRefresh = useCallback(() => {
    refetchRequests();
    queryClient.invalidateQueries(['admin-stats', requests]);
    toast.success('Data refreshed!');
  }, [refetchRequests, queryClient, requests]);

  // Loading state
  if (requestsLoading || statsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  // Error state
  if (requestsError) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }
      >
        Failed to load admin data. Please try again.
      </Alert>
    );
  }

  return (
    <Container fluid className="px-4">
      {/* Accessibility: Screen reader announcements */}
      <div 
        id="search-results-announcement" 
        aria-live="polite" 
        aria-atomic="true"
        style={{ 
          position: 'absolute', 
          left: '-100vw',
          width: '0.1rem',
          height: '0.1rem',
          overflow: 'hidden'
        }}
      />
      
      {/* Dashboard Header */}
      <Row className="mb-4">
        <Col xs={12}>
          <Box sx={{ pt: 2 }}>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                color: (theme) => theme.palette.mode === 'light' ? '#030048' : 'text.primary',
                mb: 1,
              }}
            >
              Global Naming HQ
            </Typography>
          </Box>
        </Col>
      </Row>
      
      {/* System Stats Cards */}
      <Row className="mb-3 g-3">
        <Col xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.totalRequests || requests.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Total Requests
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <AssignmentIcon sx={{ color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.activeUsers || '24'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Active Users
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <PeopleIcon sx={{ color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {requests.filter(r => ['submitted', 'brand_review', 'legal_review'].includes(r.status)).length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Pending Reviews
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <ScheduleIcon sx={{ color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.systemHealth || '99%'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    System Health
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <TrendingUpIcon sx={{ color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin dashboard tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Badge badgeContent={requests.length} color="primary">
                Request Management
              </Badge>
            }
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab label="Analytics" id="tab-1" aria-controls="tabpanel-1" />
          <Tab label="Form Configuration" id="tab-2" aria-controls="tabpanel-2" />
        </Tabs>

        <CardContent>
          {tabValue === 0 && (
            <>
              {/* Filters and Search */}
              <Row>
                <Col xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search requests..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    aria-label="Search requests"
                  />
                </Col>
                <Col xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status Filter"
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="submitted">Submitted</MenuItem>
                      <MenuItem value="brand_review">Brand Review</MenuItem>
                      <MenuItem value="legal_review">Legal Review</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="on_hold">On Hold</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Col>
                <Col xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    {table.getFilteredRowModel().rows.length} of {filteredData.length} requests
                  </Typography>
                </Col>
              </Row>

              {/* Table */}
              <TableContainer component={Paper}>
                <Table stickyHeader aria-label="admin requests table">
                  <TableHead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableCell key={header.id} sx={{ fontWeight: 600 }}>
                            {header.isPlaceholder ? null : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableHead>
                  <TableBody>
                    {table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} hover>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={table.getPageCount()}
                  page={table.getState().pagination.pageIndex + 1}
                  onChange={(event, page) => table.setPageIndex(page - 1)}
                  color="primary"
                  showFirstButton
                  showLastButton
                  aria-label="Table pagination"
                />
              </Box>
            </>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Analytics Dashboard</Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced analytics and reporting features will be displayed here.
              </Typography>
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Form Configuration Management</Typography>
              <FormConfigManager />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="admin-request-details-title"
      >
        <DialogTitle id="admin-request-details-title">
          {selectedRequest ? extractRequestTitle(selectedRequest, formConfig) : 'Request Details'}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              {/* Status Progression */}
              <Typography variant="h6" sx={{ mb: 2 }}>Status Progression</Typography>
              <Stepper activeStep={getStatusSteps().findIndex(step => step.status === selectedRequest.status)} orientation="vertical">
                {getStatusSteps().map((step, index) => (
                  <Step key={step.status}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: index <= getStatusSteps().findIndex(s => s.status === selectedRequest.status)
                              ? getStatusColor(step.status)
                              : theme.palette.grey[300],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          {step.icon}
                        </Box>
                      )}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>

              <Divider sx={{ my: 3 }} />

              {/* Dynamic Request Data */}
              <Typography variant="h6" sx={{ mb: 2 }}>Request Details</Typography>
              {renderDynamicRequestData(selectedRequest)}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              updateStatusMutation.mutate({ 
                requestId: selectedRequest.id, 
                status: 'approved',
                comments: 'Approved by admin'
              });
              setDetailsModalOpen(false);
            }}
            disabled={updateStatusMutation.isLoading}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
});

ProfessionalAdminDashboard.displayName = 'ProfessionalAdminDashboard';

export default ProfessionalAdminDashboard;
