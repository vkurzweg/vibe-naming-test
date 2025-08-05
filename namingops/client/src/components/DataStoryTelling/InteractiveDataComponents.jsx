import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
  useTheme,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, SlideIn, StaggerContainer } from '../Animations/FramerMotionComponents';

// Interactive Search Component
export const InteractiveSearch = ({ 
  value, 
  onChange, 
  placeholder = "Search requests...",
  suggestions = [],
  ...props 
}) => {
  const theme = useTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onChange('')}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
          },
        }}
        {...props}
      />
      
      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && value && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                mt: 1,
                maxHeight: 200,
                overflowY: 'auto',
                boxShadow: theme.custom.shadows.modal,
              }}
            >
              {suggestions
                .filter(s => s.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 5)
                .map((suggestion, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                    onClick={() => {
                      onChange(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    <Typography variant="body2">{suggestion}</Typography>
                  </Box>
                ))}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

// Advanced Filter Component
export const AdvancedFilter = ({ 
  filters, 
  onFiltersChange, 
  availableFilters = {},
  ...props 
}) => {
  const theme = useTheme();
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (filterKey, value) => {
    onFiltersChange({
      ...filters,
      [filterKey]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Tooltip title="Toggle Filters">
          <IconButton
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              backgroundColor: showFilters ? theme.palette.primary.main : 'transparent',
              color: showFilters ? theme.palette.primary.contrastText : theme.palette.text.primary,
              '&:hover': {
                backgroundColor: showFilters 
                  ? theme.palette.primary.dark 
                  : theme.palette.action.hover,
              },
            }}
          >
            <FilterIcon />
          </IconButton>
        </Tooltip>
        
        {activeFilterCount > 0 && (
          <FadeIn>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </Typography>
              <Tooltip title="Clear All Filters">
                <IconButton size="small" onClick={clearFilters}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </FadeIn>
        )}
      </Box>

      <AnimatePresence>
        {showFilters && (
          <SlideIn direction="down">
            <Card sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Filter Options
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {Object.entries(availableFilters).map(([key, config]) => (
                  <FormControl key={key} size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>{config.label}</InputLabel>
                    <Select
                      value={filters[key] || ''}
                      onChange={(e) => handleFilterChange(key, e.target.value)}
                      label={config.label}
                    >
                      <MenuItem value="">
                        <em>All</em>
                      </MenuItem>
                      {config.options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ))}
              </Box>
              
              {/* Active Filters Display */}
              {activeFilterCount > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Active Filters:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(filters)
                      .filter(([_, value]) => value)
                      .map(([key, value]) => (
                        <Chip
                          key={key}
                          label={`${availableFilters[key]?.label}: ${value}`}
                          onDelete={() => handleFilterChange(key, '')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                  </Box>
                </Box>
              )}
            </Card>
          </SlideIn>
        )}
      </AnimatePresence>
    </Box>
  );
};

// Interactive Sort Component
export const InteractiveSort = ({ 
  sortBy, 
  sortOrder, 
  onSortChange, 
  sortOptions = [],
  ...props 
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value, sortOrder)}
          label="Sort By"
          startAdornment={<SortIcon sx={{ mr: 1, color: 'action.active' }} />}
        >
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <ToggleButtonGroup
        value={sortOrder}
        exclusive
        onChange={(_, newOrder) => newOrder && onSortChange(sortBy, newOrder)}
        size="small"
      >
        <ToggleButton value="asc">
          <Tooltip title="Ascending">
            <TrendingUpIcon />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="desc">
          <Tooltip title="Descending">
            <TrendingDownIcon />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

// View Toggle Component
export const ViewToggle = ({ view, onViewChange, ...props }) => {
  return (
    <ToggleButtonGroup
      value={view}
      exclusive
      onChange={(_, newView) => newView && onViewChange(newView)}
      size="small"
    >
      <ToggleButton value="list">
        <Tooltip title="List View">
          <ListViewIcon />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="grid">
        <Tooltip title="Grid View">
          <GridViewIcon />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

// Data Insights Component
export const DataInsights = ({ data = [], title = "Insights", ...props }) => {
  const theme = useTheme();
  
  const insights = useMemo(() => {
    if (!data.length) return [];
    
    const total = data.length;
    const statusCounts = data.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    
    const mostCommonStatus = Object.entries(statusCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    const recentItems = data.filter(item => {
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(item.createdAt || Date.now())) / (1000 * 60 * 60 * 24)
      );
      return daysSinceCreated <= 7;
    }).length;
    
    const urgentItems = data.filter(item => {
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(item.createdAt || Date.now())) / (1000 * 60 * 60 * 24)
      );
      return daysSinceCreated > 5 && ['submitted', 'under_review'].includes(item.status);
    }).length;
    
    return [
      {
        label: 'Total Items',
        value: total,
        icon: <BarChartIcon />,
        color: theme.palette.info.main,
      },
      {
        label: 'Most Common Status',
        value: mostCommonStatus ? `${mostCommonStatus[0]} (${mostCommonStatus[1]})` : 'N/A',
        icon: <PieChartIcon />,
        color: theme.palette.success.main,
      },
      {
        label: 'Recent (7 days)',
        value: recentItems,
        icon: <TimelineIcon />,
        color: theme.palette.primary.main,
      },
      {
        label: 'Needs Attention',
        value: urgentItems,
        icon: <TrendingUpIcon />,
        color: urgentItems > 0 ? theme.palette.warning.main : theme.palette.success.main,
      },
    ];
  }, [data, theme]);

  return (
    <Card sx={{ p: 3, ...props.sx }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BarChartIcon />
        {title}
      </Typography>
      
      <StaggerContainer>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          {insights.map((insight, index) => (
            <FadeIn key={insight.label} delay={index * 0.1}>
              <Card
                variant="outlined"
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderColor: insight.color,
                  backgroundColor: `${insight.color}08`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: `${insight.color}15`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ color: insight.color, mb: 1 }}>
                  {insight.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {insight.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {insight.label}
                </Typography>
              </Card>
            </FadeIn>
          ))}
        </Box>
      </StaggerContainer>
    </Card>
  );
};

// Progress Indicator Component
export const ProgressIndicator = ({ 
  current, 
  total, 
  label = "Progress",
  showPercentage = true,
  ...props 
}) => {
  const theme = useTheme();
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <Box sx={{ width: '100%', ...props.sx }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {showPercentage && (
          <Typography variant="body2" color="text.secondary">
            {Math.round(percentage)}%
          </Typography>
        )}
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.palette.action.hover,
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background: theme.custom.gradients.primary,
          },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {current}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {total}
        </Typography>
      </Box>
    </Box>
  );
};

// Contextual Tooltip Component
export const ContextualTooltip = ({ 
  title, 
  description, 
  data = {},
  children,
  ...props 
}) => {
  const theme = useTheme();
  
  const tooltipContent = (
    <Box sx={{ p: 1, maxWidth: 300 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          {description}
        </Typography>
      )}
      {Object.keys(data).length > 0 && (
        <Box sx={{ mt: 1 }}>
          {Object.entries(data).map(([key, value]) => (
            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {key}:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
  
  return (
    <Tooltip
      title={tooltipContent}
      arrow
      placement="top"
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.custom.shadows.modal,
            borderRadius: 2,
          },
        },
        arrow: {
          sx: {
            color: theme.palette.background.paper,
            '&::before': {
              border: `1px solid ${theme.palette.divider}`,
            },
          },
        },
      }}
      {...props}
    >
      {children}
    </Tooltip>
  );
};

export default {
  InteractiveSearch,
  AdvancedFilter,
  InteractiveSort,
  ViewToggle,
  DataInsights,
  ProgressIndicator,
  ContextualTooltip,
};
