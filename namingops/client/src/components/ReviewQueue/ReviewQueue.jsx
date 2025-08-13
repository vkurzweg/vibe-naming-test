import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Collapse, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Divider,
  CircularProgress, Alert, Table, TableBody, TableRow, TableCell
} from '@mui/material';
import { Search as SearchIcon, ExpandMore, ExpandLess } from '@mui/icons-material';
import { format } from 'date-fns';
import StatusDropdown from '../common/StatusDropdown';

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
  formConfig
}) {
    console.log('ReviewQueue requests:', requests); 
 
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
        (r.formData?.proposedName1 || r.requestData?.proposedName1 || '').toLowerCase().includes(lower) ||
        (r.formData?.contactName || r.requestData?.contactName || '').toLowerCase().includes(lower)
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
          return ((a.formData?.proposedName1 || a.requestData?.proposedName1 || '')).localeCompare(
            b.formData?.proposedName1 || b.requestData?.proposedName1 || ''
          );
        case 'name_desc':
          return ((b.formData?.proposedName1 || b.requestData?.proposedName1 || '')).localeCompare(
            a.formData?.proposedName1 || a.requestData?.proposedName1 || ''
          );
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return result;
  }, [requests, searchTerm, statusFilter, sortBy]);

  const keyToLabel = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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
                cursor: 'pointer',
                userSelect: 'none',
              }}
              variant="outlined"
              onClick={() => setExpanded(prev => ({ ...prev, [request.id]: !prev[request.id] }))}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') setExpanded(prev => ({ ...prev, [request.id]: !prev[request.id] }));
              }}
              aria-expanded={!!expanded[request.id]}
              role="button"
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {(request.formData?.proposedName1 || request.requestData?.proposedName1) || '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(request.formData?.contactName || request.requestData?.contactName) || '—'}
                    </Typography>
                  </Box>
                  {/* Status Dropdown */}
                  <StatusDropdown
                    currentStatus={request.status}
                    options={STATUS_UPDATE_OPTIONS}
                    onChange={status => {
                      const payload = { requestId: request.id, status, formData: request.formData };
                      if (onStatusChange && typeof onStatusChange.mutate === 'function') {
                        onStatusChange.mutate(payload);
                      } else if (typeof onStatusChange === 'function') {
                        onStatusChange(payload);
                      }
                    }}
                  />
                </Box>
          
                {/* Date */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Submitted: {request.createdAt ? format(new Date(request.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                </Typography>
          
                {/* Expand/collapse icon for visual feedback only */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                  {expanded[request.id]
                    ? <ExpandLess sx={{ pointerEvents: 'none' }} />
                    : <ExpandMore sx={{ pointerEvents: 'none' }} />}
                </Box>
          
                {/* Expanded details */}
                <Collapse in={!!expanded[request.id]}>
                  <Divider sx={{ my: 2 }} />
                  {formConfig?.fields && (
                    <Table size="small" sx={{ mb: 2, background: 'transparent' }}>
                      <TableBody>
                        {formConfig.fields.map(field => {
                          const value = request.formData?.[field.name];
                          return (
                            <TableRow key={field.name}>
                              <TableCell sx={{ border: 0, pl: 0, pr: 2, width: 180, color: 'text.secondary', fontWeight: 500 }}>
                                {field.label || keyToLabel(field.name)}
                              </TableCell>
                              <TableCell sx={{ border: 0, pl: 0, color: value ? 'text.primary' : '#aaa', wordBreak: 'break-word' }}>
                                {value === undefined || value === '' || value === null
                                  ? '—'
                                  : typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)
                                }
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          ))
      )}
    </Box>
  );
}