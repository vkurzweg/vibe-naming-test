import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getMyRequests } from '../features/requests/requestsSlice';
import { useNavigate } from 'react-router-dom';
import SubmitterDashboard from './SubmitterDashboard';

const SubmitterDashboardContainer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { requests, loading } = useSelector((state) => state.requests);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(getMyRequests());
    }
  }, [dispatch, user]);

  const columns = [
    { field: 'title', headerName: 'Title', width: 300 },
    { field: 'status', headerName: 'Status', width: 150 },
    { field: 'createdAt', headerName: 'Submitted On', width: 200, type: 'dateTime', valueGetter: (value) => new Date(value) },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          onClick={() => navigate(`/requests/${params.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <SubmitterDashboard
      requests={requests.map(r => ({...r, id: r._id}))}
      columns={columns}
    />
  );
};

export default SubmitterDashboardContainer;
