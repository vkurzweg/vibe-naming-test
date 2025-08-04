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
  
  // Text colors
  text: {
    primary: '#030048',
    secondary: '#2d2d90',
    disabled: '#97999b',
    hint: '#6aa2dd',
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

export default newColorPalette;
