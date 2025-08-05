import React from 'react';
import { useSelector } from 'react-redux';
import { useEffectiveRole } from '../../hooks/useEffectiveRole';
import ProfessionalLayout from '../Layout/ProfessionalLayout';
import ProfessionalSubmitterDashboard from '../../pages/dashboards/ProfessionalSubmitterDashboard';
import ProfessionalReviewerDashboard from '../../pages/dashboards/ProfessionalReviewerDashboard';
import ProfessionalAdminDashboard from '../../pages/dashboards/ProfessionalAdminDashboard';

const ProfessionalDashboardRouter = () => {
  const effectiveRole = useEffectiveRole();

  const renderDashboard = () => {
    switch (effectiveRole) {
      case 'submitter':
        return <ProfessionalSubmitterDashboard />;
      case 'reviewer':
        return <ProfessionalReviewerDashboard />;
      case 'admin':
        return <ProfessionalAdminDashboard />;
      default:
        return <ProfessionalSubmitterDashboard />;
    }
  };

  return (
    <ProfessionalLayout>
      {renderDashboard()}
    </ProfessionalLayout>
  );
};

export default ProfessionalDashboardRouter;
