import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Check as CheckIcon,
  KeyboardArrowDown as ChevronDownIcon,
  KeyboardArrowUp as ChevronUpIcon,
} from '@mui/icons-material';
import DynamicFormRenderer from '../DynamicForm/DynamicFormRenderer';
import StatusProgressionStepper from '../StatusProgression/StatusProgressionStepper';
import { getStatusColor } from '../../theme/newColorPalette';
import useRequestManagement from '../../hooks/useRequestManagement';

// Status options for reviewers/admins
const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'final_review', label: 'Final Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SelectItem = React.forwardRef(({ children, className, ...props }, forwardedRef) => {
  return (
    <Select.Item
      className={`
        relative flex h-[35px] select-none items-center rounded-[3px] pl-[25px] pr-[35px] text-[13px] 
        leading-none text-violet11 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 
        data-[disabled]:text-mauve8 data-[highlighted]:text-violet1 data-[highlighted]:outline-none
        ${className}
      `}
      {...props}
      ref={forwardedRef}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute left-0 w-[25px] inline-flex items-center justify-center">
        <CheckIcon />
      </Select.ItemIndicator>
    </Select.Item>
  );
});

SelectItem.displayName = 'SelectItem';

const RequestDetailModal = ({ 
  request, 
  isOpen, 
  onClose, 
  role = 'reviewer',
  activeFormConfig,
  onRequestUpdate 
}) => {
  const theme = useTheme();
  const requestActions = useRequestManagement();
  const [selectedStatus, setSelectedStatus] = useState(request?.status || 'submitted');
  const [reviewerNotes, setReviewerNotes] = useState(request?.reviewerNotes || '');
  const [formData, setFormData] = useState(request?.formData || {});

  if (!request) return null;

  const handleStatusUpdate = async () => {
    try {
      await requestActions.updateStatus({
        requestId: request._id,
        status: selectedStatus,
        notes: reviewerNotes
      });
      if (onRequestUpdate) {
        onRequestUpdate({ ...request, status: selectedStatus, reviewerNotes });
      }
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleFormDataUpdate = async (newFormData) => {
    try {
      await requestActions.updateRequest({
        requestId: request._id,
        formData: newFormData
      });
      setFormData(newFormData);
      if (onRequestUpdate) {
        onRequestUpdate({ ...request, formData: newFormData });
      }
    } catch (error) {
      console.error('Failed to update request data:', error);
    }
  };

  const canEditStatus = role === 'reviewer' || role === 'admin';
  const canEditFormData = role === 'admin' || (role === 'submitter' && ['draft', 'submitted'].includes(request.status));

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-blackA9 data-[state=open]:animate-overlayShow fixed inset-0 z-50" />
        <Dialog.Content
          className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[900px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-50"
          aria-labelledby="request-title"
          aria-describedby="request-description"
        >
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Dialog.Title asChild>
                <Typography id="request-title" variant="h5" component="h2" gutterBottom>
                  {request.title || 'Naming Request'}
                </Typography>
              </Dialog.Title>
              <Dialog.Description asChild>
                <Typography id="request-description" variant="body2" color="text.secondary">
                  Submitted by {request.user?.name || request.submitterName || 'Unknown User'} on{' '}
                  {new Date(request.createdAt || request.created_at).toLocaleDateString()}
                </Typography>
              </Dialog.Description>
            </Box>
            <Dialog.Close asChild>
              <IconButton
                aria-label="Close dialog"
                sx={{ 
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  color: 'text.secondary'
                }}
              >
                <CloseIcon />
              </IconButton>
            </Dialog.Close>
          </Box>

          {/* Current Status */}
          <Box mb={3}>
            <Chip
              label={request.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
              sx={{
                backgroundColor: getStatusColor(request.status),
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            />
          </Box>

          {/* Tabs for different sections */}
          <Tabs.Root defaultValue="details" className="w-full">
            <Tabs.List
              className="shrink-0 flex border-b border-mauve6"
              aria-label="Request information tabs"
            >
              <Tabs.Trigger
                className="bg-white px-5 h-[45px] flex-1 flex items-center justify-center text-[15px] leading-none text-mauve11 select-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black outline-none cursor-default"
                value="details"
              >
                Request Details
              </Tabs.Trigger>
              <Tabs.Trigger
                className="bg-white px-5 h-[45px] flex-1 flex items-center justify-center text-[15px] leading-none text-mauve11 select-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black outline-none cursor-default"
                value="status"
              >
                Status & Timeline
              </Tabs.Trigger>
              {canEditStatus && (
                <Tabs.Trigger
                  className="bg-white px-5 h-[45px] flex-1 flex items-center justify-center text-[15px] leading-none text-mauve11 select-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black outline-none cursor-default"
                  value="review"
                >
                  Review Actions
                </Tabs.Trigger>
              )}
            </Tabs.List>

            {/* Request Details Tab */}
            <Tabs.Content
              className="grow p-5 bg-white rounded-b-md outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
              value="details"
            >
              <Box maxHeight="400px" overflow="auto">
                <DynamicFormRenderer
                  formConfig={activeFormConfig}
                  formData={formData}
                  role={role}
                  readonly={!canEditFormData}
                  onChange={setFormData}
                  onSubmit={handleFormDataUpdate}
                  showSubmitButton={canEditFormData}
                  submitButtonText="Update Request"
                />
              </Box>
            </Tabs.Content>

            {/* Status & Timeline Tab */}
            <Tabs.Content
              className="grow p-5 bg-white rounded-b-md outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
              value="status"
            >
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
                showTimestamps={true}
              />
            </Tabs.Content>

            {/* Review Actions Tab */}
            {canEditStatus && (
              <Tabs.Content
                className="grow p-5 bg-white rounded-b-md outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
                value="review"
              >
                <Box display="flex" flexDirection="column" gap={3}>
                  {/* Status Update */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Update Status
                    </Typography>
                    <Select.Root
                      value={selectedStatus}
                      onValueChange={setSelectedStatus}
                    >
                      <Select.Trigger
                        className="inline-flex items-center justify-center rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-violet11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-violet9 outline-none"
                        aria-label="Status"
                      >
                        <Select.Value placeholder="Select a status" />
                        <Select.Icon className="text-violet11">
                          <ChevronDownIcon />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden bg-white rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]">
                          <Select.ScrollUpButton className="flex items-center justify-center h-[25px] bg-white text-violet11 cursor-default">
                            <ChevronUpIcon />
                          </Select.ScrollUpButton>
                          <Select.Viewport className="p-[5px]">
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </Select.Viewport>
                          <Select.ScrollDownButton className="flex items-center justify-center h-[25px] bg-white text-violet11 cursor-default">
                            <ChevronDownIcon />
                          </Select.ScrollDownButton>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </Box>

                  {/* Reviewer Notes */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Reviewer Notes
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      fullWidth
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      placeholder="Add notes about this review..."
                      variant="outlined"
                    />
                  </Box>

                  {/* Action Buttons */}
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleStatusUpdate}
                      disabled={requestActions.isUpdatingStatus}
                    >
                      {requestActions.isUpdatingStatus ? 'Updating...' : 'Update Status'}
                    </Button>
                  </Box>
                </Box>
              </Tabs.Content>
            )}
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default RequestDetailModal;
