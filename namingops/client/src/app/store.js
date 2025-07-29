import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import { thunk } from 'redux-thunk';
import namingReducer from '../features/naming/namingSlice';
import authReducer from '../features/auth/authSlice';

// Configuration for persisting the Redux store
const persistConfig = {
  key: 'root',
  storage,
  // Only persist these reducers
  whitelist: ['auth'], // Don't persist naming state as it contains temporary form data
  // Optionally blacklist specific actions from triggering persistence
  // blacklist: ['naming/submitNamingRequest/fulfilled']
};

// Combine all reducers
const rootReducer = combineReducers({
  naming: namingReducer,
  auth: authReducer,
  // Add other reducers here
});

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store with middleware
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from the serializable check
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
      // Disable thunk since it's already included by default
      thunk: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create the persistor
const persistor = persistStore(store);

export { store, persistor };

// Export the RootState and AppDispatch types
export const selectNamingState = (state) => state.naming;
export const selectAuthState = (state) => state.auth;

// Re-export the naming slice actions for easier imports
export * from '../features/naming/namingSlice';

// If you have any custom hooks, export them here
export * from './hooks';
