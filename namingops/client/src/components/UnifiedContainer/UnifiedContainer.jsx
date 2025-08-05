import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Container,
  Typography,
  useTheme,
  Grid,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Tooltip,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Search,
  FilterList,
  Sort,
  ViewModule,
  ViewList,
  Insights,
  Assessment,
  Info,
  AccountCircle,
  Settings,
  Logout,
  SwapHoriz,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { 
  selectAllRequests, 
  selectIsLoading,
  getMyRequests
} from '../../features/requests/requestsSlice';
import { 
  loadActiveFormConfig
} from '../../features/formConfig/formConfigSlice';
import { logout } from '../../features/auth/authSlice';
import { useEffectiveRole } from '../../hooks/useEffectiveRole';
import { DevRoleContext } from '../../context/DevRoleContext';
import ContentArea from './ContentArea';
import ContextBar from './ContextBar';
import StatusBar from './StatusBar';
import AudioFeedback from '../AudioFeedback/AudioFeedback';
import { BentoGrid, BentoMetric, BentoStatus, BentoChart, BentoActivity } from '../Layout/BentoGrid';
import { StatusChip, StatusBadge } from '../StatusIndicators/VisualStatusIndicators';
import {
  FadeIn,
  SlideIn,
  StaggerContainer,
  HoverAnimation,
  PageTransition,
  AnimatedBox,
} from '../Animations/FramerMotionComponents';
import {
  DataInsights,
  InteractiveSearch,
  AdvancedFilter,
  InteractiveSort,
  ViewToggle,
  ProgressIndicator,
} from '../DataStoryTelling/InteractiveDataComponents';

const UnifiedContainer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const effectiveRole = useEffectiveRole();
  const devRoleContext = useContext(DevRoleContext);
  const { user } = useSelector((state) => state.auth);
  
  // Navigation state
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Dashboard state
  const [currentContext, setCurrentContext] = useState('overview');
  const [keyMetrics, setKeyMetrics] = useState({});
  
  // Data storytelling state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [showDataInsights, setShowDataInsights] = useState(true);
  
  // Get data from Redux store
  const requests = useSelector(selectAllRequests);
  const isLoading = useSelector(selectIsLoading);
  const activeFormConfig = useSelector(state => state.formConfig?.activeFormConfig);
  
  // Filtered and sorted data for data storytelling
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = [...requests];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(request => 
        (request.requestType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.status || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.submittedBy || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(request => request[key] === value);
      }
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      
      if (sortBy === 'createdAt') {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
      }
      
      if (typeof aVal === 'string') {
        return sortOrder === 'desc' 
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    return filtered;
  }, [requests, searchQuery, filters, sortBy, sortOrder]);
  
  // Available filter options
  const availableFilters = useMemo(() => ({
    status: {
      label: 'Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'brand_review', label: 'Brand Review' },
        { value: 'legal_review', label: 'Legal Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    requestType: {
      label: 'Request Type',
      options: [
        { value: 'product_name', label: 'Product Name' },
        { value: 'brand_name', label: 'Brand Name' },
        { value: 'campaign_name', label: 'Campaign Name' },
        { value: 'feature_name', label: 'Feature Name' },
      ],
    },
  }), []);
  
  // Sort options
  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'status', label: 'Status' },
    { value: 'requestType', label: 'Request Type' },
    { value: 'submittedBy', label: 'Submitted By' },
  ];
  
  // Search suggestions
  const searchSuggestions = useMemo(() => {
    const suggestions = new Set();
    requests.forEach(request => {
      if (request.requestType) suggestions.add(request.requestType);
      if (request.status) suggestions.add(request.status);
      if (request.submittedBy) suggestions.add(request.submittedBy);
    });
    return Array.from(suggestions);
  }, [requests]);

  // Initialize data on mount and role change
  useEffect(() => {
    dispatch(getMyRequests());
    dispatch(loadActiveFormConfig());
  }, [dispatch, effectiveRole]);

  // Calculate key metrics based on role and data
  useEffect(() => {
    const calculateMetrics = () => {
      const total = requests.length;
      const pending = requests.filter(r => ['submitted', 'under_review'].includes(r.status)).length;
      const approved = requests.filter(r => r.status === 'approved').length;
      const urgent = requests.filter(r => {
        if (!r.createdAt) return false;
        const daysSinceCreated = Math.floor((Date.now() - new Date(r.createdAt)) / (1000 * 60 * 60 * 24));
        return daysSinceCreated > 5 && ['submitted', 'under_review'].includes(r.status);
      }).length;

      // Role-specific metrics
      switch (effectiveRole) {
        case 'admin':
          setKeyMetrics({
            total,
            pending,
            approved,
            urgent,
            systemHealth: 'Operational',
            activeUsers: 12, // Placeholder
          });
          break;
        case 'reviewer':
          setKeyMetrics({
            pending,
            urgent,
            approved,
            avgReviewTime: '2.3 days', // Placeholder
          });
          break;
        case 'submitter': {
          // For submitters, use all requests since getMyRequests() already filters by user
          setKeyMetrics({
            myTotal: requests.length,
            myPending: requests.filter(r => ['submitted', 'under_review', 'pending'].includes(r.status)).length,
            myApproved: requests.filter(r => r.status === 'approved').length,
          });
          break;
        }
        default: {
          setKeyMetrics({});
          break;
        }
      }
    };

    calculateMetrics();
  }, [requests, effectiveRole]);

  // Handle context changes
  const handleContextChange = (newContext) => {
    setCurrentContext(newContext);
  };

  // Navigation handlers
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleRoleMenuOpen = (event) => {
    setRoleMenuAnchor(event.currentTarget);
  };

  const handleRoleMenuClose = () => {
    setRoleMenuAnchor(null);
  };

  const handleRoleChange = (role) => {
    if (devRoleContext?.setRole) {
      devRoleContext.setRole(role);
    }
    handleRoleMenuClose();
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Integrate with theme context when available
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch (action) {
      case 'submit':
        setCurrentContext('submit');
        break;
      case 'review':
        setCurrentContext('review');
        break;
      case 'configure':
        setCurrentContext('configure');
        break;
      case 'archive':
        setCurrentContext('archive');
        break;
      default:
        break;
    }
  };

  // Enhanced dashboard overview with data storytelling
  const renderDashboardOverview = () => {
    const statusItems = [
      { status: 'submitted', label: 'Submitted', count: keyMetrics.pending || 0 },
      { status: 'under_review', label: 'Under Review', count: keyMetrics.urgent || 0 },
      { status: 'approved', label: 'Approved', count: keyMetrics.approved || 0 },
      { status: 'on_hold', label: 'On Hold', count: keyMetrics.onHold || 0 },
    ];

    const recentActivities = filteredAndSortedRequests.slice(0, 5).map(request => ({
      title: `${request.requestType || 'Request'} - ${request.status}`,
      time: request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Recent',
      status: request.status,
    }));

    const completionRate = requests.length > 0 
      ? (requests.filter(r => r.status === 'approved').length / requests.length) * 100 
      : 0;

    return (
      <PageTransition>
        <Box sx={{ mb: 3 }}>
          {/* Interactive Controls */}
          <StaggerContainer>
            <FadeIn delay={0.1}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2, 
                mb: 3,
                p: 3,
                background: theme.custom.gradients.surface,
                borderRadius: theme.custom.bento.borderRadius,
                boxShadow: theme.custom.shadows.card,
              }}>
                <Box sx={{ flex: 1 }}>
                  <InteractiveSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search requests by type, status, or submitter..."
                    suggestions={searchSuggestions}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <InteractiveSort
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(newSortBy, newSortOrder) => {
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                    sortOptions={sortOptions}
                  />
                  <ViewToggle
                    view={viewMode}
                    onViewChange={setViewMode}
                  />
                </Box>
              </Box>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <AdvancedFilter
                filters={filters}
                onFiltersChange={setFilters}
                availableFilters={availableFilters}
              />
            </FadeIn>
          </StaggerContainer>
        </Box>

        <BentoGrid spacing={3} maxWidth="xl">
          {/* Enhanced Key Metrics with Animations */}
          <StaggerContainer>
            <HoverAnimation>
              <BentoMetric
                title="Total Requests"
                value={keyMetrics.total || keyMetrics.myTotal || 0}
                subtitle={effectiveRole === 'submitter' ? 'Your requests' : 'All requests'}
                icon={<DashboardIcon />}
                size="small"
                priority="high"
                trend={`${filteredAndSortedRequests.length} filtered`}
              />
            </HoverAnimation>
            
            <HoverAnimation>
              <BentoMetric
                title="Pending Review"
                value={keyMetrics.pending || keyMetrics.myPending || 0}
                subtitle="Awaiting action"
                icon={<ScheduleIcon />}
                size="small"
                priority="high"
                trend="Needs attention"
              />
            </HoverAnimation>
            
            <HoverAnimation>
              <BentoMetric
                title="Approved"
                value={keyMetrics.approved || keyMetrics.myApproved || 0}
                subtitle="Completed successfully"
                icon={<CheckCircleIcon />}
                size="small"
                priority="high"
                trend={`${Math.round(completionRate)}% completion rate`}
              />
            </HoverAnimation>
            
            <HoverAnimation>
              <BentoMetric
                title="Performance Score"
                value={Math.round(completionRate)}
                subtitle="Overall efficiency"
                icon={<SpeedIcon />}
                size="small"
                priority="medium"
                trend={completionRate > 70 ? 'Excellent' : completionRate > 50 ? 'Good' : 'Needs improvement'}
              />
            </HoverAnimation>
          </StaggerContainer>

          {/* Enhanced Status Overview */}
          <SlideIn direction="left" delay={0.3}>
            <BentoStatus
              title="Request Status Distribution"
              items={statusItems}
              size="wide"
            />
          </SlideIn>

          {/* Data Insights Component */}
          {showDataInsights && (
            <SlideIn direction="right" delay={0.4}>
              <AnimatedBox
                sx={{
                  gridColumn: { xs: '1 / -1', lg: 'span 2' },
                }}
              >
                <DataInsights
                  data={filteredAndSortedRequests}
                  title="Smart Insights"
                  sx={{
                    height: '100%',
                    background: theme.custom.gradients.surface,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                />
              </AnimatedBox>
            </SlideIn>
          )}

          {/* Enhanced Recent Activity */}
          <SlideIn direction="up" delay={0.5}>
            <BentoActivity
              title="Recent Activity Feed"
              activities={recentActivities}
              size="tall"
            />
          </SlideIn>

          {/* Performance Analytics */}
          <SlideIn direction="up" delay={0.6}>
            <BentoChart
              title="Performance Analytics"
              size="large"
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 3,
                width: '100%',
                p: 2,
              }}>
                <ProgressIndicator
                  current={keyMetrics.approved || keyMetrics.myApproved || 0}
                  total={keyMetrics.total || keyMetrics.myTotal || 1}
                  label="Completion Progress"
                  showPercentage
                />
                
                <ProgressIndicator
                  current={Math.min(keyMetrics.urgent || 0, 10)}
                  total={10}
                  label="Response Time Score"
                  showPercentage
                />
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2,
                  color: 'text.secondary',
                  mt: 2,
                }}>
                  <AnalyticsIcon sx={{ fontSize: '3rem', opacity: 0.6 }} />
                  <Typography variant="body2" textAlign="center">
                    Advanced analytics and trend visualization
                  </Typography>
                </Box>
              </Box>
            </BentoChart>
          </SlideIn>
        </BentoGrid>
      </PageTransition>
    );
  };

  // Render Material Design 3 Navigation Header
  const renderNavigationHeader = () => (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: theme.custom.gradients.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left side - Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.01em',
            }}
          >
            Vibe Naming Operations
          </Typography>
        </Box>

        {/* Right side - Navigation Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Theme Toggle */}
          <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton onClick={handleThemeToggle} color="inherit">
              {isDarkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {/* Role Switcher */}
          <Tooltip title="Switch Role">
            <Chip
              label={effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)}
              onClick={handleRoleMenuOpen}
              icon={<SwapHoriz />}
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            />
          </Tooltip>

          {/* User Menu */}
          <Tooltip title="User Menu">
            <IconButton onClick={handleUserMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* User Menu Dropdown */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: theme.custom.bento.borderRadius,
            boxShadow: theme.custom.shadows.card,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" color="text.primary">
            {user?.name || 'Development User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || 'dev@example.com'}
          </Typography>
        </Box>
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Role Menu Dropdown */}
      <Menu
        anchorEl={roleMenuAnchor}
        open={Boolean(roleMenuAnchor)}
        onClose={handleRoleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 150,
            borderRadius: theme.custom.bento.borderRadius,
            boxShadow: theme.custom.shadows.card,
          },
        }}
      >
        {['admin', 'reviewer', 'submitter'].map((role) => (
          <MenuItem
            key={role}
            onClick={() => handleRoleChange(role)}
            selected={role === effectiveRole}
          >
            <ListItemText>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </AppBar>
  );

  return (
    <PageTransition>
      <Box
        sx={{
          minHeight: '100vh',
          background: theme.custom.gradients.background,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Navigation Header */}
        {renderNavigationHeader()}

        <Container maxWidth="xl" sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 3 }}>
          {/* Header with Advanced Material Design 3 Styling */}
          <SlideIn direction="down" delay={0.1}>
            <HoverAnimation>
              <Box
                sx={{
                  p: 4,
                  mb: 3,
                  background: theme.custom.gradients.surface,
                  borderRadius: theme.custom.bento.borderRadius,
                  boxShadow: theme.custom.shadows.card,
                  border: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: theme.custom.gradients.primary,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        mb: 1,
                        background: theme.custom.gradients.primary,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Vibe Naming Operations
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Professional Dashboard
                      </Typography>
                      <StatusChip 
                        status={effectiveRole} 
                        label={effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)}
                        size="small"
                        variant="outlined"
                        animated
                      />
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Development User
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date().toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </HoverAnimation>
          </SlideIn>

          {/* Context Bar with Enhanced Framer Motion */}
          <SlideIn direction="up" delay={0.2}>
            <AnimatedBox
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              sx={{
                mb: 3,
                borderRadius: theme.custom.bento.borderRadius,
                overflow: 'hidden',
                boxShadow: theme.custom.shadows.card,
                background: theme.palette.background.paper,
              }}
            >
              <ContextBar
                role={effectiveRole}
                currentContext={currentContext}
                keyMetrics={keyMetrics}
                onContextChange={handleContextChange}
                onQuickAction={handleQuickAction}
              />
            </AnimatedBox>
          </SlideIn>

          {/* Primary Content Area with Advanced Animations */}
          <FadeIn delay={0.3}>
            <Box sx={{ flex: 1 }}>
              {currentContext === 'overview' ? (
                renderDashboardOverview()
              ) : (
                <SlideIn direction="up" delay={0.1}>
                  <AnimatedBox
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                    sx={{
                      background: theme.palette.background.paper,
                      borderRadius: theme.custom.bento.borderRadius,
                      boxShadow: theme.custom.shadows.card,
                      overflow: 'hidden',
                      minHeight: 400,
                    }}
                  >
                    <ContentArea
                      role={effectiveRole}
                      context={currentContext}
                      requests={filteredAndSortedRequests}
                      isLoading={isLoading}
                      activeFormConfig={activeFormConfig}
                      onContextChange={handleContextChange}
                    />
                  </AnimatedBox>
                </SlideIn>
              )}
            </Box>
          </FadeIn>

          {/* Status Bar with Framer Motion Enhancement */}
          <SlideIn direction="up" delay={0.4}>
            <AnimatedBox
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              sx={{
                mt: 3,
                borderRadius: theme.custom.bento.borderRadius,
                overflow: 'hidden',
                boxShadow: theme.custom.shadows.card,
                background: theme.palette.background.paper,
              }}
            >
              <StatusBar
                role={effectiveRole}
                context={currentContext}
                isLoading={isLoading}
                onQuickAction={handleQuickAction}
              />
            </AnimatedBox>
          </SlideIn>
        </Container>

        {/* Audio Feedback Component */}
        <AudioFeedback />
      </Box>
    </PageTransition>
  );
};

export default UnifiedContainer;
