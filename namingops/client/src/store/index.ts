import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from '@/features/auth/authSlice';
import nameRequestReducer from '@/features/nameRequests/nameRequestSlice';
import uiReducer from '@/features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    nameRequests: nameRequestReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['nameRequests/setFilters', 'ui/setAlert'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['ui.alert'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
