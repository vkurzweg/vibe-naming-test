const { connectToDatabase } = require('../config/db');
const logger = require('./logger');

/**
 * Initializes the database connection when the server starts
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
  try {
    await connectToDatabase();
    logger.info('Database connection initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database connection:', error);
    // Exit the process if we can't connect to the database
    process.exit(1);
  }
}

module.exports = initializeDatabase;
