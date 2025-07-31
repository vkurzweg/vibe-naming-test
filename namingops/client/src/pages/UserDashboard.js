// client/src/pages/UserDashboard.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { fetchNamingRequests } from '../features/naming/namingSlice';

const UserDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { requests, loading, error, pagination } = useSelector((state) => state.naming);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const filters = {
      page: page + 1,
      limit: rowsPerPage,
      requestor: user?.id,
      status: statusFilter === 'all' ? '' : statusFilter,
      search: searchTerm
    };
    
    dispatch(fetchNamingRequests(filters));
  }, [dispatch, page, rowsPerPage, searchTerm, statusFilter, user?.id]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage(0);
  };

  const getStatusChip = (status) => {
    const statusMap = {
      draft: { label: 'Draft', color: 'default' },
      submitted: { label: 'Submitted', color: 'info' },
      in_review: { label: 'In Review', color: 'primary' },
      approved: { label: 'Approved', color: 'success' },
      rejected: { label: 'Rejected', color: 'error' },
      archived: { label: 'Archived', color: 'default' }
    };

    const { label, color } = statusMap[status] || { label: status, color: 'default' };

    return (
      <Chip 
        label={label} 
        color={color} 
        size="small" 
        variant="outlined" 
      />
    );
  };

  const handleViewRequest = (requestId) => {
    navigate(`/requests/${requestId}`);
  };

  const handleEditRequest = (requestId) => {
    navigate(`/requests/${requestId}/edit`);
  };

  const handleDeleteRequest = (requestId) => {
    // TODO: Implement delete request logic
  };

  // client/src/pages/UserDashboard.js (continued)

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">My Naming Requests</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/submit-request')}
        >
          New Request
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search requests..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['all', 'draft', 'submitted', 'in_review', 'approved', 'rejected'].map((status) => (
                <Chip
                  key={status}
                  label={status === 'all' ? 'All' : status.replace('_', ' ')}
                  onClick={() => handleStatusFilter(status)}
                  color={statusFilter === status ? 'primary' : 'default'}
                  variant={statusFilter === status ? 'filled' : 'outlined'}
                />
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date Created</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>{request.requestTitle}</TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell>{request.createdAt}</TableCell>
                    <TableCell>{request.dueDate || 'N/A'}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton onClick={() => navigate(`/requests/${request._id}`)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {request.status === 'draft' && (
                        <Tooltip title="Edit">
                          <IconButton 
                            onClick={() => navigate(`/edit-request/${request._id}`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination.total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Box>
  );
};

export default UserDashboard;