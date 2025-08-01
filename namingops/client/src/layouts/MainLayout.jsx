import React from 'react';
import { Box, CssBaseline, Container, Toolbar, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AppBar from './AppBar';

const MainLayout = () => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          backgroundColor: theme.palette.background.default,
          p: { xs: 2, sm: 3 },
          pt: { xs: 8, sm: 10 },
        }}
      >
        <Container maxWidth="xl" sx={{ height: '100%' }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
