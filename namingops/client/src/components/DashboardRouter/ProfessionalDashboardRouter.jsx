import React from 'react';
import { useEffectiveRole } from '../../hooks/useEffectiveRole';
import ProfessionalLayout from '../Layout/ProfessionalLayout';
import ProfessionalSubmitterDashboard from '../../pages/dashboards/ProfessionalSubmitterDashboard';
import ProfessionalReviewerDashboard from '../../pages/dashboards/ProfessionalReviewerDashboard';
import ProfessionalAdminDashboard from '../../pages/dashboards/ProfessionalAdminDashboard';

const ProfessionalDashboardRouter = () => {
  const effectiveRole = useEffectiveRole();
  
  // Route to appropriate dashboard based on role
  const getDashboardComponent = () => {
    switch (effectiveRole) {
      case 'submitter':
        return <ProfessionalSubmitterDashboard />;
      case 'reviewer':
        return <ProfessionalReviewerDashboard />;
      case 'admin':
        return <ProfessionalAdminDashboard />;
      default:
        // Fallback to submitter dashboard
        return <ProfessionalSubmitterDashboard />;
    }
  };

  return (
    <ProfessionalLayout>
      {getDashboardComponent()}
    </ProfessionalLayout>
  );
};

export default ProfessionalDashboardRouter;
