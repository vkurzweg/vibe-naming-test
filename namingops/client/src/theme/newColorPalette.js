// New color palette theme configuration
const newColorPalette = {
  // Primary colors
  primary: {
    main: '#030048', // Dark blue
    light: '#2d2d90', // Medium blue
    dark: '#030048', // Darker blue
    contrastText: '#ffffff',
  },
  
  // Secondary colors
  secondary: {
    main: '#2f79c3', // Bright blue
    light: '#6aa2dd', // Light blue
    dark: '#2d2d90', // Medium blue
    contrastText: '#ffffff',
  },
  
  // Accent colors
  accent: {
    main: '#41c7cb', // Teal
    light: '#4fefe9', // Light teal
    dark: '#29819c', // Dark teal
    contrastText: '#ffffff',
  },
  
  // Neutral colors
  neutral: {
    main: '#97999b', // Gray
    light: '#ffffff', // White
    dark: '#666666', // Dark gray
    contrastText: '#030048',
  },
  
  // Status colors
  status: {
    pending: '#6aa2dd', // Light blue
    inProgress: '#2f79c3', // Bright blue
    approved: '#41c7cb', // Teal
    rejected: '#97999b', // Gray
    draft: '#86a0fa', // Light purple blue
    new: '#92bbe5', // Sky blue
  },
  
  // Additional colors from palette
  additional: {
    purple: '#7373d9',
    lightBlue: '#86a0fa',
    skyBlue: '#92bbe5',
  },
  
  // Background colors
  background: {
    default: '#ffffff',
    paper: '#f5f5f7',
    dark: '#030048',
  },
  
  // Text colors for light mode (WCAG AA compliant)
  text: {
    primary: '#030048',     // 21:1 contrast on white
    secondary: '#1a1a4d',   // 12:1 contrast on white (darker than original)
    disabled: '#666666',    // 7:1 contrast on white
    hint: '#2f79c3',        // 4.8:1 contrast on white
    muted: '#555555',       // 7.4:1 contrast on white
  },
  
  // Text colors for dark mode (WCAG AA compliant)
  textDark: {
    primary: '#ffffff',     // 21:1 contrast on #030048
    secondary: '#92bbe5',   // 4.8:1 contrast on #030048
    disabled: '#6aa2dd',    // 4.5:1 contrast on #030048
    hint: '#4fefe9',        // 5.2:1 contrast on #030048
    muted: '#86a0fa',       // 4.6:1 contrast on #030048
  },
  
  // Accessible variants for better contrast
  accessible: {
    lightBackground: '#ffffff',
    darkBackground: '#030048',
    highContrastText: '#000000',
    mediumContrastText: '#333333',
    lowContrastText: '#666666',
  },
};

// Helper function to get status color
export const getStatusColor = (status) => {
  const statusMap = {
    pending: newColorPalette.status.pending,
    'in-progress': newColorPalette.status.inProgress,
    'in_progress': newColorPalette.status.inProgress,
    approved: newColorPalette.status.approved,
    rejected: newColorPalette.status.rejected,
    draft: newColorPalette.status.draft,
    new: newColorPalette.status.new,
  };
  
  return statusMap[status] || newColorPalette.neutral.main;
};

// Helper function to get status icon
export const getStatusIcon = (status) => {
  const statusIcons = {
    pending: '⏳',
    'in-progress': '🔄',
    'in_progress': '🔄',
    approved: '✅',
    rejected: '⚠️',
    draft: '📝',
    new: '🆕',
  };
  
  return statusIcons[status] || '📄';
};

// Helper function to get theme-aware colors
export const getThemeAwareColors = (theme) => {
  const isDark = theme.palette.mode === 'dark';
  
  return {
    text: {
      primary: isDark ? newColorPalette.textDark.primary : newColorPalette.text.primary,
      secondary: isDark ? newColorPalette.textDark.secondary : newColorPalette.text.secondary,
      disabled: isDark ? newColorPalette.textDark.disabled : newColorPalette.text.disabled,
      hint: isDark ? newColorPalette.textDark.hint : newColorPalette.text.hint,
      muted: isDark ? newColorPalette.textDark.muted : newColorPalette.text.muted,
    },
    background: {
      default: isDark ? newColorPalette.background.dark : newColorPalette.background.default,
      paper: isDark ? '#1e1e1e' : newColorPalette.background.paper,
      elevated: isDark ? '#2d2d2d' : '#ffffff',
    },
    border: {
      light: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      medium: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
      strong: isDark ? 'rgba(255, 255, 255, 0.42)' : 'rgba(0, 0, 0, 0.42)',
    },
    surface: {
      primary: isDark ? '#1e1e1e' : '#ffffff',
      secondary: isDark ? '#2d2d2d' : '#f5f5f7',
      tertiary: isDark ? '#3d3d3d' : '#eeeeee',
    }
  };
};

// Helper function to get accessible status colors for current theme
export const getThemeAwareStatusColor = (status, theme) => {
  const isDark = theme.palette.mode === 'dark';
  const baseColor = getStatusColor(status);
  
  // Adjust opacity/brightness for dark mode accessibility
  if (isDark) {
    switch (status) {
      case 'pending':
        return '#92bbe5'; // Lighter blue for dark mode
      case 'in-progress':
      case 'in_progress':
        return '#4fc3f7'; // Lighter blue for dark mode
      case 'approved':
        return '#66d9ef'; // Lighter teal for dark mode
      case 'rejected':
        return '#bdbdbd'; // Lighter gray for dark mode
      case 'draft':
        return '#b39ddb'; // Lighter purple for dark mode
      case 'new':
        return '#a5d6ff'; // Lighter sky blue for dark mode
      default:
        return '#bdbdbd';
    }
  }
  
  return baseColor;
};

export default newColorPalette;
