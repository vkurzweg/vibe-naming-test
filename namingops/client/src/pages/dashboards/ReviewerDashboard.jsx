import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { RateReview, Description, AddCircleOutline, Archive } from '@mui/icons-material';

const navItems = [
  { text: 'Review Queue', path: '/review-queue', icon: <RateReview /> },
  { text: 'My Requests', path: '/my-requests', icon: <Description /> },
  { text: 'Submit a Request', path: '/submit-request', icon: <AddCircleOutline /> },
  { text: 'Archive', path: '/archive', icon: <Archive /> },
];

const ReviewerDashboard = () => {
  const location = useLocation();

  return (
    <Box>
      <Typography variant="h6" sx={{ p: 2 }}>Reviewer</Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ReviewerDashboard;
