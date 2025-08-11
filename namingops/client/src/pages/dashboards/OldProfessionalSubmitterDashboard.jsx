// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { useTheme } from '@mui/material/styles';
// import { Container, Row, Col } from 'react-bootstrap';
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   Chip,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   IconButton,
//   Tooltip,
//   CircularProgress,
//   Alert,
//   TextField,
//   InputAdornment,
//   Divider,
//   Avatar,
//   Stack,
//   Tab,
//   Tabs,
// } from '@mui/material';
// import {
//   Add as AddIcon,
//   Visibility as ViewIcon,
//   Search as SearchIcon,
//   FilterList as FilterIcon,
//   Timeline as TimelineIcon,
//   Assignment as AssignmentIcon,
//   Archive as ArchiveIcon,
//   TrendingUp as TrendingUpIcon,
//   MenuBook as GuidelinesIcon,
//   Support as SupportIcon,
//   HourglassEmpty as HourglassEmptyIcon,
//   CheckCircle as CheckCircleIcon,
//   Autorenew as AutorenewIcon,
// } from '@mui/icons-material';
// import { format, parseISO } from 'date-fns';
// import { getMyRequests } from '../../features/requests/requestsSlice';
// import { getStatusColor, getStatusIcon } from '../../theme/professionalTheme';
// import RequestDetailsModal from '../../components/Requests/RequestDetailsModal';
// import NamingGuidelines from '../../components/Guidelines/NamingGuidelines';
// import HelperAgent from '../../components/HelperAgent/HelperAgent';

// const ProfessionalSubmitterDashboard = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const theme = useTheme();
  
//   const { user } = useSelector((state) => state.auth);
//   const { requests, loading, error } = useSelector((state) => state.requests);
  
//   const [searchQuery, setSearchQuery] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [selectedRequestId, setSelectedRequestId] = useState(null);
//   const [detailsModalOpen, setDetailsModalOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState(0);

//   useEffect(() => {
//     dispatch(getMyRequests());
//   }, [dispatch]);

//   // Get user's requests from the requests array
//   const userRequests = Array.isArray(requests?.data) ? requests.data : [];
  
//   // Filter requests based on search and status
//   const filteredRequests = userRequests.filter(request => {
//     const matchesSearch = !searchQuery || 
//       request.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       request.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
//     const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
//     return matchesSearch && matchesStatus;
//   });

//   // Calculate stats
//   const stats = {
//     total: userRequests.length,
//     pending: userRequests.filter(r => r.status === 'pending').length,
//     approved: userRequests.filter(r => r.status === 'approved').length,
//     inProgress: userRequests.filter(r => r.status === 'in-progress').length,
//   };

//   const handleViewRequest = (requestId) => {
//     setSelectedRequestId(requestId);
//     setDetailsModalOpen(true);
//   };
  
//   const handleCloseDetailsModal = () => {
//     setDetailsModalOpen(false);
//   };
  
//   const handleTabChange = (event, newValue) => {
//     setActiveTab(newValue);
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     try {
//       return format(parseISO(dateString), 'MMM dd, yyyy');
//     } catch {
//       return 'Invalid date';
//     }
//   };

//   const getStatusChipProps = (status) => ({
//     label: status?.replace('_', ' ').toUpperCase(),
//     sx: {
//       backgroundColor: getStatusColor(status, theme),
//       color: theme.palette.getContrastText(getStatusColor(status, theme)),
//       fontWeight: 600,
//       fontSize: '0.75rem',
//     },
//     size: 'small',
//     icon: getStatusIcon(status),
//   });

//   return (
//     <Container fluid className="p-0">
//       {/* Header Section */}
//       <Box mb={4}>
//         <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
//           My Dashboard
//         </Typography>
//         <Typography variant="subtitle1" color="text.secondary" gutterBottom>
//           Track and manage your naming requests
//         </Typography>
        
//         {/* Tab Navigation */}
//         <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
//           <Tabs 
//             value={activeTab} 
//             onChange={handleTabChange} 
//             aria-label="dashboard tabs"
//             variant="scrollable"
//             scrollButtons="auto"
//           >
//             <Tab 
//               label="My Requests" 
//               icon={<ViewIcon />} 
//               iconPosition="start"
//             />
//             <Tab 
//               label="Naming Guidelines" 
//               icon={<GuidelinesIcon />} 
//               iconPosition="start"
//             />
//             <Tab 
//               label="Naming Assistant" 
//               icon={<SupportIcon />} 
//               iconPosition="start"
//             />
//           </Tabs>
//         </Box>
//       </Box>

//       {/* Tab Content */}
//       <Box sx={{ mt: 2 }}>
//         {/* Tab 1: My Requests */}
//         {activeTab === 0 && (
//           <>
//             {/* Stats Cards - Bento Grid Layout */}
//             <Row className="g-4 mb-4">
//               <Col xs={12} sm={6} md={3}>
//                 <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` }}>
//                   <CardContent>
//                     <Box display="flex" alignItems="center" justifyContent="space-between">
//                       <Box>
//                         <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
//                           {stats.total}
//                         </Typography>
//                         <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
//                           Total Requests
//                         </Typography>
//                       </Box>
//                       <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
//                         <AssignmentIcon sx={{ color: 'white' }} />
//                       </Avatar>
//                     </Box>
//                   </CardContent>
//                 </Card>
//               </Col>
              
//               <Col xs={12} sm={6} md={3}>
//                 <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})` }}>
//                   <CardContent>
//                     <Box display="flex" alignItems="center" justifyContent="space-between">
//                       <Box>
//                         <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
//                           {stats.pending}
//                         </Typography>
//                         <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
//                           Pending
//                         </Typography>
//                       </Box>
//                       <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
//                         <HourglassEmptyIcon sx={{ color: 'white' }} />
//                       </Avatar>
//                     </Box>
//                   </CardContent>
//                 </Card>
//               </Col>
              
//               <Col xs={12} sm={6} md={3}>
//                 <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})` }}>
//                   <CardContent>
//                     <Box display="flex" alignItems="center" justifyContent="space-between">
//                       <Box>
//                         <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
//                           {stats.approved}
//                         </Typography>
//                         <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
//                           Approved
//                         </Typography>
//                       </Box>
//                       <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
//                         <CheckCircleIcon sx={{ color: 'white' }} />
//                       </Avatar>
//                     </Box>
//                   </CardContent>
//                 </Card>
//               </Col>
              
//               <Col xs={12} sm={6} md={3}>
//                 <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})` }}>
//                   <CardContent>
//                     <Box display="flex" alignItems="center" justifyContent="space-between">
//                       <Box>
//                         <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
//                           {stats.inProgress}
//                         </Typography>
//                         <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
//                           In Progress
//                         </Typography>
//                       </Box>
//                       <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
//                         <AutorenewIcon sx={{ color: 'white' }} />
//                       </Avatar>
//                     </Box>
//                   </CardContent>
//                 </Card>
//               </Col>
//             </Row>
            
//             {/* Main Content - Bento Grid Layout */}
//             <Row className="g-4">
//               {/* My Requests */}
//               <Col xs={12} lg={8}>
//                 <Card sx={{ height: 'fit-content' }}>
//                   <CardContent>
//                     <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
//                       <Typography variant="h5" sx={{ fontWeight: 600 }}>
//                         My Requests
//                       </Typography>
//                       <Button
//                         variant="contained"
//                         color="primary"
//                         startIcon={<AddIcon />}
//                         onClick={() => navigate('/submit-request')}
//                       >
//                         New Request
//                       </Button>
//                     </Box>

//                     {/* Search and Filter */}
//                     <Box mb={3}>
//                       <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
//                         <TextField
//                           placeholder="Search requests..."
//                           value={searchQuery}
//                           onChange={(e) => setSearchQuery(e.target.value)}
//                           InputProps={{
//                             startAdornment: (
//                               <InputAdornment position="start">
//                                 <SearchIcon />
//                               </InputAdornment>
//                             ),
//                           }}
//                           sx={{ flexGrow: 1 }}
//                         />
//                         <TextField
//                           select
//                           label="Status"
//                           value={statusFilter}
//                           onChange={(e) => setStatusFilter(e.target.value)}
//                           SelectProps={{ native: true }}
//                           sx={{ minWidth: 120 }}
//                         >
//                           <option value="all">All Status</option>
//                           <option value="pending">Pending</option>
//                           <option value="in-progress">In Progress</option>
//                           <option value="approved">Approved</option>
//                           <option value="rejected">Rejected</option>
//                         </TextField>
//                       </Stack>
//                     </Box>

//                     <Divider sx={{ mb: 3 }} />

//                     {/* Requests Table */}
//                     {error && (
//                       <Alert severity="error" sx={{ mb: 3 }}>
//                         {error}
//                       </Alert>
//                     )}

//                     {loading ? (
//                       <Box display="flex" justifyContent="center" py={4}>
//                         <CircularProgress />
//                       </Box>
//                     ) : filteredRequests.length === 0 ? (
//                       <Alert severity="info" sx={{ mb: 3 }}>
//                         No requests found. Try adjusting your search or filter criteria.
//                       </Alert>
//                     ) : (
//                       <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
//                         <Table>
//                           <TableHead>
//                             <TableRow>
//                               <TableCell>Request</TableCell>
//                               <TableCell>Status</TableCell>
//                               <TableCell>Submitted</TableCell>
//                               <TableCell align="right">Actions</TableCell>
//                             </TableRow>
//                           </TableHead>
//                           <TableBody>
//                             {filteredRequests.map((request) => (
//                               <TableRow 
//                                 key={request._id} 
//                                 hover
//                                 sx={{ 
//                                   cursor: 'pointer',
//                                   '&:hover': { backgroundColor: 'action.hover' }
//                                 }}
//                                 onClick={() => handleViewRequest(request._id)}
//                               >
//                                 <TableCell>
//                                   <Box>
//                                     <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
//                                       {request.title || 'Untitled Request'}
//                                     </Typography>
//                                     <Typography variant="body2" color="text.secondary" noWrap>
//                                       {typeof request.description === 'object' 
//                                         ? request.description?.text || 'No description' 
//                                         : request.description || 'No description'
//                                       }
//                                     </Typography>
//                                   </Box>
//                                 </TableCell>
//                                 <TableCell>
//                                   <Chip {...getStatusChipProps(request.status)} />
//                                 </TableCell>
//                                 <TableCell>
//                                   <Typography variant="body2">
//                                     {formatDate(request.createdAt)}
//                                   </Typography>
//                                 </TableCell>
//                                 <TableCell align="right">
//                                   <Tooltip title="View Details">
//                                     <IconButton 
//                                       size="small"
//                                       onClick={(e) => {
//                                         e.stopPropagation();
//                                         handleViewRequest(request._id);
//                                       }}
//                                     >
//                                       <ViewIcon />
//                                     </IconButton>
//                                   </Tooltip>
//                                 </TableCell>
//                               </TableRow>
//                             ))}
//                           </TableBody>
//                         </Table>
//                       </TableContainer>
//                     )}
//                   </CardContent>
//                 </Card>
//               </Col>

//               {/* Sidebar - Quick Actions and Archive */}
//               <Col xs={12} lg={4}>
//                 <Stack spacing={3}>
//                   {/* Quick Actions Card */}
//                   <Card>
//                     <CardContent>
//                       <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
//                         Quick Actions
//                       </Typography>
//                       <Divider sx={{ mb: 2 }} />
//                       <Stack spacing={2}>
//                         <Button
//                           variant="outlined"
//                           color="primary"
//                           startIcon={<AddIcon />}
//                           fullWidth
//                           onClick={() => navigate('/submit-request')}
//                         >
//                           New Request
//                         </Button>
//                         <Button
//                           variant="outlined"
//                           color="secondary"
//                           startIcon={<ArchiveIcon />}
//                           fullWidth
//                         >
//                           Browse Archive
//                         </Button>
//                       </Stack>
//                     </CardContent>
//                   </Card>
                  
//                   {/* Recent Activity Card */}
//                   <Card>
//                     <CardContent>
//                       <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
//                         Recent Activity
//                       </Typography>
//                       <Divider sx={{ mb: 2 }} />
//                       {userRequests.length === 0 ? (
//                         <Alert severity="info">
//                           No recent activity to display.
//                         </Alert>
//                       ) : (
//                         <Stack spacing={2}>
//                           {userRequests.slice(0, 3).map((request) => (
//                             <Box 
//                               key={request._id}
//                               sx={{ 
//                                 p: 1.5, 
//                                 borderRadius: 1, 
//                                 bgcolor: 'background.default',
//                                 cursor: 'pointer',
//                                 '&:hover': { bgcolor: 'action.hover' }
//                               }}
//                               onClick={() => handleViewRequest(request._id)}
//                             >
//                               <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
//                                 {request.title || 'Untitled Request'}
//                               </Typography>
//                               <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
//                                 <Chip {...getStatusChipProps(request.status)} />
//                                 <Typography variant="caption" color="text.secondary">
//                                   {formatDate(request.createdAt)}
//                                 </Typography>
//                               </Box>
//                             </Box>
//                           ))}
//                         </Stack>
//                       )}
//                     </CardContent>
//                   </Card>
//                 </Stack>
//               </Col>
//             </Row>
//           </>
//         )}
        
//         {/* Tab 2: Naming Guidelines */}
//         {activeTab === 1 && (
//           <NamingGuidelines />
//         )}
        
//         {/* Tab 3: Naming Assistant */}
//         {activeTab === 2 && (
//           <HelperAgent />
//         )}
//       </Box>

//       {/* Request Details Modal */}
//       <RequestDetailsModal
//         open={detailsModalOpen}
//         onClose={handleCloseDetailsModal}
//         requestId={selectedRequestId}
//       />
//     </Container>
//   );
// };

// export default ProfessionalSubmitterDashboard;
