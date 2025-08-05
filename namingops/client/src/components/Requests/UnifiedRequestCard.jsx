import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { format } from 'date-fns';
import { getStatusColor } from '../../theme/newColorPalette';

const UnifiedRequestCard = ({ request, userRole = 'submitter', onViewDetails, onUpdateStatus }) => {
  const theme = useTheme();

  if (!request) return null;

  return (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: `1px solid ${getStatusColor(request.status)}33`,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${getStatusColor(request.status)}40`,
          borderColor: getStatusColor(request.status),
        }
      }}
      onClick={() => onViewDetails(request.id)}
    >
      <CardContent>
        {/* Status and Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Chip
            label={request.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN STATUS'}
            sx={{
              backgroundColor: getStatusColor(request.status),
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          />
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(request.id);
              }}
              sx={{
                borderColor: getStatusColor(request.status),
                color: getStatusColor(request.status),
                '&:hover': {
                  backgroundColor: `${getStatusColor(request.status)}20`,
                }
              }}
            >
              Quick View
            </Button>
            {(userRole === 'reviewer' || userRole === 'admin') && (
              <Button
                size="small"
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus?.(request);
                }}
                sx={{
                  backgroundColor: getStatusColor(request.status),
                  '&:hover': {
                    backgroundColor: `${getStatusColor(request.status)}dd`,
                  }
                }}
              >
                Update Request
              </Button>
            )}
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            color: theme.palette.mode === 'dark'
              ? theme.palette.grey[100]
              : theme.palette.text.primary,
            fontWeight: 600
          }}
        >
          {request.title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            color: theme.palette.mode === 'dark'
              ? theme.palette.grey[300]
              : theme.palette.text.secondary
          }}
        >
          {request.description}
        </Typography>

        {/* Form Data Display */}
        {request.formData && request.formData.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              {request.formData.map(({ label, value }) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(getStatusColor(request.status), 0.05),
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {label}
                    </Typography>
                    <Typography variant="body2">{value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Metadata */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.mode === 'dark'
                ? theme.palette.grey[400]
                : theme.palette.text.secondary
            }}
          >
            Submitted: {format(new Date(request.createdAt), 'MMM dd, yyyy')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.mode === 'dark'
                ? theme.palette.grey[400]
                : theme.palette.text.secondary
            }}
          >
            By: {request.submitter}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UnifiedRequestCard;
