import React, { useState, useEffect, useContext } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { DevRoleContext } from '../../context/DevRoleContext';

// Create a ThemeContext for toggling between dark and light mode
export const ThemeContext = React.createContext({
  isDarkMode: true,
  toggleTheme: () => {},
});

// Helper function to get role-based colors
const getRoleBasedColors = (role, isDarkMode) => {
  console.log(`Getting colors for role: ${role}, isDarkMode: ${isDarkMode}`);
  
  switch (role) {
    case 'submitter':
      return {
        main: isDarkMode ? '#6EB4FF' : '#0e61ba',
        light: isDarkMode ? '#9ECFFF' : '#3C85D8',
        dark: isDarkMode ? '#4A99F8' : '#0A4C94',
        name: 'Associate'
      };
    case 'reviewer':
      return {
        main: isDarkMode ? '#41c7cb' : '#29819c',
        light: isDarkMode ? '#65DEE2' : '#4A9BB8',
        dark: isDarkMode ? '#35A4A7' : '#1F6B7A',
        name: 'Reviewer'
      };
    case 'admin':
      return {
        main: isDarkMode ? '#7373d9' : '#7373d9', // Using #7373d9 for both modes per user request
        light: isDarkMode ? '#9191E9' : '#9191E9',
        dark: isDarkMode ? '#5A5AB9' : '#5A5AB9',
        name: 'Admin'
      };
    default:
      // Default to submitter/associate
      return {
        main: isDarkMode ? '#6EB4FF' : '#0e61ba',
        light: isDarkMode ? '#9ECFFF' : '#3C85D8',
        dark: isDarkMode ? '#4A99F8' : '#0A4C94',
        name: 'Associate'
      };
  }
};

// Material Design 3 Color Palette with Dark Mode as Default
const createMaterialTheme = (isDarkMode = true, role = 'submitter') => {
  console.log(`Creating theme with role: ${role}, isDarkMode: ${isDarkMode}`);
  
  // Get role-specific colors
  const roleColors = getRoleBasedColors(role, isDarkMode);
  console.log('Role colors:', roleColors);
  
  return createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      // Material Design 3 Primary Colors (now based on role)
      primary: {
        main: roleColors.main,
        light: roleColors.light,
        dark: roleColors.dark,
        contrastText: isDarkMode ? '#000000' : '#FFFFFF',
      },
      // Material Design 3 Secondary Colors (now based on role)
      secondary: {
        main: roleColors.main,
        light: roleColors.light,
        dark: roleColors.dark,
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
      // Role-specific colors
      role: roleColors,
    },
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
        fontSize: '0.625rem',
        lineHeight: 2.66,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      },
    },
    shape: {
      borderRadius: 4,
    },
    spacing: (factor) => `${0.25 * factor}rem`, // 0.25rem base unit for spacing
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
    // Customize MUI components
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDarkMode ? '#6B6B6B transparent' : '#DDDDDD transparent',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              backgroundColor: 'transparent',
              width: '0.5rem',
              height: '0.5rem',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: '0.5rem',
              backgroundColor: isDarkMode ? '#6B6B6B' : '#DDDDDD',
              minHeight: 24,
            },
            '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
              backgroundColor: isDarkMode ? '#909090' : '#BBBBBB',
            },
            '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
              backgroundColor: isDarkMode ? '#909090' : '#BBBBBB',
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: isDarkMode ? '#909090' : '#BBBBBB',
            },
            '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
              backgroundColor: 'transparent',
            },
          },
          // Apply Bootstrap-like container padding to improve responsive layout
          '.dashboard-container': {
            paddingRight: 'calc(var(--bs-gutter-x) * 3)',
            paddingLeft: 'calc(var(--bs-gutter-x) * 3)',
          },
          // Match AppBar padding with dashboard container
          '.MuiToolbar-root': {
            paddingRight: 'calc(var(--bs-gutter-x) * 3)',
            '& .MuiBox-root': {
              '&:first-of-type': {  // Logo container
                paddingLeft: 'calc(var(--bs-gutter-x) * 3)',
              },
            },
          },
          // Avatar padding
          '.user-avatar': {
            paddingRight: 'calc(var(--bs-gutter-x) * 3)',
          },
        },
      },
      // Button styling based on role colors
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: '0.25rem',
            padding: '0.5rem 1rem',
            boxSizing: 'border-box',
            minHeight: '2rem',
            fontSize: '0.875rem',
          },
          containedPrimary: {
            backgroundColor: roleColors.main,
            color: isDarkMode ? '#000000' : '#FFFFFF',
            '&:hover': {
              backgroundColor: roleColors.dark,
            },
          },
          outlinedPrimary: {
            borderColor: roleColors.main,
            color: roleColors.main,
            '&:hover': {
              backgroundColor: `${roleColors.main}11`,
            },
          },
          textPrimary: {
            color: roleColors.main,
          },
        },
      },
      // Tab styling based on role colors
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            minWidth: '100px',
            padding: '0.75rem 1rem',
            borderRadius: '0.25rem 0.25rem 0 0',
            '&.Mui-selected': {
              color: roleColors.main,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: roleColors.main,
          },
        },
      },
      // Checkbox styling based on role colors
      MuiCheckbox: {
        styleOverrides: {
          colorPrimary: {
            '&.Mui-checked': {
              color: roleColors.main,
            },
          },
        },
      },
      // Switch styling based on role colors
      MuiSwitch: {
        styleOverrides: {
          colorPrimary: {
            '&.Mui-checked': {
              '& + .MuiSwitch-track': {
                backgroundColor: roleColors.main,
                opacity: 0.5,
              },
              color: roleColors.main,
            },
          },
        },
      },
      // Radio styling based on role colors
      MuiRadio: {
        styleOverrides: {
          colorPrimary: {
            '&.Mui-checked': {
              color: roleColors.main,
            },
          },
        },
      },
      // Chip styling based on role colors
      MuiChip: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: roleColors.main,
            color: isDarkMode ? '#000000' : '#FFFFFF',
          },
          outlinedPrimary: {
            borderColor: roleColors.main,
            color: roleColors.main,
          },
        },
      },
      // Avatar styling
      MuiAvatar: {
        styleOverrides: {
          colorDefault: {
            backgroundColor: roleColors.main,
            color: isDarkMode ? '#000000' : '#FFFFFF',
          },
        },
      },
      // Paper styling for better shadowing and borders
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: isDarkMode 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)' 
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
          elevation2: {
            boxShadow: isDarkMode 
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' 
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      // Dialog styling for better content organization
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '0.5rem',
            boxShadow: isDarkMode 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        },
      },
      // Input styling for consistent borders and focus states
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '0.25rem',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: roleColors.main,
              borderWidth: 2,
            },
          },
        },
      },
      // Form label styling to match focused state with role color
      MuiFormLabel: {
        styleOverrides: {
          root: {
            '&.Mui-focused': {
              color: roleColors.main,
            },
          },
        },
      },
      // AppBar styling
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            boxShadow: 'none',
            borderBottom: `1px solid ${isDarkMode ? '#333333' : '#E0E0E0'}`,
          },
        },
      },
    },
  });
};

const EnhancedThemeProvider = ({ children }) => {
  // Add a fallback for when DevRoleContext is null
  const devRoleContext = useContext(DevRoleContext) || { role: 'submitter' };
  const { role } = devRoleContext;
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [theme, setTheme] = useState(createMaterialTheme(true, role || 'submitter'));

  // Create the theme toggle function
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Effect to update theme when dark mode or role changes
  useEffect(() => {
    console.log(`Updating theme with role: ${role}, isDarkMode: ${isDarkMode}`);
    setTheme(createMaterialTheme(isDarkMode, role || 'submitter'));
  }, [isDarkMode, role]);
  
  // Combine ThemeContext with ThemeProvider
  const themeContextValue = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles 
          styles={{
            '.dashboard-container': {
              paddingRight: 'calc(var(--bs-gutter-x) * 3)',
              paddingLeft: 'calc(var(--bs-gutter-x) * 3)',
            },
          }} 
        />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default EnhancedThemeProvider;
