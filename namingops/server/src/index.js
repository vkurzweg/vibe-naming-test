require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { initializeElasticsearch } = require('./config/elasticsearch');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const initializeDatabase = require('./utils/dbInit');

// Import routes
const authRoutes = require('./routes/auth');
const nameRequestRoutes = require('./routes/nameRequests');
const userRoutes = require('./routes/users');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

// Middleware
// Enable CORS for all routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy
  sessionConfig.cookie.secure = true; // Serve secure cookies
}

app.use(session(sessionConfig));

// Passport middleware
app.use(passport.initialize());
const { initialize: initializePassport, session: passportSession } = require('./config/passport');
initializePassport(passport);
app.use(passport.session());

// Socket.io
io.on('connection', (socket) => {
  logger.info('New client connected');
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/name-requests', nameRequestRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected', // This will be updated by the health check middleware
    environment: process.env.NODE_ENV || 'development'
  };
  res.status(200).json(status);
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Initialize Elasticsearch if enabled
    if (process.env.ELASTICSEARCH_ENABLED === 'true') {
      await initializeElasticsearch();
      logger.info('Elasticsearch initialized');
    }

    // Start HTTP server
    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`CORS allowed origins: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server and exit process
  if (httpServer) {
    httpServer.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Close server and exit process
  if (httpServer) {
    httpServer.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle termination signals
const shutdown = async (signal) => {
  logger.info(`${signal} received: shutting down gracefully...`);
  
  try {
    const { getClient } = require('./config/db');
    const client = getClient();
    await client.close();
    logger.info('MongoDB connection closed');
    
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after timeout
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
startServer();

module.exports = { app, server: httpServer };
