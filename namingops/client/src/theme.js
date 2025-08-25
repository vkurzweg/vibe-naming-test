import { createTheme } from '@mui/material/styles';

// Define the color palette for light and dark modes
const lightPalette = {
  primary: {
    main: '#007AFF', // A vibrant blue for primary actions
  },
  secondary: {
    main: '#FF3B30', // A strong red for secondary actions or warnings
  },
  background: {
    default: '#F2F2F7', // A very light gray for the background
    paper: '#FFFFFF',   // White for paper elements
  },
  text: {
    primary: '#000000',
    secondary: '#6E6E73',
  },
};

const darkPalette = {
  primary: {
    main: '#0A84FF', // A slightly brighter blue for dark mode
  },
  secondary: {
    main: '#FF6961', // A brighter, accessible red for dark mode
  },
  background: {
    default: '#000000', // True black for the background
    paper: '#1C1C1E',   // A very dark gray for paper elements
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#8E8E93',
  },
};

// Common typography and component settings
const commonSettings = {
  typography: {
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 700, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 500, fontSize: '1.25rem' },
    h6: { fontWeight: 500, fontSize: '1rem' },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // More modern, rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '10px 20px',
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        background: 'transparent',
        root: {
          boxShadow: 'none',
        },
      },
    },
  },
};

// Function to create the theme
export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light' ? lightPalette : darkPalette),
    },
    ...commonSettings,
  });
