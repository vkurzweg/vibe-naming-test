const logger = require('../utils/logger');


/**
 * Custom error class for handling application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Set default values for error response
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Log the error
  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  // In development, log the full error stack
  if (process.env.NODE_ENV === 'development') {
    logger.error('Error Stack:', err.stack);
    
    // Send detailed error response in development
    return res.status(err.statusCode).json({
      success: false,
      error: {
        status: err.status,
        statusCode: err.statusCode,
        message: err.message,
        stack: err.stack,
        ...(err.errors && { errors: err.errors })
      }
    });
  }
  
  // Handle specific error types
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your token has expired. Please log in again.'
    });
  }
  
  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => ({
      field: el.path,
      message: el.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  // Handle MongoDB duplicate field errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    
    return res.status(400).json({
      success: false,
      message,
      field
    });
  }
  
  // Handle file upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }
  
  // Handle invalid MongoDB IDs
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }
  
  // Handle operational errors (trusted errors)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }
  
  // Log unknown errors
  logger.error('UNHANDLED ERROR 💥', err);
  
  // Send generic error response in production
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });};

// 404 Not Found handler
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`
  });
};

// Catch unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  // Exit the process without trying to close the server
  process.exit(1);
});


// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  // Exit the process without trying to close the server
  process.exit(1);
});

module.exports = {
  AppError,
  errorHandler,
  notFound
};
