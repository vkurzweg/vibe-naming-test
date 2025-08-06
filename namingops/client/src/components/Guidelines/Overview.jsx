import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  Paper,
  Box,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Function to handle the exponential backoff for API calls
const withExponentialBackoff = async (func, maxRetries = 5, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await func();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

const NamingGuidelines = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAccordion, setExpandedAccordion] = useState(false);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Enhanced naming guidelines data with better organization
  const namingGuidelines = [
    {
      category: 'General Principles',
      icon: <InfoOutlinedIcon color="primary" />,
      items: [
        {
          title: 'Clarity and Simplicity',
          description: 'Names should be clear, concise, and easily understood by all stakeholders.',
          examples: ['UserAccount', 'PaymentProcessor', 'DataValidator'],
          avoid: ['UberComplexUserAccountManagementSystem', 'Thing', 'Stuff']
        },
        {
          title: 'Consistency',
          description: 'Follow established naming conventions throughout the project.',
          examples: ['getUserData()', 'setUserData()', 'deleteUserData()'],
          avoid: ['fetchUser()', 'updateUserInfo()', 'removeUserRecord()']
        },
        {
          title: 'Meaningful Context',
          description: 'Names should provide context about their purpose and usage.',
          examples: ['isEmailValid', 'calculateTotalPrice', 'formatDateString'],
          avoid: ['check()', 'process()', 'handle()']
        }
      ]
    },
    {
      category: 'Technical Standards',
      icon: <LightbulbOutlinedIcon color="secondary" />,
      items: [
        {
          title: 'CamelCase for Functions and Variables',
          description: 'Use camelCase for function names and variable declarations.',
          examples: ['calculateTotal', 'userPreferences', 'isAuthenticated'],
          avoid: ['calculate_total', 'user-preferences', 'IsAuthenticated']
        },
        {
          title: 'PascalCase for Classes and Components',
          description: 'Use PascalCase for class names and React components.',
          examples: ['UserProfile', 'PaymentGateway', 'NavigationMenu'],
          avoid: ['userProfile', 'payment_gateway', 'navigation-menu']
        },
        {
          title: 'UPPER_CASE for Constants',
          description: 'Use UPPER_CASE with underscores for constants.',
          examples: ['API_BASE_URL', 'MAX_RETRY_ATTEMPTS', 'DEFAULT_TIMEOUT'],
          avoid: ['apiBaseUrl', 'maxRetryAttempts', 'defaultTimeout']
        }
      ]
    },
    {
      category: 'Best Practices',
      icon: <CheckCircleOutlineIcon color="success" />,
      items: [
        {
          title: 'Avoid Abbreviations',
          description: 'Use full words instead of abbreviations unless they are widely understood.',
          examples: ['userAuthentication', 'databaseConnection', 'httpRequest'],
          avoid: ['userAuth', 'dbConn', 'httpReq']
        },
        {
          title: 'Use Descriptive Boolean Names',
          description: 'Boolean variables should clearly indicate what they represent.',
          examples: ['isLoading', 'hasPermission', 'canEdit', 'shouldUpdate'],
          avoid: ['loading', 'permission', 'edit', 'update']
        },
        {
          title: 'Function Names Should Be Verbs',
          description: 'Function names should describe what the function does.',
          examples: ['calculateDiscount', 'validateEmail', 'renderComponent'],
          avoid: ['discount', 'email', 'component']
        }
      ]
    }
  ];

  const commonMistakes = [
    {
      mistake: 'Using single letter variables',
      example: 'for (let i = 0; i < users.length; i++)',
      better: 'for (let userIndex = 0; userIndex < users.length; userIndex++)',
      severity: 'medium'
    },
    {
      mistake: 'Inconsistent naming patterns',
      example: 'getUserData(), fetch_user_profile(), GetUserSettings()',
      better: 'getUserData(), getUserProfile(), getUserSettings()',
      severity: 'high'
    },
    {
      mistake: 'Overly generic names',
      example: 'data, info, temp, obj',
      better: 'userData, userInfo, temporaryFile, userObject',
      severity: 'high'
    }
  ];

  const filteredGuidelines = namingGuidelines.filter(category =>
    category.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.items.some(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            mb: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Naming Guidelines & Best Practices
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}
        >
          Comprehensive guidelines for consistent and meaningful naming conventions across all projects
        </Typography>

        {/* Search Bar */}
        <Box sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search guidelines..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchOutlinedIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {namingGuidelines.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categories
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
              {namingGuidelines.reduce((acc, cat) => acc + cat.items.length, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Guidelines
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
              {commonMistakes.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Common Mistakes
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Guidelines Sections */}
      <Box sx={{ mb: 4 }}>
        {filteredGuidelines.map((category, categoryIndex) => (
          <Accordion
            key={categoryIndex}
            expanded={expandedAccordion === `panel${categoryIndex}`}
            onChange={handleAccordionChange(`panel${categoryIndex}`)}
            sx={{
              mb: 2,
              borderRadius: 2,
              '&:before': { display: 'none' },
              boxShadow: theme.shadows[2],
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: '8px 8px 0 0',
                '&.Mui-expanded': {
                  borderRadius: '8px 8px 0 0',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {category.icon}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {category.category}
                </Typography>
                <Chip 
                  label={`${category.items.length} items`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {category.items.map((item, itemIndex) => (
                  <Grid item xs={12} key={itemIndex}>
                    <Card variant="outlined" sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                        {item.description}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'success.main', fontWeight: 600 }}>
                              ✓ Good Examples:
                            </Typography>
                            <List dense>
                              {item.examples.map((example, exampleIndex) => (
                                <ListItem key={exampleIndex} sx={{ py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 24 }}>
                                    <CheckCircleOutlineIcon color="success" fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={
                                      <Typography 
                                        variant="body2" 
                                        component="code" 
                                        sx={{ 
                                          backgroundColor: theme.palette.success.light,
                                          color: theme.palette.success.contrastText,
                                          px: 1,
                                          py: 0.5,
                                          borderRadius: 1,
                                          fontFamily: 'monospace'
                                        }}
                                      >
                                        {example}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'error.main', fontWeight: 600 }}>
                              ✗ Avoid:
                            </Typography>
                            <List dense>
                              {item.avoid.map((avoid, avoidIndex) => (
                                <ListItem key={avoidIndex} sx={{ py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 24 }}>
                                    <CancelOutlinedIcon color="error" fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={
                                      <Typography 
                                        variant="body2" 
                                        component="code" 
                                        sx={{ 
                                          backgroundColor: theme.palette.error.light,
                                          color: theme.palette.error.contrastText,
                                          px: 1,
                                          py: 0.5,
                                          borderRadius: 1,
                                          fontFamily: 'monospace'
                                        }}
                                      >
                                        {avoid}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Common Mistakes Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Common Mistakes to Avoid
        </Typography>
        <Grid container spacing={3}>
          {commonMistakes.map((mistake, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Alert 
                severity={mistake.severity === 'high' ? 'error' : 'warning'}
                sx={{ 
                  height: '100%',
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {mistake.mistake}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'error.main' }}>
                    ❌ Avoid:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    component="code" 
                    sx={{ 
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      display: 'block',
                      mb: 2
                    }}
                  >
                    {mistake.example}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: 'success.main' }}>
                    ✅ Better:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    component="code" 
                    sx={{ 
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      display: 'block'
                    }}
                  >
                    {mistake.better}
                  </Typography>
                </Box>
              </Alert>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Call to Action */}
      <Paper 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Need Help with Naming?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Our team is here to help you implement these guidelines in your projects.
        </Typography>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            },
          }}
        >
          Submit a Naming Request
        </Button>
      </Paper>
    </Container>
  );
};

export default NamingGuidelines;
