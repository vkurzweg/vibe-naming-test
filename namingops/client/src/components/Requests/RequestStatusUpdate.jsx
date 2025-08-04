import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { updateRequestStatus } from '../../features/review/reviewSlice';

const statusOptions = [
  { value: 'submitted', label: 'Submitted', color: '#9e9e9e' },
  { value: 'under_review', label: 'Brand Review', color: '#2196f3' },
  { value: 'final_review', label: 'Legal Review', color: '#ff9800' },
  { value: 'approved', label: 'Approved', color: '#4caf50' },
  { value: 'on_hold', label: 'On Hold', color: '#9c27b0' },
  { value: 'canceled', label: 'Canceled', color: '#757575' },
];

const RequestStatusUpdate = ({ open, onClose, request }) => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState(request?.status || 'submitted');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Reset form when request changes or modal opens
  React.useEffect(() => {
    if (open && request) {
      setStatus(request.status || 'submitted');
      setNotes('');
      setError(null);
    }
  }, [open, request]);
  
  const handleSubmit = () => {
    setLoading(true);
    setError(null);
    
    dispatch(updateRequestStatus({
      requestId: request._id,
      status,
      notes
    }))
      .unwrap()
      .then(() => {
        onClose();
      })
      .catch((err) => {
        setError(err.message || 'Failed to update request status');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  if (!request) {
    return null;
  }
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Update Request Status</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom fontWeight={500}>
            {request.title || 'Untitled Request'}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Current Status:
            </Typography>
            <Chip 
              label={request.status?.replace('_', ' ').toUpperCase()}
              size="small"
              sx={{ 
                backgroundColor: statusOptions.find(opt => opt.value === request.status)?.color || '#9e9e9e',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          </Box>
        </Box>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>New Status</InputLabel>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            label="New Status"
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: option.color 
                    }} 
                  />
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          label="Notes"
          multiline
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          placeholder="Add any notes about this status change (optional)"
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={loading || status === request.status}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestStatusUpdate;
