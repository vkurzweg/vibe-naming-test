import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Collapse, TextField,
  FormControl, InputLabel, Select, MenuItem, Divider,
  CircularProgress, Alert, Table, TableBody, TableRow, TableCell, Button
} from '@mui/material';
import { Search as SearchIcon, ExpandMore, ExpandLess } from '@mui/icons-material';
import { format } from 'date-fns';
import StatusDropdown from '../common/StatusDropdown';
import ReactSimpleWYSIWYG from "react-simple-wysiwyg";
import { useSelector } from 'react-redux';
import api from '../../services/api';

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

function RequestNotesEditor({ request, onNotesSaved }) {
  const user = useSelector(state => state.auth.user);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState({
    reviewerNotes: request.reviewerNotes || '',
    adminNotes: request.adminNotes || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/v1/name-requests/${request._id || request.id}/notes`, notes);
      setEditing(false);
      if (onNotesSaved) onNotesSaved(notes);
    } catch (err) {
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !['admin', 'reviewer'].includes(user.role)) return null;

  return (
    <>
      {editing ? (
        <Box>
          {user.role === 'reviewer' && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Reviewer Notes (Markdown, Links, Headings, Lists)
              </Typography>
              <ReactSimpleWYSIWYG
                value={notes.reviewerNotes}
                onChange={val => setNotes(n => ({ ...n, reviewerNotes: val }))}
              />
              <Typography variant="caption" color="text.secondary">
                Supports Markdown: <b>**bold**</b>, <i>_italic_</i>, [links](https://...), lists, headings, etc.
              </Typography>
            </Box>
          )}
          {user.role === 'admin' && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Admin Notes (Markdown, Links, Headings, Lists)
              </Typography>
              <ReactSimpleWYSIWYG
                value={notes.adminNotes}
                onChange={val => setNotes(n => ({ ...n, adminNotes: val }))}
              />
              <Typography variant="caption" color="text.secondary">
                Supports Markdown: <b>**bold**</b>, <i>_italic_</i>, [links](https://...), lists, headings, etc.
              </Typography>
            </Box>
          )}
          <Button onClick={handleSave} disabled={saving} size="small" sx={{ mr: 1 }}>
            Save
          </Button>
          <Button onClick={() => setEditing(false)} size="small" color="secondary">
            Cancel
          </Button>
        </Box>
      ) : (
        <Box>
          {user.role === 'reviewer' && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {request.reviewerNotes || <span style={{ color: '#aaa' }}>No notes</span>}
            </Typography>
          )}
          {user.role === 'admin' && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {request.adminNotes || <span style={{ color: '#aaa' }}>No notes</span>}
            </Typography>
          )}
          <Button onClick={() => setEditing(true)} size="small" sx={{ mt: 0.5 }}>
            Edit Notes
          </Button>
        </Box>
      )}
    </>
  );
}

export default function ReviewQueue({
  requests = [],
  loading,
  error,
  onStatusChange,
  onClaimRequest,
  showClaimButton = false,
  currentUserId,
  formConfig,
  onDeleteRequest 
}) {
  const [expanded, setExpanded] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const user = useSelector(state => state.auth.user);

  // Attachment upload handler
  async function handleAttachmentUpload(e, requestId) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('attachment', file);
    try {
      await api.post(`/api/v1/name-requests/${requestId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Optionally refetch or update local request state to show new attachment
      alert('Attachment uploaded! Refresh to see it in the list.');
    } catch (err) {
      alert('Failed to upload attachment');
    }
  }

  const filteredRequests = useMemo(() => {
    let result = [...requests];
    // Exclude deleted/inactive requests
    result = result.filter(r => r.isActive !== false);
    if (statusFilter === 'active') {
      result = result.filter(r => ACTIVE_STATUSES.includes(r.status));
    } else if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r =>
        (r.formData?.proposedName1 || r.requestData?.proposedName1 || '').toLowerCase().includes(lower) ||
        (r.formData?.contactName || r.requestData?.contactName || '').toLowerCase().includes(lower)
      );
    }
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

  function keyToLabel(key) {
    if (!key || typeof key !== 'string') return '';
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

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
            key={request.id || request._id}
            sx={{
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            variant="outlined"
            onClick={() => setExpanded(prev => ({ ...prev, [request.id || request._id]: !prev[request.id || request._id] }))}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') setExpanded(prev => ({ ...prev, [request.id || request._id]: !prev[request.id || request._id] }));
            }}
            aria-expanded={!!expanded[request.id || request._id]}
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
                <StatusDropdown
                  currentStatus={request.status}
                  options={STATUS_UPDATE_OPTIONS}
                  onChange={status => {
                    const payload = { requestId: request.id || request._id, status, formData: request.formData };
                    if (onStatusChange && typeof onStatusChange.mutate === 'function') {
                      onStatusChange.mutate(payload);
                    } else if (typeof onStatusChange === 'function') {
                      onStatusChange(payload);
                    }
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Submitted: {request.createdAt ? format(new Date(request.createdAt), 'MMM dd, yyyy') : 'Unknown'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                {expanded[request.id || request._id]
                  ? <ExpandLess sx={{ pointerEvents: 'none' }} />
                  : <ExpandMore sx={{ pointerEvents: 'none' }} />}
              </Box>
              <Collapse in={!!expanded[request.id || request._id]}>
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
                {/* Notes Editor for Reviewer/Admin (only visible to admin/reviewer) */}
                {['admin', 'reviewer'].includes(user?.role) && (
                  <RequestNotesEditor request={request} />
                )}
                {/* Attachments (visible to all roles) */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments</Typography>
                  {request.attachments && request.attachments.length > 0 ? (
                    <Box sx={{ mb: 1 }}>
                      {request.attachments.map((att, idx) => (
                        <Box key={idx} sx={{ mb: 0.5 }}>
                          <a href={att.url} target="_blank" rel="noopener noreferrer">{att.filename}</a>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No attachments</Typography>
                  )}
                  {/* Upload (admin/reviewer only) */}
                  {['admin', 'reviewer'].includes(user?.role) && (
                    <Box sx={{ mb: 2 }}>
                      <Button variant="outlined" component="label" size="small">
                        Upload Attachment
                        <input
                          type="file"
                          hidden
                          onChange={e => handleAttachmentUpload(e, request.id || request._id)}
                        />
                      </Button>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    sx={{
                      minWidth: 0,
                      px: 1,
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      opacity: 0.7,
                      '&:hover': { opacity: 1, background: 'rgba(211,47,47,0.08)' }
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this request?')) {
                        onDeleteRequest?.(request.id || request._id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}