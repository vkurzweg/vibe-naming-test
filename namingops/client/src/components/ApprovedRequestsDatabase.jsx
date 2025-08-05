import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  Button,
  IconButton,
  Collapse,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Visibility as ViewIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { getStatusColor } from '../theme/newColorPalette';
import { fetchUserRequests } from '../features/requests/requestsSlice';
import { fetchReviewRequests } from '../features/review/reviewSlice';

const ApprovedRequestsDatabase = ({ userRole = 'submitter' }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  
  // Redux state
  const { requests: userRequests, loading: userLoading } = useSelector((state) => state.requests);
  const { requests: reviewRequests, loading: reviewLoading } = useSelector((state) => state.review);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('approvedAt-desc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchUserRequests());
    if (userRole === 'reviewer' || userRole === 'admin') {
      dispatch(fetchReviewRequests());
    }
  }, [dispatch, userRole]);

  // Combine and filter approved requests
  const approvedRequests = useMemo(() => {
    const allRequests = [...(userRequests || []), ...(reviewRequests || [])];
    
    // Filter for approved requests only and deduplicate
    const approved = allRequests
      .filter(request => request.status === 'approved')
      .reduce((acc, request) => {
        const requestId = request._id || request.id;
        if (!requestId) return acc;
        
        // Deduplicate by ID
        if (!acc.find(r => (r._id === requestId || r.id === requestId))) {
          acc.push(request);
        }
        return acc;
      }, []);

    return approved;
  }, [userRequests, reviewRequests]);

  // Enhanced search and filtering
  const filteredRequests = useMemo(() => {
    return approvedRequests
      .filter(request => {
        // Search filter - comprehensive search across all fields
        const matchesSearch = !searchQuery || (
          Object.values(request).some(value => {
            if (typeof value === 'string') {
              return value.toLowerCase().includes(searchQuery.toLowerCase());
            }
            if (typeof value === 'object' && value !== null) {
              return Object.values(value).some(subValue => 
                typeof subValue === 'string' && subValue.toLowerCase().includes(searchQuery.toLowerCase())
              );
            }
            return false;
          }) ||
          (request.formData && Object.values(request.formData).some(value => 
            typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())
          ))
        );

        // Category filter (dynamic based on available data)
        const matchesCategory = categoryFilter === 'all' || (
          request.category === categoryFilter ||
          request.formData?.category === categoryFilter ||
          request.type === categoryFilter
        );

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        // Enhanced sorting
        switch (sortBy) {
          case 'approvedAt-desc':
            return new Date(b.approvedAt || b.updatedAt || b.createdAt || 0) - new Date(a.approvedAt || a.updatedAt || a.createdAt || 0);
          case 'approvedAt-asc':
            return new Date(a.approvedAt || a.updatedAt || a.createdAt || 0) - new Date(b.approvedAt || b.updatedAt || b.createdAt || 0);
          case 'title-asc': {
            const aTitle = a.title || a.formData?.title || a.formData?.name || 'Untitled';
            const bTitle = b.title || b.formData?.title || b.formData?.name || 'Untitled';
            return aTitle.localeCompare(bTitle);
          }
          case 'title-desc': {
            const aTitleDesc = a.title || a.formData?.title || a.formData?.name || 'Untitled';
            const bTitleDesc = b.title || b.formData?.title || b.formData?.name || 'Untitled';
            return bTitleDesc.localeCompare(aTitleDesc);
          }
          default:
            return new Date(b.approvedAt || b.updatedAt || b.createdAt || 0) - new Date(a.approvedAt || a.updatedAt || a.createdAt || 0);
        }
      });
  }, [approvedRequests, searchQuery, categoryFilter, sortBy]);

  // Get unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    const categories = new Set();
    approvedRequests.forEach(request => {
      if (request.category) categories.add(request.category);
      if (request.formData?.category) categories.add(request.formData.category);
      if (request.type) categories.add(request.type);
    });
    return Array.from(categories).sort();
  }, [approvedRequests]);

  // Dynamic title extraction
  const getRequestTitle = (request) => {
    const titleFields = ['title', 'name', 'subject', 'requestTitle', 'requestName'];
    for (const field of titleFields) {
      if (request[field]) return request[field];
      if (request.formData?.[field]) return request.formData[field];
    }
    
    // If no title found, create one from available data
    if (request.formData) {
      const firstValue = Object.values(request.formData).find(v => 
        typeof v === 'string' && v.length > 0 && v.length < 100
      );
      if (firstValue) return firstValue;
    }
    
    return 'Request #' + (request._id?.slice(-6) || request.id?.slice(-6) || 'Unknown');
  };

  // Dynamic description extraction
  const getRequestDescription = (request) => {
    const descFields = ['description', 'summary', 'details', 'notes', 'content'];
    for (const field of descFields) {
      if (request[field]) {
        if (typeof request[field] === 'object') {
          return request[field].text || request[field].content || JSON.stringify(request[field]);
        }
        return request[field];
      }
      if (request.formData?.[field]) {
        if (typeof request.formData[field] === 'object') {
          return request.formData[field].text || request.formData[field].content || JSON.stringify(request.formData[field]);
        }
        return request.formData[field];
      }
    }
    return 'No description available';
  };

  // Toggle card expansion
  const toggleCardExpansion = (requestId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedCards(newExpanded);
  };

  // Export functionality
  const handleExportData = () => {
    const exportData = filteredRequests.map(request => ({
      title: getRequestTitle(request),
      description: getRequestDescription(request),
      approvedDate: format(new Date(request.approvedAt || request.updatedAt || request.createdAt), 'yyyy-MM-dd'),
      submitter: request.user?.name || request.formData?.requestorName || 'Unknown',
      category: request.category || request.formData?.category || request.type || 'Uncategorized',
      id: request._id || request.id
    }));

    const csvContent = [
      ['Title', 'Description', 'Approved Date', 'Submitter', 'Category', 'ID'],
      ...exportData.map(row => [
        row.title,
        row.description.substring(0, 100) + (row.description.length > 100 ? '...' : ''),
        row.approvedDate,
        row.submitter,
        row.category,
        row.id
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approved-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isLoading = userLoading || reviewLoading;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <ArchiveIcon sx={{ mr: 2, fontSize: '2rem', color: getStatusColor('approved') }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            Approved Requests Database
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Browse and search through all approved naming requests across the organization
        </Typography>
      </Box>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search approved requests..."
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
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {availableCategories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
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
                  <MenuItem value="approvedAt-desc">Newest First</MenuItem>
                  <MenuItem value="approvedAt-asc">Oldest First</MenuItem>
                  <MenuItem value="title-asc">Title A-Z</MenuItem>
                  <MenuItem value="title-desc">Title Z-A</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {filteredRequests.length} approved request{filteredRequests.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportData}
                disabled={filteredRequests.length === 0}
                fullWidth
              >
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredRequests.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No approved requests found. Try adjusting your search criteria.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredRequests.map((request) => {
            const requestId = request._id || request.id;
            const isExpanded = expandedCards.has(requestId);
            
            return (
              <Grid item xs={12} key={requestId}>
                <Card 
                  sx={{ 
                    border: `1px solid ${getStatusColor('approved')}33`,
                    '&:hover': {
                      borderColor: getStatusColor('approved'),
                      boxShadow: `0 2px 8px ${getStatusColor('approved')}40`,
                    }
                  }}
                >
                  <CardContent>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Chip 
                          label="APPROVED"
                          sx={{
                            backgroundColor: getStatusColor('approved'),
                            color: 'white',
                            fontWeight: 700,
                          }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {getRequestTitle(request)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => {
                              setSelectedRequest(request);
                              setDetailsModalOpen(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          onClick={() => toggleCardExpansion(requestId)}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Summary */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2 }}
                    >
                      {getRequestDescription(request).substring(0, 150)}
                      {getRequestDescription(request).length > 150 ? '...' : ''}
                    </Typography>

                    {/* Metadata */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Approved: {format(new Date(request.approvedAt || request.updatedAt || request.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        By: {request.user?.name || request.formData?.requestorName || 'Unknown'}
                      </Typography>
                    </Box>

                    {/* Expanded Details */}
                    <Collapse in={isExpanded}>
                      <Divider sx={{ mb: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Full Details:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {getRequestDescription(request)}
                        </Typography>
                        
                        {/* Additional metadata */}
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Category:</strong> {request.category || request.formData?.category || request.type || 'Uncategorized'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Request ID:</strong> {requestId}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default ApprovedRequestsDatabase;
