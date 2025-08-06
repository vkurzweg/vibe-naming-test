import React, { useContext } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { ThemeContext } from '../ThemeIntegration/EnhancedThemeProvider';

const ThemeToggle = ({ sx = {}, ...props }) => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
      <IconButton 
        onClick={toggleTheme} 
        color={isDarkMode ? 'primary' : 'inherit'}
        sx={{ 
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'rotate(180deg)',
          },
          ...sx 
        }}
        {...props}
      >
        {isDarkMode ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
