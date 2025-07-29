import React from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import theme from './theme';



// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitRequest from './pages/SubmitRequest';
import NotFound from './pages/NotFound';

// Features
import MyRequests from './features/requests/MyRequests';
import RequestDetails from './features/requests/RequestDetails';

// Google OAuth Client ID from environment variables
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1009058437445-s15inh3vb1dl1o1hcmg0nn9q6grr7n7h.apps.googleusercontent.com';

if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
  console.warn('Using default Google OAuth Client ID. For production, set REACT_APP_GOOGLE_CLIENT_ID in your .env file');
}
console.log('Using Google OAuth Client ID:', GOOGLE_CLIENT_ID);

// Protected Route Component - Development mode bypasses auth
const ProtectedRoute = ({ children, requiredRole }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Bypass auth in development
  if (isDevelopment) {
    console.warn('Development mode: Authentication bypassed');
    return children;
  }

  // Production behavior
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
   <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="requests/my-requests" element={<MyRequests />} />
            <Route path="requests/:id" element={<RequestDetails />} />
            <Route path="submit-request" element={
              <ProtectedRoute>
                <SubmitRequest />
              </ProtectedRoute>
            } /> 
            {/* Add more protected routes here */}
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}

export default App;
