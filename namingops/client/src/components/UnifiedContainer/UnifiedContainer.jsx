import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useEffectiveRole } from '../../hooks/useEffectiveRole';
import { getMyRequests } from '../../features/requests/requestsSlice';
import { loadActiveFormConfig } from '../../features/admin/formConfigSlice';
import ContextBar from './ContextBar';
import ContentArea from './ContentArea';
import StatusBar from './StatusBar';
import AudioFeedback from '../AudioFeedback/AudioFeedback';
import './UnifiedContainer.css';

const UnifiedContainer = () => {
  const dispatch = useDispatch();
  const effectiveRole = useEffectiveRole();
  const [currentContext, setCurrentContext] = useState('overview');
  const [keyMetrics, setKeyMetrics] = useState({});
  
  // Get data from Redux store
  const requests = useSelector(state => state.requests?.requests?.data || []);
  const isLoading = useSelector(state => state.requests?.isLoading || false);
  const activeFormConfig = useSelector(state => state.formConfig?.activeFormConfig);

  // Initialize data on mount and role change
  useEffect(() => {
    dispatch(getMyRequests());
    dispatch(loadActiveFormConfig());
  }, [dispatch, effectiveRole]);

  // Calculate key metrics based on role and data
  useEffect(() => {
    const calculateMetrics = () => {
      const total = requests.length;
      const pending = requests.filter(r => ['submitted', 'under_review'].includes(r.status)).length;
      const approved = requests.filter(r => r.status === 'approved').length;
      const urgent = requests.filter(r => {
        if (!r.createdAt) return false;
        const daysSinceCreated = Math.floor((Date.now() - new Date(r.createdAt)) / (1000 * 60 * 60 * 24));
        return daysSinceCreated > 5 && ['submitted', 'under_review'].includes(r.status);
      }).length;

      // Role-specific metrics
      switch (effectiveRole) {
        case 'admin':
          setKeyMetrics({
            total,
            pending,
            approved,
            urgent,
            systemHealth: 'Operational',
            activeUsers: 12, // Placeholder
          });
          break;
        case 'reviewer':
          setKeyMetrics({
            pending,
            urgent,
            approved,
            avgReviewTime: '2.3 days', // Placeholder
          });
          break;
        case 'submitter': {
          const myRequests = requests.filter(r => r.user?.id === 'current-user'); // Simplified
          setKeyMetrics({
            myTotal: myRequests.length,
            myPending: myRequests.filter(r => ['submitted', 'under_review'].includes(r.status)).length,
            myApproved: myRequests.filter(r => r.status === 'approved').length,
          });
          break;
        }
        default: {
          setKeyMetrics({});
          break;
        }
      }
    };

    calculateMetrics();
  }, [requests, effectiveRole]);

  // Handle context changes
  const handleContextChange = (newContext) => {
    setCurrentContext(newContext);
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch (action) {
      case 'submit':
        setCurrentContext('submit');
        break;
      case 'review':
        setCurrentContext('review');
        break;
      case 'configure':
        setCurrentContext('configure');
        break;
      case 'archive':
        setCurrentContext('archive');
        break;
      default:
        break;
    }
  };

  return (
    <div className="unified-container">
      <Container fluid className="h-100">
        {/* Header with role indicator and user info */}
        <Row className="header-row">
          <Col xs={12}>
            <div className="header-content">
              <div className="role-indicator">
                <span className="typography-small role-badge">
                  {effectiveRole?.charAt(0).toUpperCase() + effectiveRole?.slice(1)}
                </span>
              </div>
              <div className="app-title">
                <h1 className="typography-h2">NamingOps</h1>
              </div>
              <div className="user-info">
                <span className="typography-caption">Development User</span>
              </div>
            </div>
          </Col>
        </Row>

        {/* Context Bar */}
        <Row className="context-bar-row">
          <Col xs={12}>
            <ContextBar
              role={effectiveRole}
              currentContext={currentContext}
              keyMetrics={keyMetrics}
              onContextChange={handleContextChange}
              onQuickAction={handleQuickAction}
            />
          </Col>
        </Row>

        {/* Primary Content Area */}
        <Row className="content-row flex-grow-1">
          <Col xs={12} className="h-100">
            <ContentArea
              role={effectiveRole}
              context={currentContext}
              requests={requests}
              isLoading={isLoading}
              activeFormConfig={activeFormConfig}
              onContextChange={handleContextChange}
            />
          </Col>
        </Row>

        {/* Status Bar */}
        <Row className="status-bar-row">
          <Col xs={12}>
            <StatusBar
              role={effectiveRole}
              context={currentContext}
              isLoading={isLoading}
              onQuickAction={handleQuickAction}
            />
          </Col>
        </Row>
      </Container>

      {/* Audio Feedback Component */}
      <AudioFeedback />
    </div>
  );
};

export default UnifiedContainer;
