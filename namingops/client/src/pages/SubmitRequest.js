// pages/SubmitRequest.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { debounce } from 'lodash';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Save as SaveIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  HelpOutline as HelpOutlineIcon,
  Accessibility as AccessibilityIcon,
  TextIncrease as TextIncreaseIcon,
  TextDecrease as TextDecreaseIcon
} from '@mui/icons-material';
import { submitNamingRequest, saveDraft, loadDraft, clearDraft } from '../features/naming/namingSlice';

const SubmitRequest = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { loading, success, error, requestId, draft } = useSelector((state) => state.naming);
  
  // Form state
  const [formData, setFormData] = useState(draft?.data || {});
  const [lastSaved, setLastSaved] = useState(draft?.lastSaved || null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = JSON.parse(localStorage.getItem('namingRequestDraft'));
    if (savedDraft) {
      setFormData(savedDraft.data || {});
      setLastSaved(savedDraft.lastSaved);
    }
  }, []);

  // Auto-save functionality
  const debouncedSave = useCallback(
    debounce((data) => {
      if (autoSaveEnabled && Object.keys(data).length > 0) {
        const draft = {
          data,
          lastSaved: new Date().toISOString(),
          userId: user?.id
        };
        localStorage.setItem('namingRequestDraft', JSON.stringify(draft));
        setLastSaved(draft.lastSaved);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
      }
    }, 2000),
    [autoSaveEnabled, user?.id]
  );

  // Handle form changes
  const handleValueChange = (survey) => {
    const newData = { ...survey.data };
    setFormData(newData);
    debouncedSave(newData);
  };

  // Handle form submission
  const handleComplete = async (survey) => {
    const submissionData = {
      ...survey.data,
      submittedBy: user?.id,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    };
    
    try {
      await dispatch(submitNamingRequest(submissionData)).unwrap();
      // Clear draft on successful submission
      localStorage.removeItem('namingRequestDraft');
      setLastSaved(null);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  // Initialize survey
  const survey = useMemo(() => {
    const surveyJson = {
      title: "Naming Request",
      showProgressBar: "top",
      pages: [{
        name: "basicInfo",
        elements: [{
          type: "text",
          name: "projectName",
          title: "Project/Product Name",
          isRequired: true,
          description: "Enter the name of the project or product that needs a name"
        }, {
          type: "dropdown",
          name: "assetType",
          title: "Asset Type",
          isRequired: true,
          choices: ["Product", "Feature", "Service", "API", "Other"]
        }, {
          type: "text",
          name: "assetTypeOther",
          title: "Please specify",
          visibleIf: "{assetType} = 'Other'",
          isRequired: "{assetType} = 'Other'"
        }, {
          type: "comment",
          name: "description",
          title: "Description",
          description: "Provide a brief description of the project/product"
        }, {
          type: "text",
          name: "proposedName",
          title: "Proposed Name",
          isRequired: true,
          description: "Enter your suggested name (e.g., 'Project Phoenix')"
        }, {
          type: "comment",
          name: "narrative",
          title: "Naming Narrative",
          description: "Explain the reasoning behind the proposed name"
        }]
      }],
      showQuestionNumbers: "off",
      questionErrorLocation: "bottom",
      completeText: "Submit Request",
      showPreviewBeforeComplete: "showAnsweredQuestions"
    };

    const survey = new Model(surveyJson);
    survey.data = formData;
    survey.onValueChanged.add(handleValueChange);
    survey.onComplete.add(handleComplete);

    // Apply accessibility settings
    if (accessibilityMode) {
      survey.css = {
        ...survey.css,
        root: 'sv_main sv_default_css sv-accessibility',
        header: 'sv_header',
        body: 'sv_body',
      };
    }

    return survey;
  }, [formData, accessibilityMode]);

  // Handle manual save
  const handleManualSave = () => {
    const draft = {
      data: formData,
      lastSaved: new Date().toISOString(),
      userId: user?.id
    };
    localStorage.setItem('namingRequestDraft', JSON.stringify(draft));
    setLastSaved(draft.lastSaved);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Handle clear draft
  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to clear your draft? This cannot be undone.')) {
      localStorage.removeItem('namingRequestDraft');
      setFormData({});
      setLastSaved(null);
      survey.data = {};
      survey.render();
    }
  };

  // Handle reset form
  const handleResetForm = () => {
    if (window.confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
      survey.clear();
      survey.render();
    }
  };

  // Render save status
  const renderSaveStatus = () => {
    if (!autoSaveEnabled) return null;
    return (
      <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
        {lastSaved ? `Last saved: ${new Date(lastSaved).toLocaleString()}` : 'Not saved yet'}
      </Typography>
    );
  };

  // Success view
  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 3 }} />
          <Typography variant="h4" gutterBottom>
            Request Submitted Successfully!
          </Typography>
          <Typography variant="body1" paragraph>
            Your naming request has been received and is being processed.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Request ID: {requestId}
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
              startIcon={<DashboardIcon />}
              size="large"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                dispatch({ type: 'naming/clearSubmission' });
                survey.clear();
                survey.render();
              }}
              startIcon={<AddIcon />}
              size="large"
            >
              Submit Another Request
            </Button>
          </Box>
          <Box sx={{ mt: 4, textAlign: 'left' }}>
            <Typography variant="h6" gutterBottom>What happens next?</Typography>
            <ul>
              <li>You will receive a confirmation email with your request details</li>
              <li>Our team will review your submission within 2 business days</li>
              <li>You'll be notified once your request is approved or if we need more information</li>
              <li>Track the status of your request in the dashboard</li>
            </ul>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Error view
  if (error) {
    let errorMessage = 'An error occurred while processing your request.';
    if (error.type === 'VALIDATION_ERROR') {
      errorMessage = 'Please correct the following errors:';
    } else if (error.type === 'AUTH_ERROR') {
      errorMessage = 'Please log in to submit a request.';
    } else if (error.type === 'NETWORK_ERROR') {
      errorMessage = 'Unable to connect to the server. Please check your connection.';
    }

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <ErrorIcon color="error" sx={{ fontSize: 80, mb: 3 }} />
          <Typography variant="h5" color="error" gutterBottom>
            {errorMessage}
          </Typography>
          
          {error.errors && (
            <Box sx={{ textAlign: 'left', my: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <ul style={{ margin: 0, paddingLeft: 24 }}>
                {Object.entries(error.errors).map(([field, message]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {message}
                  </li>
                ))}
              </ul>
            </Box>
          )}

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => {
                dispatch({ type: 'naming/clearSubmission' });
                survey.render();
              }}
              startIcon={<AddIcon />}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              startIcon={<DashboardIcon />}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Main form view
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4">Submit Naming Request</Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Accessibility Controls */}
            <Tooltip title="Accessibility Mode">
              <IconButton
                onClick={() => setAccessibilityMode(!accessibilityMode)}
                color={accessibilityMode ? "primary" : "default"}
                size="small"
              >
                <AccessibilityIcon />
              </IconButton>
            </Tooltip>

            {/* Font Size Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <IconButton 
                onClick={() => setFontSize(Math.max(12, fontSize - 1))} 
                size="small"
                disabled={fontSize <= 12}
              >
                <TextDecreaseIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" sx={{ px: 1 }}>{fontSize}px</Typography>
              <IconButton 
                onClick={() => setFontSize(Math.min(24, fontSize + 1))} 
                size="small"
                disabled={fontSize >= 24}
              >
                <TextIncreaseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Auto-save Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  size="small"
                />
              }
              label="Auto-save"
              labelPlacement="start"
            />

            {/* Manual Save Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleManualSave}
              disabled={!Object.keys(formData).length}
            >
              Save Draft
            </Button>

            {/* Clear Draft Button */}
            {lastSaved && (
              <Button
                variant="text"
                size="small"
                color="error"
                onClick={handleClearDraft}
                sx={{ ml: 1 }}
              >
                Clear Draft
              </Button>
            )}
          </Box>
        </Box>

        {/* Save Status */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          {renderSaveStatus()}
          <Snackbar
            open={showSaveSuccess}
            autoHideDuration={3000}
            onClose={() => setShowSaveSuccess(false)}
            message="Draft saved successfully"
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          />
        </Box>

        {/* Form Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Button
              variant="outlined"
              onClick={handleResetForm}
              disabled={!Object.keys(formData).length}
              size="small"
            >
              Reset Form
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              size="small"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => survey.showPreview()}
              disabled={!survey || !survey.nextPageNo}
              size="small"
            >
              Review & Submit
            </Button>
          </Box>
        </Box>

        {/* Survey Component */}
        <Box sx={{ 
          '--sv-default-font-size': `${fontSize}px`,
          '& .sv_qstn': {
            marginBottom: '1.5em',
          },
          '& .sv_q_title': {
            fontSize: '1.1em',
            fontWeight: 500,
          },
          '& .sv_q_description': {
            fontSize: '0.9em',
            color: 'text.secondary',
            marginBottom: '0.5em',
          },
          '& .sv_complete_btn': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            }
          }
        }}>
          <Survey model={survey} />
        </Box>

        {/* Loading Indicator */}
        {loading && (
          <Box sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            zIndex: 9999
          }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6">Submitting your request...</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Please wait while we process your submission
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SubmitRequest;