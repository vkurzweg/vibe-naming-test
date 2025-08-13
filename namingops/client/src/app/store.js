import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import  thunk  from 'redux-thunk';
import namingReducer from '../features/naming/namingSlice';
import authReducer from '../features/auth/authSlice';
import reviewReducer from '../features/review/reviewSlice';
import requestsReducer from '../features/requests/requestsSlice';
import formConfigReducer from '../features/formConfig/formConfigSlice'; // Import the new reducer
import { errorMiddleware } from '../middleware/errorMiddleware';

// Configuration for persisting the Redux store
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist the auth slice
  // Add any other persist configuration options here
};

// Combine all reducers
const rootReducer = combineReducers({
  naming: namingReducer,
  auth: authReducer,
  review: reviewReducer,
  requests: requestsReducer,
  formConfig: formConfigReducer, // Add the new reducer to the store
  // Add other reducers here
});

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store with middleware
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.config',
          'payload.request',
          'payload.headers',
          'error',
          'meta.arg',
          'register',
          'rehydrate',
        ],
        // Ignore these paths in the state
        ignoredPaths: ['register', 'rehydrate'],
      },
      thunk: {
        // Add any extra arguments for thunks here
        extraArgument: {},
      },
    }).concat([thunk, errorMiddleware]),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create the persistor
export const persistor = persistStore(store);

// Utility selectors
export const selectNamingState = (state) => state.naming;
export const selectAuthState = (state) => state.auth;
export const selectReviewState = (state) => state.review;
export const selectRequestsState = (state) => state.requests;
export const selectFormConfigState = (state) => state.formConfig; // Add a new utility selector

// Re-export slice actions for easier imports
export * from '../features/naming/namingSlice';

// Export any custom hooks
export * from './hooks';