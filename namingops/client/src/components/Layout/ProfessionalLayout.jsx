import React from 'react';
import { Box, Container } from '@mui/material';
import ProfessionalAppBar from '../AppBar/ProfessionalAppBar';

const ProfessionalLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <ProfessionalAppBar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.default',
          width: '100%',
          overflow: 'auto'
        }}
      >
        <Container 
          maxWidth={false} 
          sx={{ 
            height: '100%',
            width: '100%',
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default ProfessionalLayout;
