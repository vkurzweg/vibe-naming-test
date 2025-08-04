import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Divider,
  Avatar,
  Stack,
  Badge,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TableSortLabel,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  PendingActions as PendingActionsIcon,
} from '@mui/icons-material';
import { format, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';
import { fetchReviewRequests, claimRequest, updateRequestStatus } from '../../features/review/reviewSlice';
import { fetchUserRequests } from '../../features/requests/requestsSlice';
import { getStatusColor, getStatusIcon } from '../../theme/professionalTheme';
import { useTheme } from '@mui/material/styles';
import RequestDetailsModal from '../../components/Requests/RequestDetailsModal';
import RequestStatusUpdate from '../../components/Requests/RequestStatusUpdate';

const ProfessionalReviewerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { user } = useSelector((state) => state.auth);
  const { requests: reviewRequests, loading: reviewLoading } = useSelector((state) => state.review);
  const { requests: allRequests, loading: requestsLoading } = useSelector((state) => state.requests);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchReviewRequests());
    dispatch(fetchUserRequests({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Get all requests data
  const allRequestsData = Array.isArray(allRequests?.data) ? allRequests.data : [];
  const reviewRequestsData = Array.isArray(reviewRequests) ? reviewRequests : [];
  
  // Combine and deduplicate requests
  const combinedRequests = [...allRequestsData, ...reviewRequestsData].reduce((acc, request) => {
    if (!acc.find(r => r._id === request._id)) {
      acc.push(request);
    }
    return acc;
  }, []);

  // Filter requests based on tab, search, and status
  const getFilteredRequests = () => {
    let filtered = combinedRequests;

    // Tab filtering
    switch (tabValue) {
      case 0: // All Active
        filtered = filtered.filter(r => !['approved', 'rejected'].includes(r.status));
        break;
      case 1: // New Requests
        filtered = filtered.filter(r => r.status === 'pending' || r.status === 'new');
        break;
      case 2: // In Progress
        filtered = filtered.filter(r => r.status === 'in-progress');
        break;
      case 3: // My Assigned
        filtered = filtered.filter(r => r.assignedTo === user?.id);
        break;
      default:
        break;
    }

    // Search filtering
    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof request.description === 'string' && request.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filtering
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredRequests = getFilteredRequests();

  // Calculate comprehensive stats
  const stats = {
    total: combinedRequests.length,
    newRequests: combinedRequests.filter(r => r.status === 'pending' || r.status === 'new').length,
    inProgress: combinedRequests.filter(r => r.status === 'in-progress').length,
    myAssigned: combinedRequests.filter(r => r.assignedTo === user?.id).length,
    urgent: combinedRequests.filter(r => {
      const daysSinceCreated = differenceInDays(new Date(), new Date(r.createdAt));
      return daysSinceCreated > 7 && !['approved', 'rejected'].includes(r.status);
    }).length,
  };

  const handleViewRequest = (requestId) => {
    setSelectedRequest(combinedRequests.find(r => r._id === requestId));
    setDetailsModalOpen(true);
  };
  
  const handleUpdateStatus = (requestId) => {
    setSelectedRequest(combinedRequests.find(r => r._id === requestId));
    setStatusUpdateModalOpen(true);
  };
  
  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
  };
  
  const handleCloseStatusModal = () => {
    setStatusUpdateModalOpen(false);
  };

  const handleClaimRequest = (request) => {
    // TODO: Implement claim functionality
    console.log('Claiming request:', request._id);
  };

  const handleAssignRequest = (request) => {
    // TODO: Implement assign functionality
    console.log('Assigning request:', request._id);
  };

  const handleMenuClick = (event, request) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequest(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getUrgencyColor = (createdAt) => {
    const daysSinceCreated = differenceInDays(new Date(), new Date(createdAt));
    if (daysSinceCreated > 14) return theme.palette.error.main;
    if (daysSinceCreated > 7) return theme.palette.warning.main;
    return theme.palette.text.secondary;
  };

  const getStatusChipProps = (status) => ({
    label: status?.replace('_', ' ').toUpperCase(),
    sx: {
      backgroundColor: getStatusColor(status, theme),
      color: theme.palette.getContrastText(getStatusColor(status, theme)),
      fontWeight: 600,
      fontSize: '0.75rem',
    },
  });

  if (reviewLoading || requestsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box mb={4}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Review Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage and prioritize naming requests across the organization
        </Typography>
      </Box>

      {/* Stats Cards - Bento Grid Layout */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.newRequests}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    New Requests
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <NotificationsIcon sx={{ color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.inProgress}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    In Progress
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <PendingActionsIcon sx={{ color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.myAssigned}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    My Assigned
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <PersonIcon sx={{ color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.urgent}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Urgent
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <ScheduleIcon sx={{ color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Total Active
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <TrendingUpIcon sx={{ color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <CardContent>
          {/* Tabs for different views */}
          <Box mb={3}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab 
                label={
                  <Badge badgeContent={stats.total} color="primary" max={99}>
                    All Active
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats.newRequests} color="secondary" max={99}>
                    New Requests
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats.inProgress} color="info" max={99}>
                    In Progress
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats.myAssigned} color="primary" max={99}>
                    My Assigned
                  </Badge>
                } 
              />
            </Tabs>
          </Box>

          {/* Search and Filter Controls */}
          <Box mb={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search by title, submitter, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="createdAt">Date Created</MenuItem>
                    <MenuItem value="updatedAt">Last Updated</MenuItem>
                    <MenuItem value="title">Title</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Order"
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <MenuItem value="desc">Newest First</MenuItem>
                    <MenuItem value="asc">Oldest First</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Requests Table */}
          {filteredRequests.length === 0 ? (
            <Box textAlign="center" py={6}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No requests found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No requests match the current tab filter'
                }
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'title'}
                        direction={sortBy === 'title' ? sortOrder : 'asc'}
                        onClick={() => {
                          if (sortBy === 'title') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('title');
                            setSortOrder('asc');
                          }
                        }}
                      >
                        Request Details
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Submitter</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'status'}
                        direction={sortBy === 'status' ? sortOrder : 'asc'}
                        onClick={() => {
                          if (sortBy === 'status') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('status');
                            setSortOrder('asc');
                          }
                        }}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'createdAt'}
                        direction={sortBy === 'createdAt' ? sortOrder : 'asc'}
                        onClick={() => {
                          if (sortBy === 'createdAt') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('createdAt');
                            setSortOrder('asc');
                          }
                        }}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const urgencyColor = getUrgencyColor(request.createdAt);
                    const isUrgent = urgencyColor === theme.palette.error.main;
                    
                    return (
                      <TableRow 
                        key={request._id} 
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          ...(isUrgent && {
                            borderLeft: `4px solid ${theme.palette.error.main}`,
                          }),
                        }}
                        onClick={() => handleViewRequest(request._id)}
                      >
                        <TableCell>
                          <Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {request.title || 'Untitled Request'}
                              </Typography>
                              {isUrgent && (
                                <Chip 
                                  label="URGENT" 
                                  size="small" 
                                  color="error" 
                                  sx={{ fontSize: '0.6rem', height: 20 }}
                                />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {typeof request.description === 'object' 
                                ? request.description?.text || 'No description' 
                                : request.description || 'No description'
                              }
                            </Typography>
                            {request.formData && (
                              <Typography variant="caption" color="text.secondary">
                                {Object.keys(request.formData).length} field{Object.keys(request.formData).length !== 1 ? 's' : ''} submitted
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                              {request.user?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {request.user?.name || 'Unknown User'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.user?.email || 'No email'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip {...getStatusChipProps(request.status)} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: urgencyColor }}>
                            {formatDate(request.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {differenceInDays(new Date(), new Date(request.createdAt))} days ago
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" gap={0.5}>
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
                            <Tooltip title="More Actions">
                              <IconButton 
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuClick(e, request);
                                }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleViewRequest(selectedRequest?._id); handleMenuClose(); }}>
          <ViewIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => { handleClaimRequest(selectedRequest); handleMenuClose(); }}>
          <AssignmentIcon sx={{ mr: 1 }} /> Claim Request
        </MenuItem>
        <MenuItem onClick={() => { handleAssignRequest(selectedRequest); handleMenuClose(); }}>
          <GroupIcon sx={{ mr: 1 }} /> Assign to User
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { 
          handleUpdateStatus(selectedRequest?._id);
          handleMenuClose(); 
        }}>
          <EditIcon sx={{ mr: 1, color: 'primary.main' }} /> Update Status
        </MenuItem>
        <MenuItem onClick={() => { /* TODO: Approve */ handleMenuClose(); }}>
          <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} /> Approve
        </MenuItem>
        <MenuItem onClick={() => { /* TODO: Reject */ handleMenuClose(); }}>
          <CancelIcon sx={{ mr: 1, color: 'error.main' }} /> Reject
        </MenuItem>
      </Menu>
      
      {/* Dynamic Request Details Modal */}
      <RequestDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        requestId={selectedRequest?._id}
      />
      
      {/* Dynamic Request Status Update Modal */}
      <RequestStatusUpdate
        open={statusUpdateModalOpen}
        onClose={handleCloseStatusModal}
        request={selectedRequest}
      />
    </Box>
  );
};

export default ProfessionalReviewerDashboard;
