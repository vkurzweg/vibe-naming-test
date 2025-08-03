import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const RequestTable = ({ requests, onApprove, onReject, formatDate, getStatusChip }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Submitter</TableCell>
            <TableCell>Date Submitted</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request._id}>
              <TableCell>{request.title}</TableCell>
              <TableCell>{request.user.name}</TableCell>
              <TableCell>{formatDate(request.createdAt)}</TableCell>
              <TableCell>{getStatusChip(request.status)}</TableCell>
              <TableCell>
                <Button component={RouterLink} to={`/requests/${request._id}`} size="small">View</Button>
                {request.status === 'pending' && (
                  <>
                    <Button onClick={() => onApprove(request._id, 'approved')} size="small" color="success">Approve</Button>
                    <Button onClick={() => onReject(request)} size="small" color="error">Reject</Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RequestTable;
