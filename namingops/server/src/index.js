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
const { isAuthenticated } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const nameRequestRoutes = require('./routes/namingRequests');
const userRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');
const formConfigurationRoutes = require('./routes/formConfigurations');

const app = express();
const httpServer = createServer(app);

// Configure CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://naming-hq-e263f470c8e7.herokuapp.com',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count'],
  maxAge: 600
};
// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : corsOptions.origin,
    methods: corsOptions.methods,
    credentials: corsOptions.credentials,
    allowedHeaders: corsOptions.allowedHeaders
  }
});

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// In production, only allow specific origins


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
app.use(passport.session());

// Initialize Passport configuration
require('./config/passport');

// Socket.io
io.on('connection', (socket) => {
  logger.info('New client connected');
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/name-requests', nameRequestRoutes);
// Duplicate mount without /api prefix to accommodate proxy stripping in development
if (process.env.NODE_ENV === 'development') {
  app.use('/v1/name-requests', nameRequestRoutes);
}
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/form-configurations', formConfigurationRoutes);
if (process.env.NODE_ENV === 'development') {
  app.use('/v1/form-configurations', formConfigurationRoutes);
}

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

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route is working!' });
});

const path = require('path');
const buildPath = path.resolve(__dirname, '..', 'build');

app.use(express.static(buildPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(buildPath, 'index.html'));
  }
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Prevent multiple server starts
  if (httpServer.listening) {
    logger.warn('Server is already running');
    return;
  }

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
    const { mongoose } = require('./config/db');
    await mongoose.connection.close();
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

module.exports = { app, httpServer };
