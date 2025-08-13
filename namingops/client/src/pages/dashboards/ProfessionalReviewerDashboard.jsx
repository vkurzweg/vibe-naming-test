import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Paper, Tabs, Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import ArchiveIcon from '@mui/icons-material/Archive';
import api from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import ReviewQueue from '../../components/ReviewQueue/ReviewQueue';
import ResponsiveContainer from '../../components/Layout/ResponsiveContainer';
import useRequestManagement from '../../hooks/useRequestManagement';
import NewRequestForm from '../../components/Requests/NewRequestForm'; // <-- Import the form

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
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);

  // Get all requests for the review queue
  const { data: reviewQueue = [], isLoading: queueLoading, error: queueError } = useQuery({
    queryKey: ['requests', 'all'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/name-requests');
        return Array.isArray(response.data)
          ? response.data.map(item => ({
              ...item,
              id: item.id || item._id
            }))
          : [];
      } catch (error) {
        console.error('Error fetching review queue:', error);
        throw error;
      }
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

  // --- Add active form config fetch ---
  const { data: activeFormConfig } = useQuery({
    queryKey: ['activeFormConfig'],
    queryFn: async () => {
      const response = await api.get('/api/v1/form-configurations/active');
      return response.data;
    },
    staleTime: 300000,
    cacheTime: 600000,
  });

  const { updateStatus, claimRequest } = useRequestManagement();

  const deleteRequest = useMutation({
    mutationFn: (id) => api.delete(`/api/v1/name-requests/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['requests', 'all']),
  });

const handleDeleteRequest = (id) => {
  deleteRequest.mutate(id);
};

  const filteredRequests = useMemo(() => {
    if (!reviewQueue) return [];
    let result = [...reviewQueue];
    if (activeTab === 0) {
      if (statusFilter === 'all') {
        result = result.filter(req =>
          !['approved', 'canceled', 'cancelled', 'rejected'].includes(req.status)
        );
      } else {
        result = result.filter(req => req.status === statusFilter);
      }
    } else if (activeTab === 1) {
      if (statusFilter === 'all') {
        result = result.filter(req =>
          ['approved', 'rejected'].includes(req.status)
        );
      } else {
        result = result.filter(req => req.status === statusFilter);
      }
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(req => {
        const nameMatches = req.requestData?.name?.toLowerCase().includes(lowerSearchTerm);
        const submitterMatches = req.submitter?.name?.toLowerCase().includes(lowerSearchTerm);
        return nameMatches || submitterMatches;
      });
    }
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
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
            variant="scrollable"
            scrollButtons="auto"
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
              icon={<AddIcon />}
              iconPosition="start"
              label="New Request"
              id="tab-1"
              aria-controls="tabpanel-1"
            />
            <Tab 
              icon={<ArchiveIcon />}
              iconPosition="start"
              label="Archive" 
              id="tab-2" 
              aria-controls="tabpanel-2" 
            />
          </Tabs>
        </Box>
        
        {/* Review Queue Tab Panel */}
        <TabPanel value={activeTab} index={0}>
          <ReviewQueue
            requests={reviewQueue}
            loading={queueLoading}
            error={queueError}
            onStatusChange={updateStatus}
            onClaimRequest={claimRequest}
            showClaimButton={true}
            currentUserId={user?.id}
            formConfig={activeFormConfig}
            onDeleteRequest={handleDeleteRequest}
          />
        </TabPanel>

        {/* Archive Tab Panel */}
        <TabPanel value={activeTab} index={2}>
          {/* You can implement the archive tab here or leave it blank for now */}
        </TabPanel>

        {/* New Request Tab Panel */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 0 }}>
            <NewRequestForm onSuccess={() => { /* Optionally handle success, e.g. show a toast or switch tabs */ }} />
          </Box>
        </TabPanel>
      </Paper>
    </ResponsiveContainer>
  );
};

export default ProfessionalReviewerDashboard;