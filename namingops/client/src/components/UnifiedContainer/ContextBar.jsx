import React from 'react';
import { Row, Col, Button, Badge } from 'react-bootstrap';
import {
  Dashboard,
  Assignment,
  Archive,
  RateReview,
  Settings,
  People,
  Analytics,
  MenuBook,
  Add,
  LibraryBooks,
  Group,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import './ContextBar.css';

const ContextBar = ({ role, currentContext, keyMetrics, onContextChange, onQuickAction }) => {
  // Define context options based on role
  const getContextOptions = () => {
    const baseOptions = [
      { key: 'overview', label: 'Overview', icon: '📊' },
      { key: 'requests', label: 'My Requests', icon: '📝' },
      { key: 'archive', label: 'Archive', icon: '🗃️' },
    ];

    switch (role) {
      case 'admin':
        return [
          ...baseOptions,
          { key: 'review', label: 'Review Queue', icon: '⚖️' },
          { key: 'configure', label: 'System Config', icon: '⚙️' },
          { key: 'users', label: 'User Management', icon: '👥' },
          { key: 'analytics', label: 'Analytics', icon: '📈' },
        ];
      case 'reviewer':
        return [
          ...baseOptions,
          { key: 'review', label: 'Review Queue', icon: '⚖️' },
          { key: 'resources', label: 'Resources', icon: '📚' },
          { key: 'collaboration', label: 'Team', icon: '🤝' },
        ];
      case 'submitter':
      default:
        return [
          ...baseOptions,
          { key: 'guidelines', label: 'Guidelines', icon: '📋' },
          { key: 'submit', label: 'Submit Request', icon: '➕' },
        ];
    }
  };

  // Render key metrics based on role
  const renderMetrics = () => {
    switch (role) {
      case 'admin':
        return (
          <>
            <div className="metric-item">
              <span className="metric-value typography-h3">{keyMetrics.total || 0}</span>
              <span className="metric-label typography-small">Total Requests</span>
            </div>
            <div className="metric-item">
              <span className="metric-value typography-h3">{keyMetrics.pending || 0}</span>
              <span className="metric-label typography-small">Pending Review</span>
            </div>
            <div className="metric-item urgent">
              <span className="metric-value typography-h3">{keyMetrics.urgent || 0}</span>
              <span className="metric-label typography-small">Urgent</span>
            </div>
            <div className="metric-item">
              <span className="metric-value typography-h3">{keyMetrics.approved || 0}</span>
              <span className="metric-label typography-small">Approved</span>
            </div>
            <div className="metric-item">
              <Badge bg="success" className="system-status">
                {keyMetrics.systemHealth || 'Unknown'}
              </Badge>
              <span className="metric-label typography-small">System Status</span>
            </div>
          </>
        );
      case 'reviewer':
        return (
          <>
            <div className="metric-item">
              <span className="metric-value typography-h3">{keyMetrics.pending || 0}</span>
              <span className="metric-label typography-small">To Review</span>
            </div>
            <div className="metric-item urgent">
              <span className="metric-value typography-h3">{keyMetrics.urgent || 0}</span>
              <span className="metric-label typography-small">Urgent</span>
            </div>
            <div className="metric-item">
              <span className="metric-value typography-h3">{keyMetrics.approved || 0}</span>
              <span className="metric-label typography-small">Approved Today</span>
            </div>
            <div className="metric-item">
              <span className="metric-value typography-caption">{keyMetrics.avgReviewTime || 'N/A'}</span>
              <span className="metric-label typography-small">Avg Review Time</span>
            </div>
          </>
        );
      case 'submitter':
      default:
        return (
          <>
            <div className="metric-item">
              <span className="metric-value typography-h3">{keyMetrics.myTotal || 0}</span>
              <span className="metric-label typography-small">My Requests</span>
            </div>
            <div className="metric-item">
              <span className="metric-value typography-h3">{keyMetrics.myPending || 0}</span>
              <span className="metric-label typography-small">In Progress</span>
            </div>
            <div className="metric-item">
              <span className="metric-value typography-h3">{keyMetrics.myApproved || 0}</span>
              <span className="metric-label typography-small">Approved</span>
            </div>
          </>
        );
    }
  };

  // Render quick actions based on role
  const renderQuickActions = () => {
    switch (role) {
      case 'admin':
        return (
          <>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onQuickAction('review')}
              className="quick-action-btn"
            >
              Review Queue
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onQuickAction('configure')}
              className="quick-action-btn"
            >
              System Config
            </Button>
          </>
        );
      case 'reviewer':
        return (
          <>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onQuickAction('review')}
              className="quick-action-btn"
            >
              Review Queue
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onQuickAction('submit')}
              className="quick-action-btn"
            >
              Submit Request
            </Button>
          </>
        );
      case 'submitter':
      default:
        return (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onQuickAction('submit')}
              className="quick-action-btn"
            >
              ➕ Submit Request
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onQuickAction('archive')}
              className="quick-action-btn"
            >
              Browse Archive
            </Button>
          </>
        );
    }
  };

  const contextOptions = getContextOptions();

  return (
    <div className="context-bar">
      <div className="context-bar-content">
        <Row className="align-items-center">
          {/* Navigation Tabs */}
          <Col xs={12} md={6} lg={4}>
            <div className="context-nav">
              {contextOptions.map((option) => (
                <button
                  key={option.key}
                  className={`context-tab ${currentContext === option.key ? 'active' : ''}`}
                  onClick={() => onContextChange(option.key)}
                >
                  <span className="context-icon">{option.icon}</span>
                  <span className="context-label typography-caption">{option.label}</span>
                </button>
              ))}
            </div>
          </Col>

          {/* Key Metrics */}
          <Col xs={12} md={4} lg={5}>
            <div className="metrics-container">
              {renderMetrics()}
            </div>
          </Col>

          {/* Quick Actions */}
          <Col xs={12} md={2} lg={3}>
            <div className="quick-actions">
              {renderQuickActions()}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ContextBar;
