import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarOpen: true,
  alert: null,
  theme: 'light', // 'light' or 'dark'
  isLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setAlert: (state, action) => {
      state.alert = action.payload;
    },
    clearAlert: (state) => {
      state.alert = null;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setAlert,
  clearAlert,
  setTheme,
  setLoading,
} = uiSlice.actions;

export const selectUI = (state) => state.ui;
export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen;
export const selectAlert = (state) => state.ui.alert;
export const selectTheme = (state) => state.ui.theme;
export const selectIsLoading = (state) => state.ui.isLoading;

export default uiSlice.reducer;
