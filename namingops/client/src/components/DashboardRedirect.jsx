import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const DashboardRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  const currentRole = user?.role || 'submitter';

  switch (currentRole) {
    case 'admin':
      return <Navigate to="/review-queue" replace />;
    case 'reviewer':
      return <Navigate to="/review-queue" replace />;
    case 'submitter':
    default:
      return <Navigate to="/my-requests" replace />;
  }
};

export default DashboardRedirect;
