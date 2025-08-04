import React from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { getStatusColor } from '../../theme/appleTheme';
import './ContentArea.css';

const ContentArea = ({ role, context, requests, isLoading, activeFormConfig, onContextChange }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status badge variant
  const getStatusBadge = (status) => {
    return status === 'approved' ? 'success' : 'secondary';
  };

  // Render loading state
  const renderLoading = () => (
    <div className="loading-container">
      <Spinner animation="border" variant="primary" />
      <p className="typography-caption mt-3">Loading...</p>
    </div>
  );

  // Render empty state
  const renderEmptyState = (title, description, actionLabel, actionHandler) => (
    <div className="empty-state">
      <div className="empty-state-content">
        <h3 className="typography-h3">{title}</h3>
        <p className="typography-body text-muted">{description}</p>
        {actionLabel && actionHandler && (
          <Button variant="primary" onClick={actionHandler} className="mt-3">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );

  // Render request list
  const renderRequestList = (filteredRequests, showActions = false) => (
    <div className="request-list">
      {filteredRequests.map((request) => (
        <Card key={request._id} className="request-card mb-3">
          <Card.Body>
            <Row className="align-items-center">
              <Col xs={12} md={6}>
                <div className="request-info">
                  <h5 className="typography-h3 mb-1">{request.title || 'Untitled Request'}</h5>
                  <p className="typography-caption text-muted mb-2">
                    Submitted {formatDate(request.createdAt)} by {request.user?.name || 'Unknown User'}
                  </p>
                  {request.formData && Object.keys(request.formData).length > 0 && (
                    <div className="form-data-preview">
                      {Object.entries(request.formData).slice(0, 2).map(([key, value]) => (
                        <span key={key} className="typography-small text-muted">
                          {key}: {Array.isArray(value) ? value.join(', ') : (typeof value === 'object' ? JSON.stringify(value) : value)} • 
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Col>
              <Col xs={12} md={3}>
                <Badge 
                  bg={getStatusBadge(request.status)} 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(request.status) }}
                >
                  {request.status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </Col>
              <Col xs={12} md={3}>
                {showActions && (
                  <div className="request-actions">
                    <Button variant="outline-primary" size="sm" className="me-2">
                      Review
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                      Details
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
    </div>
  );

  // Render overview content
  const renderOverview = () => {
    const recentRequests = requests.slice(0, 5);
    
    return (
      <div className="overview-content">
        <Row>
          <Col xs={12} lg={8}>
            <Card className="overview-card">
              <Card.Header>
                <h4 className="typography-h3">Recent Activity</h4>
              </Card.Header>
              <Card.Body>
                {isLoading ? (
                  renderLoading()
                ) : recentRequests.length > 0 ? (
                  renderRequestList(recentRequests, role !== 'submitter')
                ) : (
                  renderEmptyState(
                    'No Recent Activity',
                    'No requests have been submitted recently.',
                    role === 'submitter' ? 'Submit Your First Request' : null,
                    role === 'submitter' ? () => onContextChange('submit') : null
                  )
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={4}>
            <Card className="overview-card">
              <Card.Header>
                <h4 className="typography-h3">Quick Stats</h4>
              </Card.Header>
              <Card.Body>
                <div className="stats-list">
                  <div className="stat-item">
                    <span className="stat-value typography-h3">{requests.length}</span>
                    <span className="stat-label typography-caption">Total Requests</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value typography-h3">
                      {requests.filter(r => r.status === 'approved').length}
                    </span>
                    <span className="stat-label typography-caption">Approved</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value typography-h3">
                      {requests.filter(r => ['submitted', 'under_review'].includes(r.status)).length}
                    </span>
                    <span className="stat-label typography-caption">In Progress</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Render requests content
  const renderRequests = () => {
    const userRequests = role === 'submitter' 
      ? requests.filter(r => r.user?.id === 'current-user') // Simplified for demo
      : requests;

    return (
      <div className="requests-content">
        <div className="content-header mb-4">
          <h2 className="typography-h2">
            {role === 'submitter' ? 'My Requests' : 'All Requests'}
          </h2>
          <p className="typography-caption text-muted">
            {userRequests.length} request{userRequests.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {isLoading ? (
          renderLoading()
        ) : userRequests.length > 0 ? (
          renderRequestList(userRequests, role !== 'submitter')
        ) : (
          renderEmptyState(
            'No Requests Found',
            role === 'submitter' 
              ? 'You haven\'t submitted any requests yet.' 
              : 'No requests have been submitted to the system.',
            role === 'submitter' ? 'Submit Your First Request' : null,
            role === 'submitter' ? () => onContextChange('submit') : null
          )
        )}
      </div>
    );
  };

  // Render review queue content
  const renderReviewQueue = () => {
    const pendingRequests = requests.filter(r => ['submitted', 'under_review'].includes(r.status));

    return (
      <div className="review-content">
        <div className="content-header mb-4">
          <h2 className="typography-h2">Review Queue</h2>
          <p className="typography-caption text-muted">
            {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>

        {isLoading ? (
          renderLoading()
        ) : pendingRequests.length > 0 ? (
          renderRequestList(pendingRequests, true)
        ) : (
          renderEmptyState(
            'No Pending Reviews',
            'All requests have been reviewed. Great work!',
            null,
            null
          )
        )}
      </div>
    );
  };

  // Render placeholder content for new features
  const renderPlaceholder = (title, description, features) => (
    <div className="placeholder-content">
      <Card className="placeholder-card">
        <Card.Body className="text-center">
          <h2 className="typography-h2 mb-3">{title}</h2>
          <p className="typography-body text-muted mb-4">{description}</p>
          
          <div className="feature-list">
            {features.map((feature, index) => (
              <div key={index} className="feature-item mb-3">
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-info">
                  <h5 className="typography-h3">{feature.name}</h5>
                  <p className="typography-caption text-muted">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <Badge bg="info" className="coming-soon-badge">
            Coming Soon
          </Badge>
        </Card.Body>
      </Card>
    </div>
  );

  // Render colored tiles
  const renderColoredTiles = () => (
    <Row className="colored-tiles">
      <Col md={4} className="mb-4">
        <Card className="tile tile-blue">
          <Card.Body>
            <h5 className="tile-title">Tile 1</h5>
            <p className="tile-description">Description for Tile 1</p>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4} className="mb-4">
        <Card className="tile tile-green">
          <Card.Body>
            <h5 className="tile-title">Tile 2</h5>
            <p className="tile-description">Description for Tile 2</p>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4} className="mb-4">
        <Card className="tile tile-gradient">
          <Card.Body>
            <h5 className="tile-title">Gradient Tile</h5>
            <p className="tile-description">Description for Gradient Tile</p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  // Main content renderer
  const renderContent = () => {
    switch (context) {
      case 'overview':
        return renderOverview();
      
      case 'requests':
        return renderRequests();
      
      case 'review':
        if (role === 'submitter') {
          return renderEmptyState('Access Denied', 'You don\'t have permission to view the review queue.');
        }
        return renderReviewQueue();
      
      case 'submit':
        return (
          <div className="submit-content">
            <Card>
              <Card.Header>
                <h3 className="typography-h3">Submit New Request</h3>
              </Card.Header>
              <Card.Body>
                {activeFormConfig ? (
                  <p className="typography-body">Form configuration loaded: {activeFormConfig.name}</p>
                ) : (
                  <p className="typography-body text-muted">Loading form configuration...</p>
                )}
                <Badge bg="info">Form Integration Coming Soon</Badge>
              </Card.Body>
            </Card>
          </div>
        );
      
      case 'archive':
        return renderPlaceholder(
          'Archive Portfolio',
          'Searchable portfolio of all active company names with data visualization and dependency tracking.',
          [
            { icon: '🔍', name: 'Advanced Search', description: 'Search through all archived requests and approved names' },
            { icon: '📊', name: 'Data Visualization', description: 'Visual insights into naming patterns and trends' },
            { icon: '🔗', name: 'Dependency Network', description: 'Inter-product dependency visualization' }
          ]
        );
      
      case 'guidelines':
        return renderPlaceholder(
          'Naming Guidelines',
          'Comprehensive guidelines for submitting naming requests, managed through a headless CMS.',
          [
            { icon: '📋', name: 'Best Practices', description: 'Guidelines for effective naming conventions' },
            { icon: '✅', name: 'Approval Criteria', description: 'What makes a name likely to be approved' },
            { icon: '🚫', name: 'Common Mistakes', description: 'Pitfalls to avoid when submitting requests' }
          ]
        );
      
      case 'resources':
        return renderPlaceholder(
          'Resources & Documentation',
          'Centralized resources for reviewers and administrators.',
          [
            { icon: '📚', name: 'Documentation', description: 'Comprehensive guides and references' },
            { icon: '🔧', name: 'Tools', description: 'Helpful tools for review and analysis' },
            { icon: '📞', name: 'Support', description: 'Contact information and help resources' }
          ]
        );
      
      case 'configure':
        if (role !== 'admin') {
          return renderEmptyState('Access Denied', 'You don\'t have permission to access system configuration.');
        }
        return renderPlaceholder(
          'System Configuration',
          'Administrative controls for managing forms, users, and system settings.',
          [
            { icon: '📝', name: 'Form Builder', description: 'Create and manage dynamic request forms' },
            { icon: '👥', name: 'User Management', description: 'Manage user roles and permissions' },
            { icon: '⚙️', name: 'System Settings', description: 'Configure application behavior and preferences' }
          ]
        );
      
      default:
        return renderOverview();
    }
  };

  return (
    <div className="content-area">
      <Container fluid className="h-100">
        {isLoading ? renderLoading() : (
          <>
            {renderColoredTiles()}
            {renderContent()}
          </>
        )}
      </Container>
    </div>
  );
};

export default ContentArea;
