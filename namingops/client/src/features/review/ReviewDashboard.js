import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  MenuItem,
  Button,
  Grid,
  Typography,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  PersonAdd as ClaimIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  fetchReviewRequests,
  claimRequest,
  setFilters,
  setPagination,
  resetFilters,
  selectReviewRequests,
  selectReviewLoading,
  selectReviewError,
  selectReviewFilters,
  selectReviewPagination,
  selectReviewMetrics,
} from './reviewSlice';

// Status chip colors
const statusColors = {
  pending: 'default',
  'in-review': 'info',
  approved: 'success',
  rejected: 'error',
  completed: 'secondary',
};

const ReviewDashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const requests = useSelector(selectReviewRequests);
  const loading = useSelector(selectReviewLoading);
  const error = useSelector(selectReviewError);
  const filters = useSelector(selectReviewFilters);
  const pagination = useSelector(selectReviewPagination);
  const metrics = useSelector(selectReviewMetrics);

  // Fetch data when filters or pagination changes
  useEffect(() => {
    dispatch(fetchReviewRequests({
      ...filters,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }));
  }, [dispatch, filters, pagination.page, pagination.pageSize]);

  const handleClaimRequest = (requestId) => {
    dispatch(claimRequest(requestId));
  };

  const handleSort = (property) => {
    const isAsc = filters.sortBy === property && filters.sortOrder === 'asc';
    dispatch(setFilters({
      sortBy: property,
      sortOrder: isAsc ? 'desc' : 'asc',
    }));
  };

  const handleChangePage = (event, newPage) => {
    dispatch(setPagination({ page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event) => {
    dispatch(setPagination({
      page: 1,
      pageSize: parseInt(event.target.value, 10),
    }));
  };

  const handleFilterChange = (filterName, value) => {
    dispatch(setFilters({ [filterName]: value }));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
  };

  const renderStatusChip = (status) => (
    <Chip
      label={status}
      color={statusColors[status.toLowerCase()] || 'default'}
      size="small"
      variant="outlined"
    />
  );

  if (loading && !requests.length) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error.message || 'Failed to load review requests'}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Requests
              </Typography>
              <Typography variant="h4">{metrics.totalRequests}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Time to Approval
              </Typography>
              <Typography variant="h4">
                {metrics.avgApprovalTime ? `${metrics.avgApprovalTime} days` : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Requests This Month
              </Typography>
              <Typography variant="h4">
                {metrics.monthlyRequests?.[0]?.count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              size="small"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="Status"
              variant="outlined"
              size="small"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              InputProps={{
                startAdornment: <FilterListIcon color="action" sx={{ mr: 1 }} />,
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {Object.keys(statusColors).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Requestor Name"
              variant="outlined"
              size="small"
              value={filters.requestorName}
              onChange={(e) => handleFilterChange('requestorName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Reviewer Name"
              variant="outlined"
              size="small"
              value={filters.reviewerName}
              onChange={(e) => handleFilterChange('reviewerName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleResetFilters}
              startIcon={<RefreshIcon />}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Requests Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={filters.sortBy === 'request_title'}
                    direction={filters.sortOrder}
                    onClick={() => handleSort('request_title')}
                  >
                    Request Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>Requestor</TableCell>
                <TableCell>Proposed Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={filters.sortBy === 'request_date'}
                    direction={filters.sortOrder}
                    onClick={() => handleSort('request_date')}
                  >
                    Request Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>{request.request_title}</TableCell>
                  <TableCell>{request.requestor_name}</TableCell>
                  <TableCell>{request.proposed_name_1}</TableCell>
                  <TableCell>{renderStatusChip(request.status)}</TableCell>
                  <TableCell>{request.reviewer_name || 'Unassigned'}</TableCell>
                  <TableCell>
                    {new Date(request.request_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {!request.reviewer_name && (
                      <Tooltip title="Claim Request">
                        <IconButton
                          size="small"
                          onClick={() => handleClaimRequest(request.id)}
                          color="primary"
                        >
                          <ClaimIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.pageSize}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default ReviewDashboard;
