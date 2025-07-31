import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FormConfigManager from '../features/admin/FormConfigManager';
import ReviewRequests from '../features/review/ReviewRequests';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="admin dashboard tabs"
        >
          <Tab label="Form Configuration" />
          <Tab label="Review Requests" />
          <Tab label="User Management" disabled />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <FormConfigManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <ReviewRequests />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography>User Management (Coming Soon)</Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
