import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
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
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
  Alert,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TableSortLabel,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepIcon,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Skeleton,
  Stack,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  Cancel as CancelIcon,
  PauseCircle as PauseCircleIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
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
import { 
  fetchReviewRequests, 
  fetchUserRequests,
  updateRequestStatus,
  claimRequest,
  unclaimRequest
} from '../../features/review/reviewSlice';
import { showSnackbar } from '../../features/ui/uiSlice';
import { Container, Row, Col } from 'react-bootstrap';

const ProfessionalReviewerDashboard = React.memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Fetch review queue requests (all requests, filtered client-side for reviewer)
  const { data: allRequests = [], isLoading: requestsLoading, error: requestsError, refetch: refetchRequests } = useQuery({
    queryKey: ['reviewer-requests'],
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

  // Get user's own requests for "My Reviews" section
  const { data: myRequests = [], isLoading: myRequestsLoading, error: myRequestsError, refetch: refetchMyRequests } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const response = await api.get('/api/name-requests/my-requests');

      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30000,
    cacheTime: 300000,
    retry: 2,
  });

  // React Query mutations for request management
  const claimRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      const response = await api.post(`/api/name-requests/${requestId}/claim`);
      return response.data;
    },
    onMutate: async (requestId) => {
      await queryClient.cancelQueries(['reviewer-requests']);
      const previousRequests = queryClient.getQueryData(['reviewer-requests']);
      
      queryClient.setQueryData(['reviewer-requests'], (old = []) =>
        old.map(request =>
          request.id === requestId
            ? { ...request, assignedTo: user?.id, status: 'in_review' }
            : request
        )
      );
      
      return { previousRequests };
    },
    onError: (err, requestId, context) => {
      queryClient.setQueryData(['reviewer-requests'], context.previousRequests);
      toast.error('Failed to claim request. Please try again.');
    },
    onSuccess: () => {
      toast.success('Request claimed successfully!');
      queryClient.invalidateQueries(['reviewer-requests']);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, comments }) => {
      const response = await api.put(`/api/name-requests/${requestId}/status`, { status, comments });
      return response.data;
    },
    onMutate: async ({ requestId, status }) => {
      await queryClient.cancelQueries(['reviewer-requests']);
      const previousRequests = queryClient.getQueryData(['reviewer-requests']);
      
      queryClient.setQueryData(['reviewer-requests'], (old = []) =>
        old.map(request =>
          request.id === requestId
            ? { ...request, status, updatedAt: new Date().toISOString() }
            : request
        )
      );
      
      return { previousRequests };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['reviewer-requests'], context.previousRequests);
      toast.error('Failed to update status. Please try again.');
    },
    onSuccess: () => {
      toast.success('Status updated successfully!');
      queryClient.invalidateQueries(['reviewer-requests']);
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
  const columns = useMemo(() => [
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
          {!row.original.assignedTo && (
            <Tooltip title="Claim Request">
              <IconButton
                size="small"
                onClick={() => claimRequestMutation.mutate(row.original.id)}
                disabled={claimRequestMutation.isLoading}
                aria-label={`Claim ${extractRequestTitle(row.original, formConfig)}`}
              >
                <PersonIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
      size: 120,
      enableSorting: false,
    },
  ], [formConfig, theme, claimRequestMutation]);

  // Filtered data for table
  const filteredData = useMemo(() => {
    let data = tabValue === 0 ? allRequests : myRequests;
    
    if (statusFilter !== 'all') {
      data = data.filter(request => request.status === statusFilter);
    }
    
    return data;
  }, [allRequests, myRequests, tabValue, statusFilter]);

  // TanStack Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
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
    // Announce tab change for screen readers
    const tabName = newValue === 0 ? 'Review Queue' : 'My Requests';
    toast(`Switched to ${tabName}`, { duration: 1000 });
  }, []);

  const handleRefresh = useCallback(() => {
    refetchRequests();
    refetchMyRequests();
    toast.success('Data refreshed!');
  }, [refetchRequests, refetchMyRequests]);

  // Loading state
  if (requestsLoading || myRequestsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  // Error state
  if (requestsError || myRequestsError) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }
      >
        Failed to load data. Please try again.
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
              Reviewer Dashboard
            </Typography>
          </Box>
        </Col>
      </Row>
      
      <Row className="mb-3">
        <Col xs={12}>
          <Box sx={{ width: '100%' }}>
            {/* Header */}
            <Box sx={{ mb: 4, pt: 2 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 1,
                }}
              >
                Naming HQ
              </Typography>
            </Box>

            {/* Tabs */}
            <Card sx={{ mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="reviewer dashboard tabs"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab 
                  label={
                    <Badge badgeContent={allRequests.length} color="primary">
                      Review Queue
                    </Badge>
                  }
                  id="tab-0"
                  aria-controls="tabpanel-0"
                />
                <Tab 
                  label={
                    <Badge badgeContent={myRequests.length} color="secondary">
                      My Requests
                    </Badge>
                  }
                  id="tab-1"
                  aria-controls="tabpanel-1"
                />
              </Tabs>

              {/* Filters and Search */}
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
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
                  </Grid>
                  <Grid item xs={12} md={3}>
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
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      {table.getFilteredRowModel().rows.length} of {filteredData.length} requests
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <TableContainer>
                <Table stickyHeader aria-label="requests table">
                  <TableHead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableCell
                            key={header.id}
                            sortDirection={
                              header.column.getIsSorted() === 'asc' ? 'asc' :
                              header.column.getIsSorted() === 'desc' ? 'desc' : false
                            }
                            sx={{ fontWeight: 600 }}
                          >
                            {header.isPlaceholder ? null : (
                              <TableSortLabel
                                active={!!header.column.getIsSorted()}
                                direction={header.column.getIsSorted() || 'asc'}
                                onClick={header.column.getToggleSortingHandler()}
                                disabled={!header.column.getCanSort()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </TableSortLabel>
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
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
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
            </Card>

            {/* Request Details Modal */}
            <Dialog
              open={detailsModalOpen}
              onClose={() => setDetailsModalOpen(false)}
              maxWidth="md"
              fullWidth
              aria-labelledby="request-details-title"
            >
              <DialogTitle id="request-details-title">
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
                {selectedRequest && !selectedRequest.assignedTo && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      claimRequestMutation.mutate(selectedRequest.id);
                      setDetailsModalOpen(false);
                    }}
                    disabled={claimRequestMutation.isLoading}
                  >
                    Claim Request
                  </Button>
                )}
              </DialogActions>
            </Dialog>
          </Box>
        </Col>
      </Row>
    </Container>
  );
});

ProfessionalReviewerDashboard.displayName = 'ProfessionalReviewerDashboard';

export default ProfessionalReviewerDashboard;
