import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Collapse, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Divider,
  CircularProgress, Alert
} from '@mui/material';
import StatusProgressionStepper from '../StatusProgression/StatusProgressionStepper';
import { Search as SearchIcon, ExpandMore, ExpandLess } from '@mui/icons-material';
import { format } from 'date-fns';
import StatusDropdown from '../common/StatusDropdown'; // Use shared dropdown

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Requests' },
  { value: 'active', label: 'Active Requests' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'brand_review', label: 'Brand Review' },
  { value: 'legal_review', label: 'Legal Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'canceled', label: 'Canceled' },
];

const STATUS_UPDATE_OPTIONS = [
  { value: 'brand_review', label: 'Brand Review' },
  { value: 'legal_review', label: 'Legal Review' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'approved', label: 'Approved' },
  { value: 'canceled', label: 'Canceled' },
];

const ACTIVE_STATUSES = ['submitted', 'brand_review', 'legal_review'];

export default function ReviewQueue({
  requests = [],
  loading,
  error,
  onStatusChange,
  onClaimRequest,
  showClaimButton = false,
  currentUserId,
}) {
  const [expanded, setExpanded] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  // Filtering
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(r => ACTIVE_STATUSES.includes(r.status));
    } else if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.requestData?.name?.toLowerCase().includes(lower) ||
        r.submitter?.name?.toLowerCase().includes(lower)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'date_desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'last_updated':
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case 'name_asc':
          return (a.requestData?.name || '').localeCompare(b.requestData?.name || '');
        case 'name_desc':
          return (b.requestData?.name || '').localeCompare(a.requestData?.name || '');
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return result;
  }, [requests, searchTerm, statusFilter, sortBy]);

  return (
    <Box sx={{ p: { xs: 0, md: 2 } }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search requests..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
          }}
          sx={{ width: { xs: '100%', sm: 240 } }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            label="Status"
          >
            {STATUS_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            label="Sort By"
          >
            <MenuItem value="date_desc">Newest First</MenuItem>
            <MenuItem value="date_asc">Oldest First</MenuItem>
            <MenuItem value="last_updated">Last Updated</MenuItem>
            <MenuItem value="name_asc">Name (A-Z)</MenuItem>
            <MenuItem value="name_desc">Name (Z-A)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof error === 'string' ? error : 'Failed to load requests. Please try again.'}
        </Alert>
      ) : filteredRequests.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No requests found.
        </Alert>
      ) : (
        filteredRequests.map(request => (
          <Card
            key={request.id}
            sx={{
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            }}
            variant="outlined"
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {request.requestData?.name || 'Untitled Request'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {request.submitter?.name || 'Unknown Submitter'}
                  </Typography>
                </Box>
                {/* Status Dropdown */}
                <StatusDropdown
                  currentStatus={request.status}
                  options={STATUS_UPDATE_OPTIONS}
                  onChange={status => {
                    const payload = { requestId: request.id, status, formData: request.formData || request.requestData };
                    if (onStatusChange && typeof onStatusChange.mutate === 'function') {
                      onStatusChange.mutate(payload);
                    } else if (typeof onStatusChange === 'function') {
                      onStatusChange(payload);
                    }
                  }}
                  // Add disabled prop if needed
                />
              </Box>

              {/* Date */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Submitted: {request.createdAt ? format(new Date(request.createdAt), 'MMM dd, yyyy') : 'Unknown'}
              </Typography>

              {/* Horizontal Stepper */}
              <Box sx={{ mb: 1 }}>
                <StatusProgressionStepper
                  status={request.status}
                  orientation="horizontal"
                  compact
                  showTimestamps={false}
                  timestamps={{
                    submitted: request.createdAt,
                    brand_review: request.updatedAt,
                    legal_review: request.updatedAt,
                    approved: request.updatedAt
                  }}
                />
              </Box>

              {/* Expand/collapse */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    setExpanded(prev => ({ ...prev, [request.id]: !prev[request.id] }));
                  }}
                  aria-label={expanded[request.id] ? "Collapse details" : "Expand details"}
                >
                  {expanded[request.id] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              {/* Expanded details */}
              <Collapse in={!!expanded[request.id]}>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  {Object.entries(request.requestData || {}).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <Grid item xs={4} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          {key}:
                        </Typography>
                      </Grid>
                      <Grid item xs={8} sm={9}>
                        <Typography variant="body2">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </Typography>
                      </Grid>
                    </React.Fragment>
                  ))}
                </Grid>
              </Collapse>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}