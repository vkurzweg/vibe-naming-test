import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchUserRequests as fetchReviewQueue,
  updateRequest as updateRequestStatus
} from '../features/requests/requestsSlice';
import {
  ExpandLess as ExpandLess,
  ExpandMore as ExpandMore,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Badge,
  Tabs,
  Tab,
  useTheme,
  Grid,
  FormControlLabel,
  FormLabel,
  FormGroup,
  FormHelperText,
  RadioGroup,
  Radio,
  Checkbox,
  Switch,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  CardMedia,
  CardActionArea,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemAvatar,
  ListSubheader,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
  TableSortLabel,
  TableFooter,
  LinearProgress,
  Skeleton,
  Snackbar,
  Fade,
  Zoom,
  Slide,
  Grow,
  Container,
  InputAdornment,
  OutlinedInput,
  Input,
  NativeSelect,
  AppBar,
  Toolbar,
  ButtonBase,
  ButtonGroup,
  Fab
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { 
  fetchUserRequests, 
  updateRequest,
  selectAllRequests,
  selectIsLoading,
  selectError
} from '../features/requests/requestsSlice';
import { format } from 'date-fns';

// TabPanel component for the review queue tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`review-tabpanel-${index}`}
      aria-labelledby={`review-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `review-tab-${index}`,
    'aria-controls': `review-tabpanel-${index}`,
  };
}

const ReviewQueue = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { requests, loading, error } = useSelector((state) => state.requests);
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Load review queue on component mount and tab change
  useEffect(() => {
    const status = tabValue === 0 ? 'pending' : 'all';
    dispatch(fetchReviewQueue({ status }));
  }, [dispatch, tabValue]);

  // Handle status update
  const handleStatusUpdate = async (requestId, status, reason = '') => {
    try {
      await dispatch(updateRequestStatus({ 
        requestId, 
        status,
        ...(reason && { rejectionReason: reason })
      })).unwrap();
      
      // Refresh the queue
      const statusToFetch = tabValue === 0 ? 'pending' : 'all';
      await dispatch(fetchReviewQueue({ status: statusToFetch }));
      
      // Close dialog if open
      if (rejectDialogOpen) {
        setRejectDialogOpen(false);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  // Open reject dialog
  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  // Close reject dialog
  const handleRejectDialogClose = () => {
    setRejectDialogOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  // Submit rejection
  const handleRejectSubmit = () => {
    if (selectedRequest && rejectionReason.trim()) {
      handleStatusUpdate(selectedRequest._id, 'rejected', rejectionReason);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status chip color
  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
        return <Chip label="Approved" color="success" size="small" variant="outlined" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" variant="outlined" />;
      case 'pending':
      default:
        return <Chip label="Pending" color="warning" size="small" variant="outlined" />;
    }
  };

  // Filter requests based on tab
  const filteredRequests = tabValue === 0 
    ? requests.filter(req => req.status === 'pending')
    : requests;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Review Queue
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton 
              onClick={() => dispatch(fetchReviewQueue({ status: tabValue === 0 ? 'pending' : 'all' }))}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Pending Review
                {requests.filter(req => req.status === 'pending').length > 0 && (
                  <Chip 
                    label={requests.filter(req => req.status === 'pending').length} 
                    size="small" 
                    color="primary"
                    sx={{ minWidth: '24px', height: '20px' }}
                  />
                )}
              </Box>
            } 
            {...a11yProps(0)} 
          />
          <Tab label="All Requests" {...a11yProps(1)} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <RequestTable 
            requests={filteredRequests} 
            onApprove={handleStatusUpdate}
            onReject={handleRejectClick}
            formatDate={formatDate}
            getStatusChip={getStatusChip}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <RequestTable 
            requests={filteredRequests} 
            onApprove={handleStatusUpdate}
            onReject={handleRejectClick}
            formatDate={formatDate}
            getStatusChip={getStatusChip}
          />
        </TabPanel>
      </Paper>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Naming Request</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting this request:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="rejection-reason"
            label="Reason for rejection"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectDialogClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleRejectSubmit} 
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim()}
            startIcon={<RejectIcon />}
          >
            Reject Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Request Table Component
const RequestTable = ({ requests, onApprove, onReject, formatDate, getStatusChip }) => {
  const [expandedRequest, setExpandedRequest] = useState(null);

  const toggleExpandRequest = (requestId) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  if (requests.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body1" color="textSecondary">
          No requests found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Request Details</TableCell>
            <TableCell>Submitted By</TableCell>
            <TableCell>Date Submitted</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <React.Fragment key={request._id}>
              <TableRow hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleExpandRequest(request._id)}
                    >
                      {expandedRequest === request._id ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </IconButton>
                    <Box>
                      <Typography variant="subtitle2">{request.title || 'Untitled Request'}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        ID: {request._id.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar 
                      src={request.submittedBy?.picture} 
                      alt={request.submittedBy?.name}
                      sx={{ width: 24, height: 24 }}
                    >
                      {request.submittedBy?.name?.charAt(0) || <PersonIcon />}
                    </Avatar>
                    <Typography variant="body2">
                      {request.submittedBy?.name || 'Unknown User'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{formatDate(request.createdAt)}</TableCell>
                <TableCell>{getStatusChip(request.status)}</TableCell>
                <TableCell align="right">
                  <Box display="flex" justifyContent="flex-end" gap={1}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => toggleExpandRequest(request._id)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {request.status === 'pending' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => onApprove(request._id, 'approved')}
                          >
                            <ApproveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => onReject(request)}
                          >
                            <RejectIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
              
              {/* Expanded Row */}
              {expandedRequest === request._id && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ p: 0, borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                    <Box p={2} bgcolor="action.hover">
                      <Typography variant="subtitle2" gutterBottom>
                        Request Details
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <strong>Title:</strong> {request.title || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Description:</strong> {request.description || 'No description provided'}
                          </Typography>
                          {request.rejectionReason && (
                            <Typography variant="body2" color="error">
                              <strong>Rejection Reason:</strong> {request.rejectionReason}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Proposed Names
                          </Typography>
                          {request.proposedNames?.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                              {request.proposedNames.map((name, idx) => (
                                <li key={idx}>
                                  <Typography variant="body2">
                                    <strong>{name.name}:</strong> {name.description || 'No description'}
                                  </Typography>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              No proposed names
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ReviewQueue;
