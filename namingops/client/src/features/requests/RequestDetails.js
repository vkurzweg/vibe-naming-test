import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  CircularProgress, 
  Divider, 
  Grid, 
  Paper, 
  Tab, 
  Tabs, 
  Typography,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Container,
  TextField,
  useTheme
} from '@mui/material';
import { 
  ArrowBack as BackIcon, 
  Description as DescriptionIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  AccessTime as PendingIcon,
  HourglassEmpty as InReviewIcon,
  FileDownload as ExportIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChatBubbleOutline as CommentIcon,
  History as HistoryIcon,
  AttachFile as AttachmentIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { fetchRequestById, exportToPDF } from './requestsSlice';

const statusIcons = {
  'pending': <PendingIcon />,
  'approved': <CheckCircleIcon />,
  'rejected': <CloseIcon />,
  'in_review': <InReviewIcon />,
  'draft': <DescriptionIcon />
};

const statusLabels = {
  'pending': 'Pending Review',
  'approved': 'Approved',
  'rejected': 'Rejected',
  'in_review': 'In Review',
  'draft': 'Draft'
};

const statusColors = {
  'pending': 'warning',
  'approved': 'success',
  'rejected': 'error',
  'in_review': 'info',
  'draft': 'default'
};

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState('details');
  
  // Fetch request details when component mounts or ID changes
  useEffect(() => {
    if (id) {
      dispatch(fetchRequestById(id));
    }
  }, [dispatch, id]);

  // Select request details from Redux store
  const { currentRequest, status, error } = useSelector((state) => ({
    currentRequest: state.requests?.currentRequest || null,
    status: state.requests?.status || 'idle',
    error: state.requests?.error || null
  }));
  
  // Show loading state
  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error loading request details
          </Typography>
          <Typography variant="body1">
            {error.message || 'Failed to load request details. Please try again.'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // If no request data is available
  if (!currentRequest) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Request not found
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The requested resource could not be found or you don't have permission to view it.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/requests/my-requests')}
          >
            Back to My Requests
          </Button>
        </Paper>
      </Container>
    );
  }

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Handle edit request
  const handleEdit = () => {
    if (currentRequest) {
      navigate(`/edit-request/${currentRequest.id}`);
    }
  };

  // Handle delete request
  const handleDelete = () => {
    // TODO: Implement delete functionality with confirmation dialog
    console.log('Delete request:', currentRequest?.id);
  };

  // Show loading state
  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box p={3}>
        <Typography color="error" gutterBottom>
          Error loading request: {error.message || 'Unknown error occurred'}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={handleBack}
          startIcon={<BackIcon />}
        >
          Back to List
        </Button>
      </Box>
    );
  }

  // Show not found state
  if (!currentRequest) {
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          Request not found
        </Typography>
        <Typography paragraph>
          The requested naming request could not be found or you don't have permission to view it.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleBack}
          startIcon={<BackIcon />}
        >
          Back to My Requests
        </Button>
      </Box>
    );
  }

  const {
    request_title,
    request_date,
    status: requestStatus,
    reviewer_name,
    reviewer_email,
    asset_type,
    proposed_name,
    naming_narrative,
    comments = [],
    history = [],
    attachments = []
  } = currentRequest;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with back button and actions */}
      <Box mb={4}>
        <Button
          startIcon={<BackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to My Requests
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {request_title}
            </Typography>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={2}>
              <Chip
                icon={statusIcons[requestStatus] || <InfoIcon />}
                label={statusLabels[requestStatus] || requestStatus}
                color={statusColors[requestStatus] || 'default'}
                variant="outlined"
                size="small"
              />
              <Typography variant="body2" color="textSecondary">
                Request ID: {id}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            {requestStatus === 'draft' && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </>
            )}
            {requestStatus === 'rejected' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Resubmit
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main content */}
      <Grid container spacing={3}>
        {/* Left sidebar */}
        <Grid item xs={12} md={4} lg={3}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                REQUEST DETAILS
              </Typography>
              
              <List dense>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PersonIcon color="action" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Requester" 
                    secondary={currentRequest.requester_name || 'N/A'} 
                  />
                </ListItem>
                
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CalendarIcon color="action" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Submitted on" 
                    secondary={format(parseISO(request_date), 'MMM d, yyyy h:mm a')} 
                  />
                </ListItem>
                
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CategoryIcon color="action" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Asset Type" 
                    secondary={asset_type || 'N/A'} 
                  />
                </ListItem>
                
                {reviewer_name && (
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PersonIcon color="action" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Reviewer" 
                      secondary={
                        <>
                          {reviewer_name}
                          {reviewer_email && (
                            <Typography component="div" variant="caption" display="block">
                              {reviewer_email}
                            </Typography>
                          )}
                        </>
                      } 
                    />
                  </ListItem>
                )}
              </List>
              
              <Box mt={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  onClick={() => {
                    const doc = exportToPDF([currentRequest], `Request-${id}`);
                    doc.save(`request-${id}.pdf`);
                  }}
                >
                  Export as PDF
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          {/* Quick actions */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                QUICK ACTIONS
              </Typography>
              
              <List dense>
                <ListItem 
                  button 
                  component={Link} 
                  to="/submit-request"
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <AddIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Create New Request" />
                </ListItem>
                
                <ListItem 
                  button 
                  component={Link}
                  to="/brand-guidelines"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="View Brand Guidelines" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Main content area */}
        <Grid item xs={12} md={8} lg={9}>
          <Card variant="outlined">
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab 
                value="details" 
                label="Request Details" 
                icon={<DescriptionIcon fontSize="small" />} 
                iconPosition="start"
              />
              <Tab 
                value="comments" 
                label={`Comments (${comments.length})`} 
                icon={<CommentIcon fontSize="small" />} 
                iconPosition="start"
              />
              <Tab 
                value="history" 
                label="History" 
                icon={<HistoryIcon fontSize="small" />} 
                iconPosition="start"
              />
              {attachments.length > 0 && (
                <Tab 
                  value="attachments" 
                  label={`Attachments (${attachments.length})`} 
                  icon={<AttachmentIcon fontSize="small" />} 
                  iconPosition="start"
                />
              )}
            </Tabs>
            
            <Divider />
            
            <CardContent>
              {tabValue === 'details' && (
                <Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Proposed Name
                      </Typography>
                      <Typography paragraph>{proposed_name || 'N/A'}</Typography>
                      
                      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        Naming Narrative
                      </Typography>
                      <Typography paragraph whiteSpace="pre-line">
                        {naming_narrative || 'No narrative provided.'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Additional Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Status" 
                            secondary={
                              <Chip 
                                label={statusLabels[requestStatus] || requestStatus} 
                                color={statusColors[requestStatus] || 'default'}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            } 
                          />
                        </ListItem>
                        
                        {currentRequest.trademarked && (
                          <ListItem>
                            <ListItemText 
                              primary="Trademark Status" 
                              secondary={currentRequest.trademark_status || 'Not specified'} 
                            />
                          </ListItem>
                        )}
                        
                        <ListItem>
                          <ListItemText 
                            primary="Last Updated" 
                            secondary={format(parseISO(currentRequest.updated_at || request_date), 'MMM d, yyyy h:mm a')} 
                          />
                        </ListItem>
                      </List>
                      
                      {currentRequest.notes && (
                        <Box mt={3}>
                          <Typography variant="h6" gutterBottom>
                            Review Notes
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="body2" whiteSpace="pre-line">
                              {currentRequest.notes}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {tabValue === 'comments' && (
                <Box>
                  {comments.length > 0 ? (
                    <List>
                      {comments.map((comment, index) => (
                        <React.Fragment key={index}>
                          <ListItem alignItems="flex-start">
                            <ListItemIcon>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {comment.author_name?.charAt(0) || 'U'}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <>
                                  <Typography 
                                    component="span" 
                                    variant="subtitle2"
                                    sx={{ fontWeight: 'medium' }}
                                  >
                                    {comment.author_name || 'Unknown User'}
                                  </Typography>
                                  <Typography 
                                    component="span" 
                                    variant="caption" 
                                    color="textSecondary"
                                    sx={{ ml: 1 }}
                                  >
                                    {format(parseISO(comment.created_at), 'MMM d, yyyy h:mm a')}
                                  </Typography>
                                </>
                              }
                              secondary={
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                  whiteSpace="pre-line"
                                >
                                  {comment.text}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < comments.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <CommentIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="subtitle1" color="textSecondary">
                        No comments yet
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Be the first to add a comment
                      </Typography>
                    </Box>
                  )}
                  
                  <Box mt={3} pt={2} borderTop={1} borderColor="divider">
                    <Typography variant="subtitle2" gutterBottom>
                      Add a comment
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Type your comment here..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <Button 
                      variant="contained" 
                      color="primary"
                      disabled={!currentRequest}
                    >
                      Post Comment
                    </Button>
                  </Box>
                </Box>
              )}
              
              {tabValue === 'history' && (
                <Box>
                  {history.length > 0 ? (
                    <List>
                      {history.map((item, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemIcon>
                              <Avatar sx={{ bgcolor: 'grey.300', color: 'grey.700' }}>
                                <HistoryIcon fontSize="small" />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2">
                                  {item.action}
                                  <Typography 
                                    component="span" 
                                    variant="caption" 
                                    color="textSecondary"
                                    sx={{ ml: 1 }}
                                  >
                                    {format(parseISO(item.timestamp), 'MMM d, yyyy h:mm a')}
                                  </Typography>
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary">
                                  {item.details}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < history.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <HistoryIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="subtitle1" color="textSecondary">
                        No history available
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        History will appear here as the request progresses
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              {tabValue === 'attachments' && (
                <Box>
                  <List>
                    {attachments.map((file, index) => (
                      <React.Fragment key={index}>
                        <ListItem 
                          button 
                          component="a" 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ListItemIcon>
                            <AttachmentIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={file.name} 
                            secondary={`${(file.size / 1024).toFixed(1)} KB`} 
                          />
                        </ListItem>
                        {index < attachments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RequestDetails;
