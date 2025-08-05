import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { getStatusColor } from '../../theme/newColorPalette';

// Material Design 3 Color Palette with Dark Mode as Default
const createMaterialTheme = (isDarkMode = true) => {
  const baseTheme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      // Material Design 3 Primary Colors
      primary: {
        main: isDarkMode ? '#BB86FC' : '#6200EE',
        light: isDarkMode ? '#E1BEE7' : '#9C4DCC',
        dark: isDarkMode ? '#985EFF' : '#3700B3',
        contrastText: isDarkMode ? '#000000' : '#FFFFFF',
      },
      // Material Design 3 Secondary Colors
      secondary: {
        main: isDarkMode ? '#03DAC6' : '#018786',
        light: isDarkMode ? '#66FFF9' : '#4DB6AC',
        dark: isDarkMode ? '#00A896' : '#00695C',
        contrastText: isDarkMode ? '#000000' : '#FFFFFF',
      },
      // Material Design 3 Background Colors
      background: {
        default: isDarkMode ? '#121212' : '#FAFAFA',
        paper: isDarkMode ? '#1E1E1E' : '#FFFFFF',
      },
      // Material Design 3 Surface Colors
      surface: {
        main: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        variant: isDarkMode ? '#2D2D2D' : '#F5F5F5',
      },
      // Material Design 3 Text Colors
      text: {
        primary: isDarkMode ? '#E1E1E1' : '#1C1B1F',
        secondary: isDarkMode ? '#B3B3B3' : '#49454F',
        disabled: isDarkMode ? '#666666' : '#B3B3B3',
      },
      // Material Design 3 Status Colors
      success: {
        main: isDarkMode ? '#4CAF50' : '#2E7D32',
        light: isDarkMode ? '#81C784' : '#4CAF50',
        dark: isDarkMode ? '#2E7D32' : '#1B5E20',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: isDarkMode ? '#FF9800' : '#ED6C02',
        light: isDarkMode ? '#FFB74D' : '#FF9800',
        dark: isDarkMode ? '#E65100' : '#C77700',
        contrastText: '#FFFFFF',
      },
      error: {
        main: isDarkMode ? '#F44336' : '#D32F2F',
        light: isDarkMode ? '#E57373' : '#F44336',
        dark: isDarkMode ? '#C62828' : '#B71C1C',
        contrastText: '#FFFFFF',
      },
      info: {
        main: isDarkMode ? '#2196F3' : '#0288D1',
        light: isDarkMode ? '#64B5F6' : '#2196F3',
        dark: isDarkMode ? '#1565C0' : '#01579B',
        contrastText: '#FFFFFF',
      },
      // Custom Status Colors for Requests
      status: {
        draft: isDarkMode ? '#9E9E9E' : '#757575',
        submitted: isDarkMode ? '#2196F3' : '#1976D2',
        under_review: isDarkMode ? '#FF9800' : '#F57C00',
        approved: isDarkMode ? '#4CAF50' : '#388E3C',
        rejected: isDarkMode ? '#F44336' : '#D32F2F',
        on_hold: isDarkMode ? '#9C27B0' : '#7B1FA2',
        cancelled: isDarkMode ? '#607D8B' : '#455A64',
      },
    },
    // Material Design 3 Typography
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      // Display styles
      h1: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '3.5rem',
        lineHeight: 1.17,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '2.75rem',
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '2.25rem',
        lineHeight: 1.22,
        letterSpacing: '0em',
      },
      h4: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '1.75rem',
        lineHeight: 1.29,
        letterSpacing: '0.0125em',
      },
      h5: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '1.5rem',
        lineHeight: 1.33,
        letterSpacing: '0em',
      },
      h6: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 500,
        fontSize: '1.25rem',
        lineHeight: 1.4,
        letterSpacing: '0.0125em',
      },
      // Body styles
      body1: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '1rem',
        lineHeight: 1.5,
        letterSpacing: '0.03125em',
      },
      body2: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '0.875rem',
        lineHeight: 1.43,
        letterSpacing: '0.01786em',
      },
      // Button and label styles
      button: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.75,
        letterSpacing: '0.02857em',
        textTransform: 'uppercase',
      },
      caption: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '0.75rem',
        lineHeight: 1.66,
        letterSpacing: '0.03333em',
      },
      overline: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 500,
        fontSize: '0.75rem',
        lineHeight: 2.66,
        letterSpacing: '0.08333em',
        textTransform: 'uppercase',
      },
    },
    // Material Design 3 Shape System
    shape: {
      borderRadius: 12, // Medium corner radius
    },
    spacing: 8, // 8px base spacing unit
    // Material Design 3 Component Overrides
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 20, // Pill shape for buttons
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 48,
            paddingX: 24,
            paddingY: 12,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDarkMode 
                ? '0 8px 24px rgba(187, 134, 252, 0.3)'
                : '0 8px 24px rgba(98, 0, 238, 0.2)',
            },
          },
          contained: {
            boxShadow: isDarkMode
              ? '0 4px 12px rgba(187, 134, 252, 0.2)'
              : '0 4px 12px rgba(98, 0, 238, 0.15)',
          },
          outlined: {
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            boxShadow: isDarkMode 
              ? '0 4px 20px rgba(0, 0, 0, 0.4)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
          },
          elevation1: {
            boxShadow: isDarkMode
              ? '0 2px 8px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.06)',
          },
          elevation2: {
            boxShadow: isDarkMode
              ? '0 4px 16px rgba(0, 0, 0, 0.35)'
              : '0 4px 16px rgba(0, 0, 0, 0.08)',
          },
          elevation3: {
            boxShadow: isDarkMode
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(0, 0, 0, 0.12)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: isDarkMode
                ? '0 12px 40px rgba(0, 0, 0, 0.5)'
                : '0 12px 40px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 500,
            height: 32,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.2s ease-in-out',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#BB86FC' : '#6200EE',
                borderWidth: 2,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#BB86FC' : '#6200EE',
                borderWidth: 2,
                boxShadow: isDarkMode
                  ? '0 0 0 4px rgba(187, 134, 252, 0.2)'
                  : '0 0 0 4px rgba(98, 0, 238, 0.1)',
              },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${isDarkMode ? '#2D2D2D' : '#E0E0E0'}`,
            padding: '16px',
          },
          head: {
            fontWeight: 600,
            backgroundColor: isDarkMode ? '#2D2D2D' : '#F5F5F5',
            color: isDarkMode ? '#E1E1E1' : '#1C1B1F',
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          },
        },
      },
    },
  });

  // Add Material Design 3 custom extensions
  return {
    ...baseTheme,
    custom: {
      // Status color helper
      getStatusColor: (status) => {
        const statusColors = baseTheme.palette.status;
        return statusColors[status] || statusColors.draft;
      },
      // Material Design 3 Gradients
      gradients: {
        primary: `linear-gradient(135deg, ${baseTheme.palette.primary.main} 0%, ${baseTheme.palette.primary.light} 100%)`,
        secondary: `linear-gradient(135deg, ${baseTheme.palette.secondary.main} 0%, ${baseTheme.palette.secondary.light} 100%)`,
        surface: isDarkMode
          ? `linear-gradient(135deg, #1E1E1E 0%, #2D2D2D 100%)`
          : `linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)`,
        background: isDarkMode
          ? `linear-gradient(135deg, #121212 0%, #1E1E1E 100%)`
          : `linear-gradient(135deg, #FAFAFA 0%, #FFFFFF 100%)`,
      },
      // Material Design 3 Shadows
      shadows: {
        card: isDarkMode
          ? '0 4px 20px rgba(0, 0, 0, 0.4)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        button: isDarkMode
          ? '0 4px 12px rgba(187, 134, 252, 0.2)'
          : '0 4px 12px rgba(98, 0, 238, 0.15)',
        modal: isDarkMode
          ? '0 24px 48px rgba(0, 0, 0, 0.6)'
          : '0 24px 48px rgba(0, 0, 0, 0.15)',
        bento: isDarkMode
          ? '0 8px 32px rgba(0, 0, 0, 0.5)'
          : '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      // Material Design 3 Animations
      animations: {
        fadeIn: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        slideUp: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        scaleIn: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      // Bento Grid System
      bento: {
        gap: 16,
        borderRadius: 16,
        padding: 24,
      },
    },
  };
};

const EnhancedThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Dark mode as default
  const theme = createMaterialTheme(isDarkMode);

  // Theme toggle function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Provide theme toggle context
  useEffect(() => {
    // Store theme preference
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'true');
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          // Material Design 3 Keyframe Animations
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
          '@keyframes slideUp': {
            from: { 
              opacity: 0, 
              transform: 'translateY(32px)' 
            },
            to: { 
              opacity: 1, 
              transform: 'translateY(0)' 
            },
          },
          '@keyframes scaleIn': {
            from: { 
              opacity: 0, 
              transform: 'scale(0.8)' 
            },
            to: { 
              opacity: 1, 
              transform: 'scale(1)' 
            },
          },
          '@keyframes bounce': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
            '100%': { transform: 'scale(1)' },
          },
          // Material Design 3 Global Styles
          html: {
            scrollBehavior: 'smooth',
            fontFamily: theme.typography.fontFamily,
          },
          body: {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
            margin: 0,
            padding: 0,
            overflowX: 'hidden',
          },
          // Accessibility improvements
          '.sr-only': {
            position: 'absolute !important',
            width: '1px !important',
            height: '1px !important',
            padding: '0 !important',
            margin: '-1px !important',
            overflow: 'hidden !important',
            clip: 'rect(0, 0, 0, 0) !important',
            whiteSpace: 'nowrap !important',
            border: '0 !important',
          },
          // Focus improvements for accessibility
          '*:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main} !important`,
            outlineOffset: '2px !important',
            borderRadius: '4px !important',
          },
          // Custom scrollbar for Material Design 3
          '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '::-webkit-scrollbar-track': {
            background: isDarkMode ? '#2D2D2D' : '#F5F5F5',
            borderRadius: '4px',
          },
          '::-webkit-scrollbar-thumb': {
            background: isDarkMode ? '#BB86FC' : '#6200EE',
            borderRadius: '4px',
            '&:hover': {
              background: isDarkMode ? '#E1BEE7' : '#9C4DCC',
            },
          },
          // Bento Grid Animation Classes
          '.bento-item': {
            animation: `${theme.custom.animations.fadeIn}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.custom.shadows.bento,
            },
          },
          // Status indicator animations
          '.status-indicator': {
            animation: `${theme.custom.animations.scaleIn}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              animation: `${theme.custom.animations.bounce}`,
            },
          },
        }}
      />
      {children}
    </ThemeProvider>
  );
};

// Export theme toggle context
export const ThemeContext = React.createContext({
  isDarkMode: true,
  toggleTheme: () => {},
});

export default EnhancedThemeProvider;
