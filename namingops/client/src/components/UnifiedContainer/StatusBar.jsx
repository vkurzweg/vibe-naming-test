import React from 'react';
import { Row, Col, Button, Badge, Spinner } from 'react-bootstrap';
import './StatusBar.css';

const StatusBar = ({ role, context, isLoading, onQuickAction }) => {
  // Get contextual help text based on current context
  const getHelpText = () => {
    switch (context) {
      case 'overview':
        return 'Overview shows recent activity and key metrics for your role.';
      case 'requests':
        return role === 'submitter' 
          ? 'View and track your submitted naming requests.'
          : 'Browse all requests in the system.';
      case 'review':
        return 'Review pending requests and take action on submissions.';
      case 'submit':
        return 'Submit a new naming request using the configured form.';
      case 'archive':
        return 'Search through archived requests and approved names.';
      case 'guidelines':
        return 'Review naming guidelines and best practices.';
      case 'resources':
        return 'Access documentation, tools, and support resources.';
      case 'configure':
        return 'Manage system settings, forms, and user permissions.';
      case 'users':
        return 'Manage user accounts and role assignments.';
      case 'analytics':
        return 'View system analytics and performance metrics.';
      case 'collaboration':
        return 'Collaborate with team members on reviews.';
      default:
        return 'Use the navigation above to access different features.';
    }
  };

  // Get contextual actions based on current context and role
  const getContextualActions = () => {
    const actions = [];

    switch (context) {
      case 'overview':
        if (role === 'submitter') {
          actions.push({ label: 'Submit Request', action: 'submit', variant: 'primary' });
        } else {
          actions.push({ label: 'Review Queue', action: 'review', variant: 'primary' });
        }
        break;
      
      case 'requests':
        if (role === 'submitter') {
          actions.push({ label: 'Submit New', action: 'submit', variant: 'primary' });
        } else {
          actions.push({ label: 'Review Mode', action: 'review', variant: 'outline-primary' });
        }
        break;
      
      case 'review':
        if (role !== 'submitter') {
          actions.push({ label: 'Bulk Actions', action: 'bulk', variant: 'outline-secondary' });
          actions.push({ label: 'Export', action: 'export', variant: 'outline-secondary' });
        }
        break;
      
      case 'submit':
        actions.push({ label: 'Save Draft', action: 'draft', variant: 'outline-secondary' });
        actions.push({ label: 'Preview', action: 'preview', variant: 'outline-primary' });
        break;
      
      case 'archive':
        actions.push({ label: 'Advanced Search', action: 'search', variant: 'outline-primary' });
        actions.push({ label: 'Export Results', action: 'export', variant: 'outline-secondary' });
        break;
      
      case 'configure':
        if (role === 'admin') {
          actions.push({ label: 'New Form', action: 'newForm', variant: 'primary' });
          actions.push({ label: 'Backup', action: 'backup', variant: 'outline-secondary' });
        }
        break;
      
      default:
        break;
    }

    return actions;
  };

  // Get system status indicator
  const getSystemStatus = () => {
    if (isLoading) {
      return { text: 'Loading...', variant: 'secondary', icon: <Spinner size="sm" /> };
    }
    
    // In a real app, this would check actual system health
    return { text: 'System Operational', variant: 'success', icon: '✓' };
  };

  const helpText = getHelpText();
  const contextualActions = getContextualActions();
  const systemStatus = getSystemStatus();

  return (
    <div className="status-bar">
      <div className="status-bar-content">
        <Row className="align-items-center">
          {/* Help Text */}
          <Col xs={12} md={6} lg={7}>
            <div className="help-section">
              <span className="help-icon">💡</span>
              <span className="help-text typography-caption">
                {helpText}
              </span>
            </div>
          </Col>

          {/* System Status */}
          <Col xs={6} md={3} lg={2}>
            <div className="status-indicator">
              <Badge 
                bg={systemStatus.variant} 
                className="system-status-badge"
              >
                <span className="status-icon">{systemStatus.icon}</span>
                <span className="status-text typography-small">
                  {systemStatus.text}
                </span>
              </Badge>
            </div>
          </Col>

          {/* Contextual Actions */}
          <Col xs={6} md={3} lg={3}>
            <div className="contextual-actions">
              {contextualActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  size="sm"
                  onClick={() => onQuickAction(action.action)}
                  className="contextual-action-btn"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default StatusBar;
