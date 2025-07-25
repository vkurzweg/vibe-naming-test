const winston = require('winston');
const { combine, timestamp, printf, colorize, align, json } = winston.format;
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  const log = `${timestamp} [${level}]: ${stack || message}`;
  return log;
});

// Create a custom format for console output
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  align(),
  logFormat
);

// Create a format for file output (JSON format)
const fileFormat = combine(
  timestamp(),
  json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.splat()
  ),
  defaultMeta: { service: 'namingops-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
      zippedArchive: true
    }),
    
    // File transport for error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
      zippedArchive: true
    })
  ],
  exitOnError: false
});

// Create a stream for morgan to use for HTTP request logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Handle uncaught exceptions
if (process.env.NODE_ENV !== 'development') {
  logger.exceptions.handle(
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat
    })
  );
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    throw reason;
  });
}

// Create a child logger with additional metadata
logger.child = (metadata) => {
  return logger.child(metadata);
};

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

module.exports = logger;
