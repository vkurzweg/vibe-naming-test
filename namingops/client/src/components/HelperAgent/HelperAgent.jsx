import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Support as SupportIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  QuestionAnswer as QuestionIcon,
} from '@mui/icons-material';

// Sample predefined responses
const PREDEFINED_RESPONSES = [
  {
    question: "How long does the naming review process take?",
    answer: "The typical naming review process takes 5-7 business days. High priority requests may be expedited to 2-3 business days."
  },
  {
    question: "What information should I include in my request?",
    answer: "Include the product/feature description, target audience, any specific requirements, and at least 3 proposed name options if you have them."
  },
  {
    question: "How can I check the status of my request?",
    answer: "You can view the status of all your requests on the dashboard. Each request will show its current status (submitted, under review, approved, etc.)."
  },
  {
    question: "Who reviews naming requests?",
    answer: "Naming requests are reviewed by a team of branding specialists, legal advisors, and relevant stakeholders from product teams."
  },
];

const HelperAgent = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      text: "Hello! I'm your naming assistant. How can I help you with your naming request today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = {
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Simulate agent response after a short delay
    setTimeout(() => {
      // Check for predefined responses first
      const matchedResponse = PREDEFINED_RESPONSES.find(
        item => inputValue.toLowerCase().includes(item.question.toLowerCase().split(' ')[0])
      );
      
      const agentMessage = {
        sender: 'agent',
        text: matchedResponse 
          ? matchedResponse.answer 
          : "Thanks for your question. This is a placeholder assistant. In a production environment, this would connect to a real AI assistant to help with naming questions.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleClearChat = () => {
    setMessages([
      {
        sender: 'agent',
        text: "Hello! I'm your naming assistant. How can I help you with your naming request today?",
        timestamp: new Date()
      }
    ]);
  };
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, flexGrow: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <SupportIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              Naming Assistant
            </Typography>
          </Box>
          <Tooltip title="Reset conversation">
            <IconButton size="small" onClick={handleClearChat}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
      
      <Divider />
      
      {/* Chat messages */}
      <Box sx={{ 
        p: 2, 
        flexGrow: 1, 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 300,
      }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                maxWidth: '80%',
                borderRadius: 2,
                bgcolor: message.sender === 'user' ? 'primary.light' : 'background.paper',
              }}
            >
              <Box display="flex" alignItems="center" mb={0.5}>
                <Avatar
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    mr: 1,
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                  }}
                >
                  {message.sender === 'user' ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  {message.sender === 'user' ? 'You' : 'Assistant'} • {formatTime(message.timestamp)}
                </Typography>
              </Box>
              <Typography variant="body2">{message.text}</Typography>
            </Paper>
          </Box>
        ))}
      </Box>
      
      <Divider />
      
      {/* Quick questions */}
      <Box sx={{ p: 1.5, bgcolor: 'background.default' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <QuestionIcon fontSize="small" sx={{ mr: 0.5 }} />
          Suggested questions:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {PREDEFINED_RESPONSES.map((item, index) => (
            <Chip 
              key={index}
              label={item.question}
              size="small"
              onClick={() => {
                setInputValue(item.question);
              }}
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
        </Box>
      </Box>
      
      {/* Input area */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center">
          <TextField
            fullWidth
            placeholder="Ask a question about naming..."
            variant="outlined"
            size="small"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default HelperAgent;
