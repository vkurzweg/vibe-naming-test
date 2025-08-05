import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Fade,
  Grow,
  useTheme,
  alpha,
  Paper,
  Container,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Warning as ReviewIcon,
} from '@mui/icons-material';
import { getStatusColor } from '../../theme/newColorPalette';
import NamingGuidelines from '../Guidelines/NamingGuidelines';
import DynamicFormRenderer from '../DynamicForm/DynamicFormRenderer';
import StatusProgressionStepper from '../StatusProgression/StatusProgressionStepper';
import AdvancedRequestTable from '../RequestTable/AdvancedRequestTable';
import RequestDetailModal from '../RequestModal/RequestDetailModal';
import { useQuery } from '@tanstack/react-query';

const ContentArea = ({ role, context, requests, isLoading, activeFormConfig, onContextChange }) => {
  const theme = useTheme();
  
  // Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // For now, use the passed requests data directly
  // TODO: Integrate React Query hooks properly in Phase 4
  const effectiveRequests = requests || [];
  const effectiveLoading = isLoading || false;

  // Get most recent active request for submitters
  const getMostRecentActiveRequest = () => {
    if (!effectiveRequests || effectiveRequests.length === 0) return null;
    
    // Filter out cancelled and rejected requests, then sort by creation date
    const activeRequests = effectiveRequests.filter(req => 
      !['cancelled', 'rejected'].includes(req.status)
    );
    
    if (activeRequests.length === 0) return null;
    
    return activeRequests.sort((a, b) => 
      new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
    )[0];
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render loading state
  const renderLoading = () => (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
      <CircularProgress size={20} />
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Loading...</Typography>
    </Box>
  );

  // Render empty state
  const renderEmptyState = (title, description, actionLabel, actionHandler) => (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px" textAlign="center">
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>{description}</Typography>
      {actionLabel && actionHandler && (
        <Button variant="contained" onClick={actionHandler} sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );

  // Render single request with dynamic form and status progression
  const renderRequestDetail = (request) => (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={3}>
        {/* Left side: Request data using dynamic form */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            {request.title || 'Naming Request'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Submitted {formatDate(request.createdAt || request.created_at)} by {request.user?.name || request.submitterName || 'Unknown User'}
          </Typography>
          
          {/* Dynamic form renderer for request data */}
          <Box mt={2}>
            <DynamicFormRenderer
              formConfig={activeFormConfig}
              formData={request.formData || {}}
              role={role}
              readonly={role === 'submitter' && !['draft', 'submitted'].includes(request.status)}
              showSubmitButton={false}
            />
          </Box>
        </Grid>
        
        {/* Right side: Status progression */}
        <Grid item xs={12} md={4}>
          <StatusProgressionStepper
            status={request.status}
            timestamps={{
              submitted: request.submittedAt || request.createdAt,
              under_review: request.reviewStartedAt,
              final_review: request.finalReviewStartedAt,
              approved: request.approvedAt,
              rejected: request.rejectedAt,
              cancelled: request.cancelledAt,
              on_hold: request.heldAt
            }}
            orientation="vertical"
            compact={false}
          />
          
          {/* Action buttons for reviewers/admins */}
          {(role === 'reviewer' || role === 'admin') && (
            <Box mt={3}>
              <Button
                variant="contained"
                size="small"
                onClick={() => console.log('Claim request:', request._id)}
                disabled={false}
                sx={{ mr: 1, mb: 1 }}
              >
                Claim
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => console.log('Hold request:', request._id)}
                disabled={false}
                sx={{ mr: 1, mb: 1 }}
              >
                Hold
              </Button>
            </Box>
          )}
          
          {/* Cancel button for submitters */}
          {role === 'submitter' && ['submitted', 'under_review'].includes(request.status) && (
            <Box mt={3}>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => console.log('Cancel request:', request._id)}
                disabled={false}
              >
                Cancel Request
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );

  // Handle request actions
  const handleRequestAction = (action, request) => {
    switch (action) {
      case 'view':
      case 'edit':
        setSelectedRequest(request);
        setIsModalOpen(true);
        break;
      case 'claim':
        // TODO: Implement requestActions.claimRequest in Phase 4
        console.log('Claim request:', request._id);
        break;
      case 'hold':
        // TODO: Implement requestActions.holdRequest in Phase 4
        console.log('Hold request:', request._id);
        break;
      case 'cancel':
        // TODO: Implement requestActions.cancelRequest in Phase 4
        console.log('Cancel request:', request._id);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Handle request selection
  const handleRequestSelect = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  // Handle request update from modal
  const handleRequestUpdate = (updatedRequest) => {
    // The React Query cache will be updated automatically by the mutation
    // This callback can be used for additional UI updates if needed
    console.log('Request updated:', updatedRequest);
  };

  // Render request list - use AdvancedRequestTable for reviewers/admins, simple list for submitters
  const renderRequestList = (filteredRequests, showActions = false) => {
    // For reviewers and admins, use the advanced table
    if (role !== 'submitter' && showActions) {
      return (
        <AdvancedRequestTable
          requests={filteredRequests}
          role={role}
          onRequestAction={handleRequestAction}
          onRequestSelect={handleRequestSelect}
          isLoading={effectiveLoading || isLoading}
        />
      );
    }

    // For submitters or simple lists, use the card-based layout
    return (
      <Box>
        {filteredRequests.map((request) => (
          <Paper key={request._id} elevation={1} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Typography variant="h6">
                  {request.title || 'Untitled Request'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Submitted {formatDate(request.createdAt)} by {request.user?.name || 'Unknown User'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Chip
                  label={request.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                  sx={{
                    backgroundColor: getStatusColor(request.status),
                    color: '#fff',
                    fontWeight: 600
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                {showActions && (
                  <Box>
                    <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                      Review
                    </Button>
                    <Button variant="outlined" size="small">
                      Details
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>
    );
  };

  // Render overview content
  const renderOverview = () => {
    if (effectiveLoading || isLoading) {
      return renderLoading();
    }

    // For submitters: show most recent active request or naming guidelines
    if (role === 'submitter') {
      const mostRecentRequest = getMostRecentActiveRequest();
      
      return (
        <Box>
          <Box mb={4}>
            <Typography variant="h4" gutterBottom>
              Your Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mostRecentRequest ? 'Your most recent active request' : 'Welcome to the naming system'}
            </Typography>
          </Box>

          {mostRecentRequest ? (
            renderRequestDetail(mostRecentRequest)
          ) : (
            <Box>
              <NamingGuidelines onSubmitClick={() => onContextChange('submit')} />
            </Box>
          )}
        </Box>
      );
    }

    // For reviewers/admins: show recent activity and key metrics
    const recentRequests = effectiveRequests.slice(0, 5);
    
    return (
      <Box>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            {role === 'admin' ? 'System Overview' : 'Review Dashboard'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recent activity and pending reviews
          </Typography>
        </Box>

        {recentRequests.length > 0 ? (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Recent Requests
            </Typography>
            {renderRequestList(recentRequests, true)}
          </>
        ) : (
          renderEmptyState(
            'No Recent Activity',
            'No requests have been submitted recently.',
            null,
            null
          )
        )}
      </Box>
    );
  };

  // Render requests content
  const renderRequests = () => {
    const userRequests = effectiveRequests || [];

    return (
      <Box>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            {role === 'submitter' ? 'My Requests' : 'All Requests'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userRequests.length} request{userRequests.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>

        {effectiveLoading || isLoading ? (
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
      </Box>
    );
  };

  // Render review queue content
  const renderReviewQueue = () => {
    const pendingRequests = effectiveRequests.filter(r => ['submitted', 'under_review'].includes(r.status));

    return (
      <Box>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>Review Queue</Typography>
          <Typography variant="body2" color="text.secondary">
            {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} awaiting review
          </Typography>
        </Box>

        {effectiveLoading || isLoading ? (
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
      </Box>
    );
  };

  // Render submit content
  const renderSubmit = () => (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Submit New Request
        </Typography>
        {activeFormConfig ? (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Form configuration loaded: {activeFormConfig.name}
            </Typography>
            <DynamicFormRenderer
              formConfig={activeFormConfig}
              formData={{}}
              role={role}
              readonly={false}
              showSubmitButton={true}
              submitButtonText="Submit Request"
            />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Loading form configuration...
          </Typography>
        )}
      </Paper>
    </Box>
  );

  // Render placeholder content
  const renderPlaceholder = (title, description, features) => (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Coming Soon</Typography>
        <Typography variant="body2" color="text.secondary">
          This feature is under development and will be available in a future update.
        </Typography>
      </Paper>
    </Box>
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
        return renderSubmit();
      
      case 'archive':
        return renderPlaceholder(
          'Archive Portfolio',
          'Searchable portfolio of all active company names with data visualization and dependency tracking.',
          []
        );
      
      case 'configure':
        if (role !== 'admin') {
          return renderEmptyState('Access Denied', 'You don\'t have permission to configure the system.');
        }
        return renderPlaceholder(
          'System Configuration',
          'Configure form templates, user roles, and system settings.',
          []
        );
      
      default:
        return renderOverview();
    }
  };

  return (
    <Container fluid className="content-area p-4">
      {renderContent()}
      
      {/* Request Detail Modal */}
      <RequestDetailModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        role={role}
        activeFormConfig={activeFormConfig}
        onRequestUpdate={handleRequestUpdate}
      />
    </Container>
  );
};

export default ContentArea;
