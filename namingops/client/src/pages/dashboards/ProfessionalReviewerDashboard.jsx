import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTitle, Box, Typography, Paper, Button, Tabs, Tab, Alert, CircularProgress,
  TextField, Card, CardContent, Chip, Divider,
  Grid, MenuItem, Select, FormControl, InputLabel, Pagination,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Send as SendIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import ArchiveIcon from '@mui/icons-material/Archive';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import ReviewQueue from '../../components/ReviewQueue/ReviewQueue';
import { getStatusColor } from '../../theme/newColorPalette';
import ResponsiveContainer from '../../components/Layout/ResponsiveContainer';
import useRequestManagement from '../../hooks/useRequestManagement';

// Helper function to get status label
const getStatusLabel = (status) => {
  const statusLabels = {
    'submitted': 'Submitted',
    'brand_review': 'Brand Review',
    'legal_review': 'Legal Review',
    'approved': 'Approved',
    'on_hold': 'On Hold',
    'canceled': 'Canceled'
  };
  return statusLabels[status] || 'Unknown';
};

const ProfessionalReviewerDashboard = () => {
  // eslint-disable-next-line no-unused-vars
  const { user } = useSelector((state) => state.auth); // Kept for future functionality
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [expanded, setExpanded] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [editingRequest, setEditingRequest] = useState(null); // Kept for future edit functionality
  
  const handleToggleExpand = useCallback((id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);
  
  // Get all requests for the review queue
  const { data: reviewQueue = [], isLoading: queueLoading, error: queueError } = useQuery({
    queryKey: ['reviewQueue'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/name-requests');
        console.log('Review queue data:', response.data);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching review queue:', error);
        throw error;
      }
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

  // Get form configuration for the new request form
  const { data: formConfig } = useQuery({
    queryKey: ['formConfig'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/form-configurations/active');
        const data = response.data;
        return data?.data || data || {};
      } catch (error) {
        console.error('Error fetching form configuration:', error);
        throw error;
      }
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

  const { updateStatus, claimRequest } = useRequestManagement();

  // Filter and sort requests for both tabs
const filteredRequests = useMemo(() => {
  if (!reviewQueue) return [];
  
  let result = [...reviewQueue];

  if (activeTab === 0) {
    // Review Queue tab - allow filtering by status
    if (statusFilter === 'all') {
      // Show all except archived/finished by default
      result = result.filter(req =>
        !['approved', 'canceled', 'cancelled', 'rejected'].includes(req.status)
      );
    } else {
      result = result.filter(req => req.status === statusFilter);
    }
  } else if (activeTab === 1) {
    // Approved Names tab - show only approved (and allow filter for rejected if needed)
    if (statusFilter === 'all') {
      result = result.filter(req =>
        ['approved', 'rejected'].includes(req.status)
      );
    } else {
      result = result.filter(req => req.status === statusFilter);
    }
  }

  // Filter by search term
  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    result = result.filter(req => {
      const nameMatches = req.requestData?.name?.toLowerCase().includes(lowerSearchTerm);
      const submitterMatches = req.submitter?.name?.toLowerCase().includes(lowerSearchTerm);
      return nameMatches || submitterMatches;
    });
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'date_desc':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'name_asc':
        return (a.requestData?.name || '').localeCompare(b.requestData?.name || '');
      case 'name_desc':
        return (b.requestData?.name || '').localeCompare(a.requestData?.name || '');
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return result;
}, [reviewQueue, activeTab, statusFilter, searchTerm, sortBy]);

  // Pagination
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRequests.slice(start, end);
  }, [filteredRequests, page, rowsPerPage]);

  const pageCount = Math.ceil(filteredRequests.length / rowsPerPage);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleStatusChange = useCallback((requestId, newStatus) => {
    updateStatus(requestId, newStatus);
  }, [updateStatus]);
  
  const handleClaimRequest = useCallback((requestId) => {
    claimRequest(requestId);
  }, [claimRequest]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when search changes
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };
  
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1); // Reset to first page when sort changes
  };
  
  // TabPanel component for accessibility
  const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`tabpanel-${index}`}
        aria-labelledby={`tab-${index}`}
        {...other}
      >
        {value === index && children}
      </div>
    );
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1); // Reset to first page on tab change
  };

  return (
    <ResponsiveContainer className="px-2 px-sm-3 px-md-4">
      <Paper 
        elevation={2}
        sx={{
          mt: '2rem',
          mb: '2rem',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="reviewer dashboard tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<BusinessIcon />}
              iconPosition="start"
              label="Review Queue" 
              id="tab-0"
              aria-controls="tabpanel-0" 
            />
            <Tab 
              icon={<ArchiveIcon />}
              iconPosition="start"
              label="Archive" 
              id="tab-1" 
              aria-controls="tabpanel-1" 
            />
          </Tabs>
        </Box>
        
        {/* Review Queue Tab Panel */}
        <ReviewQueue
          requests={reviewQueue}
          loading={queueLoading}
          error={queueError}
          onStatusChange={updateStatus}
          onClaimRequest={claimRequest}
          showClaimButton={user && user.role === 'admin'} 
/>
        
        {/* Archive Tab Panel */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: '1.5rem', px: 0 }}>
            {/* Filter controls for Archive tab */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              {/* Search input */}
              <TextField
                placeholder="Search archive..."
                variant="outlined"
                size="small"
                onChange={handleSearchChange}
                value={searchTerm}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
                }}
                sx={{ width: { xs: '100%', sm: '300px' } }}
              />
              
              {/* Status filter */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                </Select>
              </FormControl>
              
              {/* Sort options */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="sort-by-label">Sort by</InputLabel>
                <Select
                  labelId="sort-by-label"
                  id="sort-by"
                  value={sortBy}
                  onChange={handleSortChange}
                  label="Sort by"
                >
                  <MenuItem value="date_desc">Newest First</MenuItem>
                  <MenuItem value="date_asc">Oldest First</MenuItem>
                  <MenuItem value="name_asc">Name (A-Z)</MenuItem>
                  <MenuItem value="name_desc">Name (Z-A)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {queueLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: '2rem' }}>
                <CircularProgress />
              </Box>
            ) : queueError ? (
              <Alert severity="error" sx={{ mb: '1.5rem' }}>
                <AlertTitle>Error</AlertTitle>
                Failed to load archive. Please try again.
              </Alert>
            ) : filteredRequests.length === 0 ? (
              <Alert severity="info" sx={{ mb: '1.5rem' }}>
                <AlertTitle>No Archived Requests</AlertTitle>
                There are no approved requests in the archive.
              </Alert>
            ) : (
              <>
                {/* Archived request cards */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', mb: '2rem' }}>
                  {paginatedRequests.map(request => (
                    <Card 
                      key={request.id} 
                      sx={{ 
                        borderRadius: '0.5rem',
                        boxShadow: '0 3px 5px rgba(0,0,0,0.1)',
                        position: 'relative',
                        mb: 4, // Increased spacing between cards
                      }}
                      onClick={() => handleToggleExpand(request.id)}
                    >
                      <CardContent>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start'
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '0.75rem' }}>
                              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                                {request.requestData?.name || 'Name Request'}
                              </Typography>
                              
                              {/* Status tag */}
                              <Chip
                                label={getStatusLabel(request.status)}
                                sx={{
                                  backgroundColor: getStatusColor(request.status) + 'CC', // Semi-transparent background
                                  color: '#000000', // Dark text for better contrast
                                  fontSize: '0.75rem',
                                  height: '1.5rem',
                                  fontWeight: '600'
                                }}
                                size="small"
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: '1rem' }}>
                              Submitted by: {request.submitter?.name || 'Unknown'} • {new Date(request.createdAt).toLocaleDateString()}
                            </Typography>
                            
                            {/* View button */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'flex-end',
                              mt: '1rem'
                            }}>
                            </Box>
                          </Box>
                        </Box>

                        {/* Expanded content */}
                        {expanded[request.id] && (
                          <Box sx={{ mt: '1rem' }}>
                            <Divider sx={{ my: '1rem' }} />
                            <Typography variant="subtitle2" sx={{ mb: '0.5rem', fontWeight: 'bold' }}>
                              Request Details
                            </Typography>
                            {request.requestData && Object.keys(request.requestData).length > 0 ? (
                              <Grid container spacing={2}>
                                {Object.entries(request.requestData).map(([key, value]) => (
                                  <Grid item xs={12} sm={6} key={key}>
                                    <Typography variant="body2" color="textSecondary" component="span" sx={{ pl: '0' }}>
                                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                                    </Typography>
                                    <Typography variant="body2" component="span" sx={{ ml: '0.5rem' }}>
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </Typography>
                                  </Grid>
                                ))}
                              </Grid>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                No additional details available.
                              </Typography>
                            )}
                            
                            <Typography variant="subtitle2" sx={{ mt: '1.5rem', mb: '0.5rem', fontWeight: 'bold' }}>
                              Status History
                            </Typography>
                            <Typography variant="body2">
                              {request.statusHistory && request.statusHistory.length > 0 ? (
                                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                                  {request.statusHistory.map((history, index) => (
                                    <li key={index}>
                                      <Typography variant="body2">
                                        {new Date(history.timestamp).toLocaleString()}: Changed to {getStatusLabel(history.status)}
                                      </Typography>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  No status history available.
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                
                {/* Pagination */}
                {filteredRequests.length > rowsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: '2rem' }}>
                    <Pagination 
                      count={pageCount} 
                      page={page} 
                      onChange={handleChangePage} 
                      color="primary" 
                      size="large"
                      showFirstButton 
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </ResponsiveContainer>
  );
};

export default ProfessionalReviewerDashboard;