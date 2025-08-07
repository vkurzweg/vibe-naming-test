import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { getStatusColor } from '../../theme/newColorPalette';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel,
  flexRender 
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import DynamicFormRenderer from '../../components/DynamicForm/DynamicFormRenderer';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  TableSortLabel,
  Button,
  Avatar,
  InputAdornment,
  Pagination,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  Assignment as AssignmentIcon,
  Gavel as GavelIcon,
  BrandingWatermark as BrandingIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Business as BusinessIcon,
  Archive as ArchiveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import {
  extractRequestTitle,
  extractRequestDate,
  extractRequestStatus,
  extractSubmitterInfo,
} from '../../utils/dynamicDataUtils';
import { Container } from 'react-bootstrap';

// Custom styled button component to ensure theme colors are applied
import { styled } from '@mui/material/styles';
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

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const ProfessionalReviewerDashboard = React.memo(() => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user } = useSelector((state) => state.auth);
  const { formConfig } = useSelector((state) => state.formConfig || {});
  
  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchNamesFilter, setSearchNamesFilter] = useState('');
  const [searchNamesPage, setSearchNamesPage] = useState(1);
  const [sorting, setSorting] = useState([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [archivePage, setArchivePage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');

  // Fetch review queue (all pending requests)
  const { data: reviewQueue = [], isLoading: reviewQueueLoading, error: reviewQueueError } = useQuery({
    queryKey: ['reviewer-queue'],
    queryFn: async () => {
      console.log('Fetching review queue data...');
      try {
        const response = await axios.get('/api/v1/name-requests');
        console.log('Review queue response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching review queue:', error);
        throw error;
      }
    },
    staleTime: 300000, // 5 minutes
    retry: 1,
    onError: (err) => {
      console.error('Review queue fetch error:', err);
      toast.error('Failed to load review queue. Please try again.');
    }
  });

  // Search Names data (approved names)
  const searchNamesData = useMemo(() => {
    // Only show approved names in the Search Names tab
    return reviewQueue.filter(request => request.status === 'approved')
      // Sort by most recently approved (updatedAt date)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB - dateA; // Most recent first
      });
  }, [reviewQueue]);

  // Filtered search names data
  const filteredSearchNamesData = useMemo(() => {
    let data = searchNamesData;
    
    // Apply global filter (search)
    if (globalFilter) {
      data = data.filter(request => {
        const title = extractRequestTitle(request, formConfig).toLowerCase();
        const searchTerm = globalFilter.toLowerCase();
        return title.includes(searchTerm);
      });
    }
    
    return data.slice((archivePage - 1) * 10, archivePage * 10);
  }, [searchNamesData, globalFilter, archivePage, formConfig]);

  // Fetch my claimed requests (filter client-side for reviewer)
  const { data: myRequests = [], isLoading: myRequestsLoading, error: myRequestsError } = useQuery({
    queryKey: ['reviewer-my-requests'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/name-requests');
      console.log('My Requests API Response:', response);
      console.log('My Requests Raw Data:', response.data);
      const filteredData = response.data.filter(request => {
        console.log('My Request being filtered:', request);
        console.log('AssignedTo check for My Requests:', request.assignedTo, user.id, request.assignedTo === user.id);
        return request.assignedTo === user.id;
      });
      console.log('Filtered My Requests Data:', filteredData);
      return filteredData;
    },
    staleTime: 300000, // 5 minutes
    retry: 1,
    onError: (err) => {
      console.error('My Requests Error:', err);
      toast.error(`Failed to fetch your claimed requests: ${err.message}`);
    }
  });

  // React Query mutations for request management
  const claimRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      if (!requestId) {
        throw new Error('Request ID is undefined');
      }
      const response = await axios.post(`/api/v1/name-requests/${requestId}/claim`);
      return response.data;
    },
    onMutate: async (requestId) => {
      if (!requestId) {
        throw new Error('Request ID is undefined');
      }
      await queryClient.cancelQueries(['reviewer-queue']);
      const previousQueue = queryClient.getQueryData(['reviewer-queue']);
      
      queryClient.setQueryData(['reviewer-queue'], (old = []) =>
        old.filter(request => request.id !== requestId)
      );
      
      return { previousQueue };
    },
    onError: (err, requestId, context) => {
      queryClient.setQueryData(['reviewer-queue'], context.previousQueue);
      toast.error(`Failed to claim request: ${err.message}`);
    },
    onSuccess: () => {
      toast.success('Request claimed successfully!');
      queryClient.invalidateQueries(['reviewer-requests']);
      queryClient.invalidateQueries(['reviewer-queue']);
      queryClient.invalidateQueries(['reviewer-my-requests']);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, comments }) => {
      if (!requestId) {
        throw new Error('Request ID is undefined');
      }
      const response = await axios.put(`/api/v1/name-requests/${requestId}/status`, { status, comments });
      return response.data;
    },
    onMutate: async ({ requestId, status }) => {
      if (!requestId) {
        throw new Error('Request ID is undefined');
      }
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
      toast.error(`Failed to update status: ${err.message}`);
    },
    onSuccess: () => {
      toast.success('Status updated successfully!');
      queryClient.invalidateQueries(['reviewer-requests']);
      queryClient.invalidateQueries(['reviewer-queue']);
      queryClient.invalidateQueries(['reviewer-my-requests']);
    },
  });

  // Get status color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return theme.palette.info.main;
      case 'brand_review':
        return theme.palette.primary.main;
      case 'legal_review':
        return theme.palette.secondary.main;
      case 'on_hold':
        return theme.palette.warning.main;
      case 'cancelled':
        return theme.palette.error.main;
      case 'approved':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Get status steps for stepper
  const getStatusSteps = () => [
    {
      status: 'submitted',
      label: 'Submitted',
      description: 'Request has been submitted and is awaiting review.',
      icon: <AssignmentIcon fontSize="small" />
    },
    {
      status: 'brand_review',
      label: 'Brand Review',
      description: 'Request is being reviewed by the brand team.',
      icon: <BrandingIcon fontSize="small" />
    },
    {
      status: 'legal_review',
      label: 'Legal Review',
      description: 'Request is being reviewed by the legal team.',
      icon: <GavelIcon fontSize="small" />
    },
    {
      status: 'approved',
      label: 'Approved',
      description: 'Request has been approved.',
      icon: <CheckCircleIcon fontSize="small" />
    }
  ];

  // Render dynamic request data based on form configuration
  const renderDynamicRequestData = (request) => {
    if (!formConfig || !formConfig.fields) {
      return (
        <Alert severity="warning">
          <AlertTitle>Form configuration not available</AlertTitle>
          Unable to display request details. Please try refreshing the page.
        </Alert>
      );
    }

    return (
      <Grid container spacing={2}>
        {formConfig.fields.map((field) => {
          const value = request.formData?.[field.name] || request[field.name];
          if (value === undefined || value === null) return null;
          
          return (
            <Grid item xs={12} sm={6} key={field.name}>
              <Paper sx={{ p: 1.5, height: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {field.label || field.name}
                </Typography>
                <Typography variant="body1">
                  {renderFieldValue(value)}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

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
              onClick={() => handleToggleExpand(row.original.id)}
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
    let data = reviewQueue || [];
    
    if (filterStatus !== 'all') {
      data = data.filter(request => request.status === filterStatus);
    }
    
    return data;
  }, [reviewQueue, filterStatus]);

  // Helper functions for sorting
  const sortByNewest = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  const sortByOldest = (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  const sortByUpdated = (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  const sortByReviewer = (a, b) => {
    const reviewerA = a.assignedTo || '';
    const reviewerB = b.assignedTo || '';
    return reviewerA.localeCompare(reviewerB);
  };
  const sortByStatus = (a, b) => (a.status || '').localeCompare(b.status || '');

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!filteredData) return [];
    
    return [...filteredData].sort((a, b) => {
      switch (sortBy) {
        case 'newest': return sortByNewest(a, b);
        case 'oldest': return sortByOldest(a, b);
        case 'updated': return sortByUpdated(a, b);
        case 'reviewer': return sortByReviewer(a, b);
        case 'status': return sortByStatus(a, b);
        default: return 0;
      }
    });
  }, [filteredData, sortBy]);

  // Pagination logic for table
  const paginatedData = useMemo(() => {
    const startIndex = pagination.pageIndex * pagination.pageSize;
    return sortedData.slice(startIndex, startIndex + pagination.pageSize);
  }, [sortedData, pagination]);

  // TanStack Table instance
  const table = useReactTable({
    data: paginatedData,
    columns: columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Event handlers
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleToggleExpand = useCallback((requestId) => {
    setExpanded((prevExpanded) => {
      const newExpanded = { ...prevExpanded };
      if (newExpanded[requestId]) {
        delete newExpanded[requestId];
      } else {
        newExpanded[requestId] = true;
      }
      return newExpanded;
    });
  }, []);

  const handleSortByChange = useCallback((event) => {
    setSortBy(event.target.value);
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries(['reviewer-queue']);
    queryClient.invalidateQueries(['reviewer-my-requests']);
    toast.success('Data refreshed!');
  }, [queryClient]);

  const handleViewRequestDetails = useCallback((requestId) => {
    const request = reviewQueue.find(request => request.id === requestId);
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  }, [reviewQueue]);

  const handleCloseDetailsDialog = useCallback(() => {
    setDetailsDialogOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleUpdateStatus = useCallback(() => {
    if (!selectedRequest || !selectedRequest.id) {
      toast.error('Cannot update status: No request selected or invalid request ID');
      return;
    }
    
    updateStatusMutation.mutate({
      requestId: selectedRequest.id,
      status: 'approved',
      comments: '',
    });
    setDetailsDialogOpen(false);
    setSelectedRequest(null);
  }, [selectedRequest, updateStatusMutation]);

  // Render loading state
  const renderLoading = useCallback(() => (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', minHeight: 200 }}>
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Loading data...
      </Typography>
    </Box>
  ), []);

  // Render error state
  const renderError = useCallback((error) => (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error?.message || 'An error occurred while fetching data. Please try again.'}
      </Alert>
    </Box>
  ), []);

  // Archive data
  const archiveData = useMemo(() => {
    return reviewQueue.filter(request => ['approved', 'rejected'].includes(request.status));
  }, [reviewQueue]);

  // Filtered archive data
  const filteredArchiveData = useMemo(() => {
    let data = archiveData;
    
    if (filterStatus !== 'all') {
      data = data.filter(request => request.status === filterStatus);
    }
    
    if (globalFilter) {
      data = data.filter(request => extractRequestTitle(request, formConfig).toLowerCase().includes(globalFilter.toLowerCase()));
    }
    
    return data.slice((archivePage - 1) * 10, archivePage * 10);
  }, [archiveData, filterStatus, globalFilter, archivePage]);

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
            onChange={handleTabChange}
            aria-label="reviewer dashboard tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            TabIndicatorProps={{
              style: {
                backgroundColor: theme.palette.primary.main,
              }
            }}
          >
            <Tab 
              icon={<BusinessIcon />} 
              label="Review Queue" 
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <Tab 
              icon={<ArchiveIcon />} 
              label="Approved Names" 
              id="tab-1"
              aria-controls="tabpanel-1"
            />
            <Tab 
              icon={<AssignmentIcon />} 
              label="New Request" 
              id="tab-2"
              aria-controls="tabpanel-2"
            />
          </Tabs>
        </Box>
        
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: '1.5rem' }}>
            {/* Filter and sort controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              {/* Search input */}
              <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
                <TextField
                  size="small"
                  placeholder="Search requests..."
                  value={globalFilter || ''}
                  onChange={e => setGlobalFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    sx: { height: '2.5rem' }
                  }}
                  sx={{ width: { xs: '100%', sm: '20rem' } }}
                />
              </Box>
              
              {/* Advanced sorting options */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: '10rem' }}>
                  <InputLabel id="sort-by-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-by-label"
                    id="sort-by"
                    value={sortBy}
                    label="Sort By"
                    onChange={handleSortByChange}
                    sx={{ height: '2.5rem' }}
                  >
                    <MenuItem value="newest">Newest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                    <MenuItem value="updated">Recently Updated</MenuItem>
                    <MenuItem value="reviewer">Reviewer Name</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  sx={{ height: '2.5rem' }}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
            
            {reviewQueueError && renderError(reviewQueueError)}
            
            {reviewQueueLoading ? renderLoading() : (
              <Card>
                <TableContainer>
                  <Table stickyHeader aria-label="requests table">
                    <TableHead>
                      {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <TableCell
                              key={header.id}
                              width={header.getSize()}
                              onClick={header.column.getToggleSortingHandler()}
                              sx={{
                                fontWeight: 600,
                                cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                backgroundColor: theme.palette.mode === 'light' 
                                  ? alpha(theme.palette.primary.main, 0.05) 
                                  : alpha(theme.palette.primary.dark, 0.2),
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: header.column.getCanSort() ? 'space-between' : 'flex-start',
                                }}
                              >
                                {header.isPlaceholder ? null : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {header.column.getCanSort() && (
                                  <TableSortLabel
                                    active={!!header.column.getIsSorted()}
                                    direction={header.column.getIsSorted() || 'asc'}
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableHead>
                    <TableBody>
                      {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map(row => (
                          <React.Fragment key={row.id}>
                            <TableRow
                              key={row.id}
                              hover
                              sx={{
                                '&:last-child td, &:last-child th': { border: 0 },
                                cursor: 'pointer',
                                backgroundColor: row.getIsSelected() ? alpha(theme.palette.primary.main, 0.1) : 'inherit',
                              }}
                              onClick={() => handleToggleExpand(row.original.id)}
                            >
                              {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                            {expanded[row.original.id] && (
                              <TableRow>
                                <TableCell colSpan={table.getAllColumns().length} sx={{ p: 0 }}>
                                  <Box sx={{ p: 2 }}>
                                    {/* Status Progression */}
                                    <Typography variant="h6" sx={{ mb: 1 }}>Status Progression</Typography>
                                    <Stepper activeStep={getStatusSteps().findIndex(step => step.status === row.original.status)} orientation="vertical">
                                      {getStatusSteps().map((step, index) => (
                                        <Step key={step.status}>
                                          <StepLabel
                                            StepIconComponent={() => (
                                              <Box
                                                sx={{
                                                  width: '1.5rem',
                                                  height: '1.5rem',
                                                  borderRadius: '50%',
                                                  backgroundColor: index <= getStatusSteps().findIndex(s => s.status === row.original.status)
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

                                    <Divider sx={{ my: 2 }} />

                                    {/* Status Update Controls */}
                                    <Typography variant="h6" sx={{ mb: 1 }}>Update Status</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', mb: 2 }}>
                                      <Button 
                                        variant="outlined" 
                                        size="small"
                                        sx={{ fontSize: '0.875rem', height: '2rem' }}
                                        onClick={() => updateStatusMutation.mutate({ 
                                          requestId: row.original.id, 
                                          status: 'brand_review',
                                          comments: 'Moved to brand review'
                                        })}
                                        disabled={row.original.status === 'brand_review' || updateStatusMutation.isLoading}
                                      >
                                        Brand Review
                                      </Button>
                                      <Button 
                                        variant="outlined" 
                                        size="small"
                                        sx={{ fontSize: '0.875rem', height: '2rem' }}
                                        onClick={() => updateStatusMutation.mutate({ 
                                          requestId: row.original.id, 
                                          status: 'legal_review',
                                          comments: 'Moved to legal review'
                                        })}
                                        disabled={row.original.status === 'legal_review' || updateStatusMutation.isLoading}
                                      >
                                        Legal Review
                                      </Button>
                                      <Button 
                                        variant="outlined" 
                                        size="small"
                                        color="warning"
                                        sx={{ fontSize: '0.875rem', height: '2rem' }}
                                        onClick={() => updateStatusMutation.mutate({ 
                                          requestId: row.original.id, 
                                          status: 'on_hold',
                                          comments: 'Request placed on hold'
                                        })}
                                        disabled={row.original.status === 'on_hold' || updateStatusMutation.isLoading}
                                      >
                                        On Hold
                                      </Button>
                                      <Button 
                                        variant="outlined" 
                                        size="small"
                                        color="error"
                                        sx={{ fontSize: '0.875rem', height: '2rem' }}
                                        onClick={() => updateStatusMutation.mutate({ 
                                          requestId: row.original.id, 
                                          status: 'cancelled',
                                          comments: 'Request cancelled'
                                        })}
                                        disabled={row.original.status === 'cancelled' || updateStatusMutation.isLoading}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        variant="outlined" 
                                        size="small"
                                        color="success"
                                        sx={{ fontSize: '0.875rem', height: '2rem' }}
                                        onClick={() => updateStatusMutation.mutate({ 
                                          requestId: row.original.id, 
                                          status: 'approved',
                                          comments: 'Request approved'
                                        })}
                                        disabled={row.original.status === 'approved' || updateStatusMutation.isLoading}
                                      >
                                        Approve
                                      </Button>
                                    </Box>

                                    {/* Claim Request Button */}
                                    {!row.original.assignedTo && (
                                      <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        sx={{ mb: 2, fontSize: '0.875rem', height: '2rem' }}
                                        onClick={() => claimRequestMutation.mutate(row.original.id)}
                                        disabled={claimRequestMutation.isLoading}
                                      >
                                        Claim Request
                                      </Button>
                                    )}

                                    <Divider sx={{ my: 2 }} />

                                    {/* Dynamic Request Data */}
                                    <Typography variant="h6" sx={{ mb: 1 }}>Request Details</Typography>
                                    {renderDynamicRequestData(row.original)}
                                    
                                    {/* Action Buttons */}
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                      <Button 
                                        variant="outlined" 
                                        sx={{ fontSize: '0.875rem', height: '2rem' }}
                                        onClick={() => handleToggleExpand(row.original.id)}
                                      >
                                        Close
                                      </Button>
                                    </Box>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="body1">No requests found</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination Controls */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {table.getRowModel().rows.length} of {filteredData.length} requests
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <StyledButton
                      variant="outlined"
                      size="small"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </StyledButton>
                    <StyledButton
                      variant="outlined"
                      size="small"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                    </StyledButton>
                  </Box>
                </Box>
              </Card>
            )}
          </Box>
        </TabPanel>
        
        {/* Approved Names Tab Panel */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: '1.5rem' }}>
            {/* Filters and Search */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search archive..."
                  value={globalFilter || ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  aria-label="Search archive"
                  size="small"
                  sx={{ mb: { xs: 2, md: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="archive-status-filter-label">Status Filter</InputLabel>
                  <Select
                    labelId="archive-status-filter-label"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status Filter"
                  >
                    <MenuItem value="all">All Archived</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {filteredSearchNamesData.length} approved names
                </Typography>
              </Grid>
            </Grid>
            
            {reviewQueueError && renderError(reviewQueueError)}
            
            {reviewQueueLoading ? renderLoading() : (
              <Box>
                {filteredSearchNamesData.length === 0 ? (
                  <Alert severity="info">
                    No approved names found.
                  </Alert>
                ) : (
                  <Card>
                    <TableContainer>
                      <Table stickyHeader aria-label="archive table">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Request</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Reviewer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Completed Date</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredSearchNamesData.map(request => (
                            <TableRow 
                              key={request.id}
                              hover
                              sx={{ 
                                '&:last-child td, &:last-child th': { border: 0 },
                                cursor: 'pointer',
                              }}
                              onClick={() => handleViewRequestDetails(request.id)}
                            >
                              <TableCell>{extractRequestTitle(request, formConfig)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={request.status}
                                  color={
                                    request.status === 'approved' ? 'success' : 
                                    request.status === 'rejected' ? 'error' : 
                                    'default'
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{request.assignedTo || 'Unassigned'}</TableCell>
                              <TableCell>{request.updatedAt ? new Date(request.updatedAt).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewRequestDetails(request.id);
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {/* Pagination Controls */}
                    {searchNamesData.length > 10 && (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          Showing {((archivePage - 1) * 10) + 1}-{Math.min(archivePage * 10, searchNamesData.length)} of {searchNamesData.length} approved names
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Pagination
                            count={Math.ceil(searchNamesData.length / 10)}
                            page={archivePage}
                            onChange={(event, page) => setArchivePage(page)}
                            color="primary"
                            showFirstButton
                            showLastButton
                            size="small"
                            aria-label="Search names pagination"
                          />
                        </Box>
                      </Box>
                    )}
                  </Card>
                )}
              </Box>
            )}
          </Box>
        </TabPanel>
        
        {/* New Request Tab Panel */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: '1.5rem' }}>
            <DynamicFormRenderer formConfig={formConfig} />
          </Box>
        </TabPanel>
        
        {/* Request Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={handleCloseDetailsDialog}
          fullWidth
          maxWidth="md"
          aria-labelledby="request-details-title"
        >
          <DialogTitle id="request-details-title">
            {selectedRequest ? extractRequestTitle(selectedRequest, formConfig) : 'Request Details'}
          </DialogTitle>
          <DialogContent>
            {selectedRequest ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Request Details
                    </Typography>
                    <Divider sx={{ mb: 2, mt: 0.5 }} />
                    {formConfig && formConfig.fields && formConfig.fields.map(field => {
                      const value = selectedRequest.formData?.[field.name] || selectedRequest[field.name];
                      if (!value) return null;
                      return (
                        <Box key={field.name} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">{field.label || field.name}</Typography>
                          <Typography variant="body2">
                            {renderFieldValue(value)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Update Status
                    </Typography>
                    <Divider sx={{ mb: 2, mt: 0.5 }} />
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value="approved"
                        label="Status"
                      >
                        <MenuItem value="approved">Approved</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Status History
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {selectedRequest.statusHistory && selectedRequest.statusHistory.length > 0 ? (
                      selectedRequest.statusHistory.map((status, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {status.status}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {status.timestamp ? new Date(status.timestamp).toLocaleString() : 'N/A'}
                          </Typography>
                          {status.comments && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {status.comments}
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2">No status history available.</Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <StyledButton onClick={handleCloseDetailsDialog}>Cancel</StyledButton>
            <StyledButton 
              variant="contained"
              color="primary"
              onClick={handleUpdateStatus}
            >
              Approve
            </StyledButton>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
});

ProfessionalReviewerDashboard.displayName = 'ProfessionalReviewerDashboard';

export default ProfessionalReviewerDashboard;