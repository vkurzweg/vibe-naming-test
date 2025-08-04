import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

// Helper function to format field names for display
const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
};

// Helper function to render cell content based on data type
const renderCellContent = (value, fieldName) => {
  if (value === null || value === undefined) {
    return '-';
  }
  
  // Handle dates
  if (fieldName.includes('date') || fieldName.includes('At') || fieldName === 'createdAt' || fieldName === 'updatedAt') {
    try {
      const date = typeof value === 'string' ? parseISO(value) : new Date(value);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return value;
    }
  }
  
  // Handle status with chips
  if (fieldName === 'status') {
    const statusColors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      draft: 'default'
    };
    return <Chip label={value} color={statusColors[value] || 'default'} size="small" />;
  }
  
  // Handle objects (like user)
  if (typeof value === 'object' && value !== null) {
    if (value.name) return value.name;
    if (value.email) return value.email;
    return JSON.stringify(value);
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  return String(value);
};

const RequestTable = ({ requests, onApprove, onReject, showActions = true }) => {
  // Generate columns dynamically from the first request
  const columns = useMemo(() => {
    if (!requests || requests.length === 0) return [];
    
    const firstRequest = requests[0];
    const excludeFields = ['__v', '_id']; // Fields to exclude from display
    
    return Object.keys(firstRequest)
      .filter(key => !excludeFields.includes(key))
      .map(key => ({
        field: key,
        headerName: formatFieldName(key),
        sortable: true
      }));
  }, [requests]);

  if (!requests || requests.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No requests found
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.field}>
                {column.headerName}
              </TableCell>
            ))}
            {showActions && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request._id || request.id}>
              {columns.map((column) => (
                <TableCell key={column.field}>
                  {renderCellContent(request[column.field], column.field)}
                </TableCell>
              ))}
              {showActions && (
                <TableCell>
                  <Button 
                    component={RouterLink} 
                    to={`/requests/${request._id || request.id}`} 
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    View
                  </Button>
                  {request.status === 'pending' && onApprove && onReject && (
                    <>
                      <Button 
                        onClick={() => onApprove(request._id || request.id, 'approved')} 
                        size="small" 
                        color="success"
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button 
                        onClick={() => onReject(request)} 
                        size="small" 
                        color="error"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RequestTable;
