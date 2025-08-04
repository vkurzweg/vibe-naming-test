import React from 'react';
import { Box } from '@mui/material';
import ProfessionalAppBar from '../AppBar/ProfessionalAppBar';
import ResponsiveContainer from './ResponsiveContainer';

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
        <ResponsiveContainer fluid>
          {children}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default ProfessionalLayout;
