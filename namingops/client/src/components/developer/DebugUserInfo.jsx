import React from 'react';
import { Box, Typography } from '@mui/material';
import { useSelector } from 'react-redux';

const DebugUserInfo = () => {
  const { user } = useSelector((state) => state.auth);
  const localStorageUser = localStorage.getItem('user');
  const localStorageToken = localStorage.getItem('token');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>Debug Info (Development Only)</Typography>
      <Typography variant="body2" component="div">
        <strong>Redux User:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '8px' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>LocalStorage User:</strong> {localStorageUser || 'Not found'}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>Token:</strong> {localStorageToken ? 'Token exists' : 'No token found'}
      </Typography>
    </Box>
  );
};

export default DebugUserInfo;
