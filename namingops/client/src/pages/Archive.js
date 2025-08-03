import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, TextField, List, ListItem, ListItemText, Divider, CircularProgress, Alert } from '@mui/material';
import { fetchApprovedRequests, selectAllRequests, selectIsLoading, selectError } from '../features/requests/requestsSlice';
import { Link as RouterLink } from 'react-router-dom';

const Archive = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useDispatch();

  const allApprovedRequests = useSelector(selectAllRequests);
  const loading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  useEffect(() => {
    dispatch(fetchApprovedRequests());
  }, [dispatch]);

  const filteredRequests = useMemo(() => {
    if (!searchTerm) {
      return allApprovedRequests;
    }
    return allApprovedRequests.filter(request => 
      request.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allApprovedRequests]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error.message || 'Failed to load the archive.'}</Alert>;
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 900, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Approved Names Archive
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        label="Search by title..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <List>
        {filteredRequests.map((request, index) => (
          <React.Fragment key={request._id}>
            <ListItem button component={RouterLink} to={`/requests/${request._id}`}>
              <ListItemText
                primary={request.title}
                secondary={`Approved on: ${new Date(request.updatedAt).toLocaleDateString()}`}
              />
            </ListItem>
            {index < filteredRequests.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default Archive;
