import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Layout
  isSidebarOpen: true,
  theme: 'light', // 'light' or 'dark'
  
  // Navigation
  activeView: 'dashboard',
  expandedMenus: {},
  
  // Notifications
  snackbar: {
    open: false,
    message: '',
    severity: 'info', // 'error', 'warning', 'info', 'success'
  },
  
  // Loading states
  isLoading: false,
  loadingMessage: '',
  
  // Alert dialog
  alert: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Layout
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    // Navigation
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    toggleMenu: (state, action) => {
      const menu = action.payload;
      state.expandedMenus = {
        ...state.expandedMenus,
        [menu]: !state.expandedMenus[menu]
      };
    },
    setExpandedMenus: (state, action) => {
      state.expandedMenus = action.payload;
    },
    
    // Notifications
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'info',
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
    
    // Loading states
    setLoading: (state, action) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || '';
    },
    
    // Alert dialog
    setAlert: (state, action) => {
      state.alert = action.payload;
    },
    clearAlert: (state) => {
      state.alert = null;
    },
  },
});

export const {
  // Layout
  toggleSidebar,
  setTheme,
  
  // Navigation
  setActiveView,
  toggleMenu,
  setExpandedMenus,
  
  // Notifications
  showSnackbar,
  hideSnackbar,
  
  // Loading states
  setLoading,
  
  // Alert dialog
  setAlert,
  clearAlert,
} = uiSlice.actions;

// Layout
export const selectUI = (state) => state.ui;
export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen;
export const selectTheme = (state) => state.ui.theme;

// Navigation
export const selectActiveView = (state) => state.ui.activeView;
export const selectExpandedMenus = (state) => state.ui.expandedMenus;

// Notifications
export const selectSnackbar = (state) => state.ui.snackbar;

// Loading states
export const selectIsLoading = (state) => state.ui.isLoading;
export const selectLoadingMessage = (state) => state.ui.loadingMessage;

// Alert dialog
export const selectAlert = (state) => state.ui.alert;

export default uiSlice.reducer;
