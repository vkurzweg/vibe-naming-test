import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';

// Create the Redux store with all reducers
const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['ui/setAlert'],
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['ui.alert'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Export the store's dispatch and selector hooks
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

export default store;
