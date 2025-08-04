import { createTheme } from '@mui/material/styles';
import newColorPalette from './newColorPalette';

// Professional Material-UI theme with dark mode default and new color palette
export const createProfessionalTheme = (mode = 'dark') => {
  const isDark = mode === 'dark';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? newColorPalette.primary.main : newColorPalette.primary.light,
        light: isDark ? newColorPalette.primary.light : newColorPalette.secondary.light,
        dark: isDark ? newColorPalette.primary.dark : newColorPalette.primary.main,
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? newColorPalette.secondary.main : newColorPalette.accent.main,
        light: isDark ? newColorPalette.secondary.light : newColorPalette.accent.light,
        dark: isDark ? newColorPalette.secondary.dark : newColorPalette.accent.dark,
        contrastText: '#ffffff',
      },
      success: {
        main: newColorPalette.status.approved,
        light: newColorPalette.accent.light,
        dark: newColorPalette.accent.dark,
      },
      warning: {
        main: newColorPalette.status.pending,
        light: newColorPalette.additional.skyBlue,
        dark: newColorPalette.secondary.main,
      },
      error: {
        // Using neutral gray instead of red for rejected status
        main: newColorPalette.neutral.main,
        light: newColorPalette.neutral.light,
        dark: newColorPalette.neutral.dark,
      },
      info: {
        main: newColorPalette.status.inProgress,
        light: newColorPalette.additional.lightBlue,
        dark: newColorPalette.secondary.dark,
      },
      background: {
        default: isDark ? '#121212' : '#ffffff',
        paper: isDark ? '#1e1e1e' : '#f5f5f7',
      },
      text: {
        primary: isDark ? '#ffffff' : newColorPalette.text.primary,
        secondary: isDark ? '#b3b3b3' : newColorPalette.text.secondary,
      },
      divider: isDark ? '#333' : '#e0e0e0',
      // Custom status colors using new palette
      status: {
        pending: newColorPalette.status.pending,
        inProgress: newColorPalette.status.inProgress,
        approved: newColorPalette.status.approved,
        rejected: newColorPalette.status.rejected,
        draft: newColorPalette.status.draft,
        new: newColorPalette.status.new,
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.6,
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.4,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    spacing: 8,
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
              : '0 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDark 
                ? '0 8px 30px rgba(0, 0, 0, 0.4)' 
                : '0 8px 30px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 24px',
            transition: 'all 0.2s ease-in-out',
          },
          contained: {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            fontWeight: 500,
            fontSize: '0.75rem',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
            color: isDark ? '#ffffff' : '#212121',
            boxShadow: isDark 
              ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
  });
};

// Status color helper
export const getStatusColor = (status, theme) => {
  const statusColors = {
    pending: theme.palette.warning.main,
    'in-progress': theme.palette.info.main,
    approved: theme.palette.success.main,
    rejected: theme.palette.error.main,
    draft: theme.palette.grey[500],
    new: theme.palette.secondary.main,
  };
  
  return statusColors[status] || theme.palette.grey[500];
};

// Status icon helper
export const getStatusIcon = (status) => {
  const statusIcons = {
    pending: '⏳',
    'in-progress': '🔄',
    approved: '✅',
    rejected: '❌',
    draft: '📝',
    new: '🆕',
  };
  
  return statusIcons[status] || '📄';
};

export default createProfessionalTheme;
