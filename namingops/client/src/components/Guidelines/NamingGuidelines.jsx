import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import {
  CheckCircleOutline,
  HighlightOff,
  Lightbulb,
  MenuBook,
  Category,
  Translate,
  Psychology,
} from '@mui/icons-material';

const NamingGuidelines = () => {
  return (
    <Card sx={{ height: '100%', mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <MenuBook color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>
            Naming Guidelines
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Following these guidelines will help ensure your naming request is processed quickly and efficiently.
        </Alert>
        
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Best Practices
        </Typography>
        
        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckCircleOutline color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Be descriptive and memorable" 
              secondary="Names should convey the essence of your product or feature"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleOutline color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Consider global implications" 
              secondary="Ensure the name works across different languages and cultures"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleOutline color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Check domain availability" 
              secondary="Verify that related domains are available for registration"
            />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          What to Avoid
        </Typography>
        
        <List dense>
          <ListItem>
            <ListItemIcon>
              <HighlightOff color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Generic or descriptive-only terms" 
              secondary="These are difficult to trademark and protect"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <HighlightOff color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Similar to competitor names" 
              secondary="Avoid names that could be confused with existing products"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <HighlightOff color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Difficult to pronounce or spell" 
              secondary="Names should be easy to say and remember"
            />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Naming Categories
        </Typography>
        
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          <Chip icon={<Category fontSize="small" />} label="Descriptive" />
          <Chip icon={<Psychology fontSize="small" />} label="Evocative" />
          <Chip icon={<Translate fontSize="small" />} label="Invented" />
          <Chip icon={<Lightbulb fontSize="small" />} label="Lexical" />
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          For more detailed guidelines, please refer to the company naming handbook or contact the branding team.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default NamingGuidelines;
