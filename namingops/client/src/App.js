import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Bootstrap CSS - CRITICAL for React Bootstrap components to work
import 'bootstrap/dist/css/bootstrap.min.css';

import { DevRoleProvider } from './context/DevRoleContext';
import { useSelector } from 'react-redux';
import { useEffectiveRole } from './hooks/useEffectiveRole';

// Enhanced Theme Provider
import EnhancedThemeProvider from './components/ThemeIntegration/EnhancedThemeProvider';

// React Query Provider
import QueryProvider from './providers/QueryProvider';

// Professional Dashboard Router
import ProfessionalDashboardRouter from './components/DashboardRouter/ProfessionalDashboardRouter';

// Layouts (keep for auth)
import AuthLayout from './layouts/AuthLayout';

// Pages (keep for auth and 404)
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Legacy components for specific routes
import SubmitRequest from './pages/SubmitRequest';
import UsersPage from './pages/UsersPage';
import FormConfigPage from './pages/FormConfigPage';

// Google OAuth Client ID from environment variables
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1009058437445-s15inh3vb1dl1o1hcmg0nn9q6grr7n7h.apps.googleusercontent.com';

if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
  console.warn('Using default Google OAuth Client ID. For production, set REACT_APP_GOOGLE_CLIENT_ID in your .env file');
}
console.log('Using Google OAuth Client ID:', GOOGLE_CLIENT_ID);

// Protected Route Component - Role-based access control
const ProtectedRoute = ({ children, requiredRole }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { isAuthenticated } = useSelector((state) => state.auth);
  const role = useEffectiveRole();

  console.log('ProtectedRoute - Current user role:', role, 'Required role:', requiredRole);

  // In development mode, we bypass authentication and are more permissive with roles
  if (isDevelopment) {
    console.log('Development mode: Authentication bypassed, flexible role-based access');
    
    // If no role is required, grant access
    if (!requiredRole) {
      console.log('No role required, granting access');
      return children;
    }
    
    // Check if user has required role (support both string and array)
    const hasRequiredRole = Array.isArray(requiredRole) 
      ? requiredRole.includes(role)
      : requiredRole === role;
    
    if (hasRequiredRole) {
      console.log('User has required role, granting access');
      return children;
    } else {
      console.log('User does not have required role, denying access');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Production mode - strict authentication and role checking
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If no role is required, just check authentication
  if (!requiredRole) {
    console.log('No role required, user is authenticated, granting access');
    return children;
  }

  // Check if user has required role (support both string and array)
  const hasRequiredRole = Array.isArray(requiredRole) 
    ? requiredRole.includes(role)
    : requiredRole === role;

  if (!hasRequiredRole) {
    console.log('User does not have required role, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('User has required role, granting access');
  return children;
};

const App = () => {
  return (
    <QueryProvider>
      <EnhancedThemeProvider>
        <DevRoleProvider>
          <AppRoutes />
        </DevRoleProvider>
      </EnhancedThemeProvider>
    </QueryProvider>
  );
};

function AppRoutes() {
  return (
    <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/unauthorized" element={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh',
            fontFamily: 'var(--font-family-primary)',
            color: 'var(--color-text-primary)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h1 className="typography-h2" style={{ marginBottom: '16px' }}>Unauthorized</h1>
              <p className="typography-body">You don&apos;t have permission to view this page</p>
            </div>
          </div>
        } />
        
        {/* Main Application - Professional Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProfessionalDashboardRouter />
            </ProtectedRoute>
          }
        />
        
        {/* Dashboard routes - all redirect to main dashboard */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/my-requests" element={<Navigate to="/" replace />} />
        <Route path="/review-queue" element={<Navigate to="/" replace />} />
        <Route path="/archive" element={<Navigate to="/" replace />} />
        
        {/* Redirect specific functional routes to main dashboard */}
        <Route path="/submit-request" element={<Navigate to="/" replace />} />
        
        {/* Admin routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/form-config"
          element={
            <ProtectedRoute requiredRole="admin">
              <FormConfigPage />
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

export default App;
