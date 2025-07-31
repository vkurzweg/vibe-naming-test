import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchReviewRequests } from './reviewSlice';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-review', label: 'In Review' },
  { value: 'needs-info', label: 'Needs Info' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusColors = {
  pending: 'default',
  'in-review': 'info',
  'needs-info': 'warning',
  approved: 'success',
  rejected: 'error',
};

const ReviewRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { requests, loading, error, pagination } = useSelector(
    (state) => state.review
  );
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  useEffect(() => {
    dispatch(fetchReviewRequests({ 
      status: statusFilter || undefined,
      page: page + 1,
      pageSize: rowsPerPage,
    }));
  }, [dispatch, statusFilter, page, rowsPerPage]);

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    dispatch(fetchReviewRequests({ 
      status: statusFilter || undefined,
      page: page + 1,
      pageSize: rowsPerPage,
    }));
  };

  const handleViewRequest = (requestId) => {
    navigate(`/requests/${requestId}`);
  };

  const handleEditRequest = (requestId, e) => {
    e.stopPropagation();
    navigate(`/requests/${requestId}/edit`);
  };

  if (loading && !requests.length) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Requests for Review</Typography>
        <Box>
          <TextField
            select
            label="Status Filter"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            size="small"
            sx={{ minWidth: 150, mr: 2 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Request ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Requester</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow 
                key={request._id} 
                hover 
                onClick={() => handleViewRequest(request._id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{request.requestId || 'N/A'}</TableCell>
                <TableCell>{request.title || 'Untitled Request'}</TableCell>
                <TableCell>{request.requester?.name || 'Unknown'}</TableCell>
                <TableCell>
                  <Chip 
                    label={request.status} 
                    color={statusColors[request.status] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(request.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRequest(request._id);
                      }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleEditRequest(request._id, e)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={pagination?.total || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default ReviewRequests;
