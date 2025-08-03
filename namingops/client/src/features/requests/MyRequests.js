import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  CircularProgress, 
  Container, 
  Divider, 
  FormControl, 
  Grid, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TablePagination, 
  TableRow, 
  TableSortLabel, 
  TextField, 
  Typography,
  IconButton,
  Tooltip,
  Stack,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  FilterAlt as FilterIcon, 
  FilterAltOff as ClearFiltersIcon,
  FileDownload as ExportIcon,
  Description as DescriptionIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isAfter, isBefore, subDays } from 'date-fns';
import { 
  getMyRequests, 
  searchRequests, 
  selectFilteredRequests,
  selectIsLoading,
  selectError,
  selectSearchQuery,
  selectFilters,
  selectSortConfig,
  setSearchQuery, 
  setFilter, 
  setSort, 
  resetFilters,
  exportToCSV,
  exportToPDF
} from './requestsSlice';

const statusColors = {
  'pending': 'warning',
  'approved': 'success',
  'rejected': 'error',
  'in_review': 'info',
  'draft': 'default'
};

const MyRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Select data from Redux store
  const requests = useSelector(selectFilteredRequests);
  const loading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const searchQuery = useSelector(selectSearchQuery);
  const filters = useSelector(selectFilters);
  const sortConfig = useSelector(selectSortConfig);
  
  // Local state for pagination and UI
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch requests when filters, sort, or pagination changes
  useEffect(() => {
    dispatch(getMyRequests());
  }, [dispatch]);

  // Handle search input change
  const handleSearchChange = (event) => {
    dispatch(setSearchQuery(event.target.value));
    setPage(0); // Reset to first page on new search
  };

  // Handle filter changes
  const handleStatusFilter = (event) => {
    dispatch(setFilter({ key: 'status', value: event.target.value || undefined }));
    setPage(0);
  };

  const handleDateFilter = (date, type) => {
    const newDateRange = { ...(filters.dateRange || {}), [type]: date };
    dispatch(setFilter({ key: 'dateRange', value: newDateRange }));
    setPage(0);
  };

  // Handle sort request
  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'ascending';
    dispatch(setSort({ 
      key, 
      direction: isAsc ? 'descending' : 'ascending' 
    }));
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle export
  const handleExportCSV = () => {
    const csvContent = exportToCSV(requests);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `name-requests-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = exportToPDF(requests, 'My Name Requests');
    doc.save(`name-requests-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Get current page data
  const paginatedRequests = useMemo(
    () => requests.data || [],
    [requests.data]
  );

  // Render loading state
  if (loading && !requests.data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">
          Error loading requests: {error.message || 'Unknown error occurred'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => dispatch(fetchUserRequests({ page: page + 1, limit: rowsPerPage }))}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              My Naming Requests
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/submit-request')}
            >
              New Request
            </Button>
          </Box>

          <Card elevation={2}>
            <CardContent>
              {/* Search and Filter Bar */}
              <Box mb={3}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Toggle filters">
                        <IconButton 
                          onClick={() => setShowFilters(!showFilters)}
                          color={showFilters ? 'primary' : 'default'}
                        >
                          <FilterIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Export to CSV">
                        <IconButton onClick={handleExportCSV}>
                          <DescriptionIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Export to PDF">
                        <IconButton onClick={handleExportPDF}>
                          <ExportIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="View Brand Guidelines">
                        <IconButton 
                          component="a" 
                          href="/brand-guidelines" 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Grid>
                </Grid>

                {/* Filters Panel */}
                {showFilters && (
                  <Box mt={2} p={2} bgcolor="action.hover" borderRadius={1}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={filters.status || ''}
                            onChange={handleStatusFilter}
                            label="Status"
                          >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="in_review">In Review</MenuItem>
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                            <MenuItem value="draft">Draft</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="From Date"
                            value={filters.dateRange?.start || null}
                            onChange={(date) => handleDateFilter(date, 'start')}
                            renderInput={(params) => (
                              <TextField {...params} fullWidth size="small" />
                            )}
                          />
                        </LocalizationProvider>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="To Date"
                            value={filters.dateRange?.end || null}
                            onChange={(date) => handleDateFilter(date, 'end')}
                            renderInput={(params) => (
                              <TextField {...params} fullWidth size="small" />
                            )}
                          />
                        </LocalizationProvider>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<ClearFiltersIcon />}
                          onClick={() => {
                            dispatch(resetFilters());
                            setPage(0);
                          }}
                        >
                          Clear Filters
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>

              {/* Requests Table */}
              <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortConfig.key === 'request_title'}
                          direction={sortConfig.direction}
                          onClick={() => handleSort('request_title')}
                        >
                          <Typography variant="subtitle2" fontWeight="bold">
                            Request Title
                          </Typography>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortConfig.key === 'createdAt'}
                          direction={sortConfig.direction}
                          onClick={() => handleSort('createdAt')}
                        >
                          <Typography variant="subtitle2" fontWeight="bold">
                            Date Submitted
                          </Typography>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortConfig.key === 'status'}
                          direction={sortConfig.direction}
                          onClick={() => handleSort('status')}
                        >
                          <Typography variant="subtitle2" fontWeight="bold">
                            Status
                          </Typography>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortConfig.key === 'reviewer'}
                          direction={sortConfig.direction}
                          onClick={() => handleSort('reviewer')}
                        >
                          <Typography variant="subtitle2" fontWeight="bold">
                            Reviewer
                          </Typography>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight="bold">
                          Actions
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRequests.length > 0 ? (
                      paginatedRequests.map((request) => (
                        <TableRow key={request._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {request.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {format(parseISO(request.createdAt), 'MMM dd, yyyy')}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {format(parseISO(request.createdAt), 'h:mm a')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.status?.replace('_', ' ') || 'N/A'}
                              color={statusColors[request.status] || 'default'}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {request.reviewer?.name || 'Not assigned'}
                            </Typography>
                            {request.reviewer?.email && (
                              <Typography variant="caption" color="textSecondary">
                                {request.reviewer.email}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/requests/${request._id}`)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Box textAlign="center">
                            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                              No requests found
                            </Typography>
                            <Button
                              variant="outlined"
                              color="primary"
                              startIcon={<AddIcon />}
                              onClick={() => navigate('/submit-request')}
                              sx={{ mt: 1 }}
                            >
                              Create New Request
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {requests.data?.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={requests.total || 0}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MyRequests;
