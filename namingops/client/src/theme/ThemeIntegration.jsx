import React from 'react';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getStatusColor, getThemeAwareStatusColor } from './newColorPalette';

// Create a comprehensive Material UI theme that integrates with our foundational color palette
const createIntegratedTheme = (mode = 'light') => {
  const isDark = mode === 'dark';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2d2d90', // Primary blue from foundational palette
        light: '#5757b8',
        dark: '#1e1e63',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#6c5ce7', // Secondary purple
        light: '#a29bfe',
        dark: '#5f3dc4',
        contrastText: '#ffffff',
      },
      success: {
        main: '#00b894', // Green for approved status
        light: '#00cec9',
        dark: '#00a085',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#fdcb6e', // Orange for on-hold status
        light: '#ffeaa7',
        dark: '#e17055',
        contrastText: '#2d3436',
      },
      error: {
        main: '#e17055', // Red for rejected/cancelled status
        light: '#fab1a0',
        dark: '#d63031',
        contrastText: '#ffffff',
      },
      info: {
        main: '#74b9ff', // Blue for informational states
        light: '#a29bfe',
        dark: '#0984e3',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#1a1a1a' : '#fafafa',
        paper: isDark ? '#2d2d2d' : '#ffffff',
      },
      text: {
        primary: isDark ? '#ffffff' : '#030048', // Primary text from foundational palette
        secondary: isDark ? '#b0b0b0' : '#2d2d90', // Secondary text
        disabled: isDark ? '#666666' : '#a0a0a0',
      },
      divider: isDark ? '#404040' : '#e0e0e0',
      grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.01562em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.00833em',
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '0em',
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '0.00735em',
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: '0em',
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: '0.0075em',
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: '0.00938em',
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0.01071em',
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 600,
        lineHeight: 1.75,
        letterSpacing: '0.02857em',
        textTransform: 'none', // Disable uppercase transformation
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: '0.03333em',
      },
    },
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDark ? '#6b6b6b #2b2b2b' : '#c1c1c1 #f1f1f1',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              backgroundColor: isDark ? '#2b2b2b' : '#f1f1f1',
              width: 8,
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 8,
              backgroundColor: isDark ? '#6b6b6b' : '#c1c1c1',
              minHeight: 24,
              border: `2px solid ${isDark ? '#2b2b2b' : '#f1f1f1'}`,
            },
            '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
              backgroundColor: isDark ? '#959595' : '#a8a8a8',
            },
            '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
              backgroundColor: isDark ? '#959595' : '#a8a8a8',
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: isDark ? '#959595' : '#a8a8a8',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
            '&:focus': {
              boxShadow: '0 0 0 2px rgba(45, 45, 144, 0.2)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDark 
              ? '0 2px 8px rgba(0,0,0,0.3)' 
              : '0 2px 8px rgba(0,0,0,0.1)',
          },
          elevation1: {
            boxShadow: isDark 
              ? '0 1px 4px rgba(0,0,0,0.3)' 
              : '0 1px 4px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '0.75rem',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2d2d90',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2d2d90',
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            overflow: 'hidden',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#333333' : '#f8f9fa',
            '& .MuiTableCell-head': {
              fontWeight: 600,
              fontSize: '0.875rem',
              color: isDark ? '#ffffff' : '#2d2d90',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isDark ? '#404040' : '#f5f5f5',
            },
          },
        },
      },
      MuiStepper: {
        styleOverrides: {
          root: {
            padding: '16px 0',
          },
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          label: {
            fontSize: '0.875rem',
            fontWeight: 500,
            '&.Mui-active': {
              fontWeight: 600,
              color: '#2d2d90',
            },
            '&.Mui-completed': {
              color: '#00b894',
            },
          },
        },
      },
    },
    // Custom theme extensions
    custom: {
      statusColors: {
        draft: '#74b9ff',
        submitted: '#fdcb6e',
        under_review: '#a29bfe',
        final_review: '#6c5ce7',
        approved: '#00b894',
        rejected: '#e17055',
        on_hold: '#fd79a8',
        cancelled: '#636e72',
      },
      gradients: {
        primary: 'linear-gradient(135deg, #2d2d90 0%, #5757b8 100%)',
        success: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
        warning: 'linear-gradient(135deg, #fdcb6e 0%, #ffeaa7 100%)',
        error: 'linear-gradient(135deg, #e17055 0%, #fab1a0 100%)',
      },
      shadows: {
        soft: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
        medium: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.15)',
        strong: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.2)',
      },
    },
  });
};

// Theme integration component
const ThemeIntegration = ({ children, mode = 'light' }) => {
  const theme = createIntegratedTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

// Hook to access custom theme properties
export const useCustomTheme = () => {
  const theme = useTheme();
  return theme.custom || {};
};

// Utility function to get status color with theme awareness
export const getThemedStatusColor = (status, theme) => {
  return theme?.custom?.statusColors?.[status] || getStatusColor(status);
};

export default ThemeIntegration;
