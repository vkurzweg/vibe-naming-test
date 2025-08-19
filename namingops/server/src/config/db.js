const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Use environment variable with fallback
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://namingTeam:N5cwjrwqjT3G3uhB@cluster0.w4aajkm.mongodb.net/naming-ops?retryWrites=true&w=majority&appName=NamingOps";

// Configure Mongoose to use ES6 Promises
mongoose.Promise = global.Promise;

// Connection options
const options = {
  // Timeouts
  connectTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000,  // 45 seconds
  serverSelectionTimeoutMS: 30000, // 30 seconds
  
  // Connection pooling
  maxPoolSize: 10,
  minPoolSize: 1,
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
  
  // Server API version
  serverApi: {
    version: '1',
    deprecationErrors: true,
  }
};

// Add event listeners
mongoose.connection.on('connecting', () => {
  logger.info('Connecting to MongoDB...');});

mongoose.connection.on('connected', () => {
  logger.info('Successfully connected to MongoDB!');});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error:', error);});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, options);
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', {
      message: error.message,
      code: error.code,
      codeName: error.codeName,
      errorLabels: error.errorLabels,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  connectToDatabase,
  mongoose
};