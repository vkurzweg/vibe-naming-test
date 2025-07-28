import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.background.default,
      }}
    >
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
        }}
      >
        {children}
      </Box>
      
      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          textAlign: 'center',
          color: 'text.secondary',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.background.default,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <small>© {new Date().getFullYear()} NamingOps. All rights reserved.</small>
      </Box>
    </Box>
  );
};

export default AuthLayout;
