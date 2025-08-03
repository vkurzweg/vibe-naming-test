import React from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';


// Layouts
import CombinedLayout from './layouts/CombinedLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';

import SubmitRequest from './pages/SubmitRequest';
import NotFound from './pages/NotFound';
import Archive from './pages/Archive';
import FormConfigPage from './pages/FormConfigPage';
import UsersPage from './pages/UsersPage';
import ReviewQueue from './pages/ReviewQueue';

// Features
import MyRequests from './features/requests/MyRequests';
import RequestDetails from './pages/RequestDetails';
import DashboardRedirect from './components/DashboardRedirect';

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
    <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/unauthorized" element={<div>Unauthorized - You don&apos;t have permission to view this page</div>} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <CombinedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRedirect />} />
          <Route path="my-requests" element={<MyRequests />} />
          <Route path="requests/:id" element={<RequestDetails />} />
          
          {/* Submitter Routes */}
          <Route 
            path="submit-request" 
            element={
              <ProtectedRoute requiredRole="submitter">
                <SubmitRequest />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route path="admin">
            <Route 
              path="form-config" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <FormConfigPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <UsersPage />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Reviewer Routes */}
          <Route 
            path="review-queue" 
            element={
              <ProtectedRoute requiredRole={['admin', 'reviewer']}>
                <ReviewQueue />
              </ProtectedRoute>
            } 
          />
          
          {/* Archive - Accessible to all authenticated users */}
          <Route path="archive" element={<Archive />} />
          
          {/* 404 for any undefined routes under / */}
          <Route path="*" element={<Navigate to="/my-requests" replace />} />
        </Route>
        
        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

export default App;
