import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, TextField, Button, List, ListItem, ListItemText, Divider, CircularProgress } from '@mui/material';
import { searchRequests } from '../features/requests/requestsSlice';
import { Link as RouterLink } from 'react-router-dom';

const Archive = () => {
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();
  const { requests, loading } = useSelector((state) => state.requests);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      dispatch(searchRequests(query));
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 900, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Search Approved Names
      </Typography>
      <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          Search
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {requests.map((request, index) => (
            <React.Fragment key={request._id}>
              <ListItem button component={RouterLink} to={`/requests/${request._id}`}>
                <ListItemText
                  primary={request.title}
                  secondary={`Submitted on: ${new Date(request.createdAt).toLocaleDateString()}`}
                />
              </ListItem>
              {index < requests.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default Archive;
