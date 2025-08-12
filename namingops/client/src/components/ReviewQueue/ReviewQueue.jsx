import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Collapse, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Divider
} from '@mui/material';
import StatusProgressionStepper from '../StatusProgression/StatusProgressionStepper'; // Adjust import as needed
import { Search as SearchIcon, ExpandMore, ExpandLess } from '@mui/icons-material';
import { format } from 'date-fns'; 
import { getStatusColor } from '../../theme/newColorPalette';

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

const DATE_SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'last_updated', label: 'Last Updated' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];

const ACTIVE_STATUSES = ['submitted', 'brand_review', 'legal_review'];

export default function ReviewQueue({
  requests = [],
  loading,
  error,
  onStatusChange,
  onClaimRequest,
  showClaimButton = false,
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
  }, [requests, statusFilter, searchTerm, sortBy]);

  // UI
  return (
    <Box>
      {/* Filters */}
      <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <TextField
          placeholder="Search requests..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
          }}
          sx={{ width: { xs: '100%', sm: '40%' } }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
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
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Date</InputLabel>
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            label="Date"
          >
            {DATE_SORT_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

         {/* Request Cards - Reviewer queue, Submitter style */}
         <Box sx={{ px: { xs: 0, md: 4 }, width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', mb: '2rem' }}>
          {filteredRequests.map(request => (
            <Card
              key={request.id || request._id}
              variant="outlined"
              sx={{
                borderLeft: `4px solid ${getStatusColor ? getStatusColor(request.status || 'submitted') : '#2196f3'}`,
                borderRadius: '0.5rem',
                boxShadow: expanded[request.id] ? 3 : 1,
                minHeight: 140,
                transition: 'box-shadow 0.2s',
              }}
            >
              <CardContent
                sx={{
                  px: { xs: 2, sm: 3, md: 4 },
                  pt: 2,
                  pb: 2,
                  '&:last-child': { pb: 2 },
                }}
                onClick={() => setExpanded(prev => ({ ...prev, [request.id]: !prev[request.id] }))}
              >
                {/* Top Row: Title + Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 500, pr: 2, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {request.requestData?.name || 'Untitled Request'}
                  </Typography>
                  <Chip
                    label={request.status}
                    sx={{
                      backgroundColor: getStatusColor ? getStatusColor(request.status) : '#2196f3',
                      color: 'white',
                      fontSize: '0.75rem',
                      height: '1.5rem',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}
                    size="small"
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
                <Collapse in={expanded[request.id]} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Request Details
                  </Typography>
                  {request.requestData && Object.keys(request.requestData).length > 0 ? (
                    <Grid container spacing={2} sx={{ mb: 1 }}>
                      {Object.entries(request.requestData).map(([key, value]) => (
                        <Grid item xs={12} sm={6} key={key}>
                          <Typography variant="body2" color="textSecondary" component="span">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
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
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}