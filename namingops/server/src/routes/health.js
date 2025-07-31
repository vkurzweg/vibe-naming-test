const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

/**
 * @route GET /api/health
 * @description Health check endpoint to verify server and database status
 * @access Public
 */
router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    checks: {
      server: {
        status: 'UP',
        timestamp: new Date().toISOString()
      },
      database: {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        error: null
      }
    }
  };

  // Test MongoDB connection
  let client;
  try {
    const mongoUri = process.env.MONGODB_URI;
    client = new MongoClient(mongoUri, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000
    });

    await client.connect();
    await client.db('admin').command({ ping: 1 });
    
    healthCheck.checks.database.status = 'UP';
    healthCheck.checks.database.timestamp = new Date().toISOString();
    
    // Get MongoDB server info
    const serverStatus = await client.db().admin().serverStatus();
    healthCheck.checks.database.version = serverStatus.version;
    healthCheck.checks.database.host = serverStatus.host;
    
    return res.status(200).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    healthCheck.status = 'DOWN';
    healthCheck.checks.database.error = {
      message: error.message,
      code: error.code,
      codeName: error.codeName
    };
    return res.status(503).json(healthCheck);
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (error) {
        logger.error('Error closing MongoDB client:', error);
      }
    }
  }
});

module.exports = router;
