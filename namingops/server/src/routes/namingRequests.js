// server/src/routes/namingRequests.js
const express = require('express');
const router = express.Router();
const { check, validationResult, query } = require('express-validator');
const NamingRequest = require('../models/NamingRequest');
const NotificationService = require('../services/notificationService');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const { getClient } = require('../config/db');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Constants
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Validation middleware
const validateRequest = [
  check('requestTitle').optional().trim().escape(),
  check('description').optional().trim().escape(),
  check('proposedNames').optional(),
  check('proposedNames.*.name').optional().trim().escape(),
  check('priority').optional().isIn(['low', 'medium', 'high']),
  check('dueDate').optional().isISO8601()
];

// Helper to handle database operations with transactions
async function withTransaction(operation) {
  const client = getClient();
  const session = client.startSession();
  
  try {
    await session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    logger.error('Transaction error:', {
      error: error.message,
      stack: error.stack,
      operation: operation.name || 'anonymous'
    });
    
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    
    // Re-throw the error to be handled by the route handler
    throw error;
  } finally {
    await session.endSession();
  }
}

// Helper to standardize API responses
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function sendError(res, message, statusCode = 400, details = null) {
  const response = { 
    success: false, 
    error: message,
    ...(details && { details })
  };
  return res.status(statusCode).json(response);
}


// Helper function to check MongoDB connection
async function checkMongoDBConnection() {
  try {
    await mongoose.connection.db.command({ ping: 1 });
    return { connected: true };
  } catch (error) {
    logger.error('MongoDB connection check failed:', error);
    return { 
      connected: false, 
      error: error.message,
      stack: error.stack
    };
  }
}

// @route   POST /api/name-requests
// @desc    Create a new naming request
// @access  Private
router.post('/', [isAuthenticated, ...validateRequest], async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Log the incoming request
    logger.info('Received naming request:', {
      body: req.body,
      user: req.user
    });

    // Check MongoDB connection
    const { connected, error: connectionError } = await checkMongoDBConnection();
    if (!connected) {
      logger.error('MongoDB connection not active:', connectionError);
      return res.status(503).json({ 
        success: false, 
        error: 'Database connection not available',
        details: process.env.NODE_ENV === 'development' ? connectionError : undefined
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { requestTitle, description, proposedNames, priority, dueDate, metadata } = req.body;
    
    // In development, use the provided user ID or fall back to the dev user
    const isDev = process.env.NODE_ENV === 'development';
    let requestorId;
    let requestorName;
    
    if (isDev && (!req.user || req.user.id === 'dev-user-id')) {
      // For development, create or get dev user
      const User = mongoose.model('User');
      let devUser = await User.findOne({ email: 'dev@example.com' }).session(session);
      
      if (!devUser) {
        devUser = new User({
          name: 'Development User',
          email: 'dev@example.com',
          role: 'admin',
          isActive: true
        });
        await devUser.save({ session });
      }
      
      requestorId = devUser._id;
      requestorName = devUser.name;
    } else {
      // Use the authenticated user's ID
      requestorId = req.user?.id || new mongoose.Types.ObjectId('64d1c9b3c7a8f4b9d8f3e2a1');
      requestorName = req.user?.name || 'System User';
    }
    
    logger.info('Creating request with:', {
      requestorId,
      requestorName,
      proposedNames: proposedNames ? proposedNames.length : 0,
      metadata: Object.keys(metadata || {})
    });

    // Create the new naming request
    const newRequest = new NamingRequest({
      requestTitle,
      description,
      requestor: requestorId,
      requestorName,
      proposedNames: Array.isArray(proposedNames) ? proposedNames.map(name => ({
        name: name.name,
        description: name.description || '',
        status: 'pending'
      })) : [],
      priority: priority || 'medium',
      dueDate: dueDate || null,
      metadata: metadata || {},
      status: 'draft',
      history: [{
        status: 'draft',
        changedBy: requestorId,
        changedByName: requestorName,
        comment: 'Request created',
        timestamp: new Date()
      }]
    });

    // Save the request
    const savedRequest = await newRequest.save({ session });
    logger.info('Request saved successfully:', savedRequest._id);
    
    // Commit the transaction
    await session.commitTransaction();
    
    // Populate the response - without trying to populate fields that don't exist
    const populatedRequest = await NamingRequest.findById(savedRequest._id);
    
    logger.info('Sending success response for request:', savedRequest._id);
    
    res.status(201).json({
      success: true,
      data: populatedRequest
    });
    
  } catch (error) {
    // If we get here, something went wrong
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    
    logger.error('Error creating naming request:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors,
      stack: error.stack
    });
    
    // Send appropriate error response
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: 'Duplicate entry',
        field: Object.keys(error.keyPattern)[0],
        value: Object.values(error.keyValue)[0]
      });
    }
    
    // For all other errors
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});

// @route   GET /api/name-requests
// @desc    Get all naming requests with filtering and pagination
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // TODO: Add role-based filtering. For now, returns all.
    const requests = await NamingRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/name-requests/search
// @desc    Search for approved naming requests
// @access  Private
router.get('/search', isAuthenticated, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ msg: 'Search query is required' });
    }

    const requests = await NamingRequest.find(
      { $text: { $search: q }, status: 'approved' },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/name-requests/my-requests
// @desc    Get all requests for the current user
// @access  Private
router.get('/my-requests', isAuthenticated, async (req, res) => {
  try {
    const requests = await NamingRequest.find({ requestor: req.user.id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/name-requests/:id
// @desc    Get single naming request by ID
// @access  Private
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const request = await NamingRequest.findById(req.params.id)
      .populate('requestor', 'name email')
      .populate('reviewer', 'name email')
      .populate('history.changedBy', 'name email');

    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    res.json(request);
  } catch (err) {
    logger.error(`Error fetching request by ID: ${err.message}`, { requestId: req.params.id });
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Request not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/name-requests/:id
// @desc    Update a naming request
// @access  Private
router.put('/:id', [
  isAuthenticated,
  check('id').isMongoId().withMessage('Invalid request ID'),
  ...validateRequest
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { requestTitle, description, proposedNames, priority, dueDate, metadata } = req.body;

    const updatedRequest = await withTransaction(async (session) => {
      const request = await NamingRequest.findById(req.params.id).session(session);
      
      if (!request || !request.isActive) {
        throw { status: 404, message: 'Request not found' };
      }

      // Authorization check
      if (request.requestor.toString() !== req.user.id && 
          !req.user.roles.includes('admin') && 
          !req.user.roles.includes('reviewer')) {
        throw { status: 403, message: 'Not authorized to update this request' };
      }

      // Update fields
      request.requestTitle = requestTitle;
      request.description = description;
      request.priority = priority || request.priority;
      request.dueDate = dueDate || request.dueDate;
      request.metadata = metadata || request.metadata;

      // Update proposed names if provided
      if (proposedNames) {
        request.proposedNames = proposedNames.map(name => ({
          name: name.name,
          description: name.description || '',
          status: name.status || 'pending'
        }));
      }

      // Add to history
      request.history.push({
        status: request.status,
        changedBy: req.user.id,
        changedByName: req.user.name,
        comment: 'Request updated',
        timestamp: new Date()
      });

      const savedRequest = await request.save({ session });
      logger.info(`Request updated: ${savedRequest._id}`);
      return savedRequest;
    });

    const populatedRequest = await NamingRequest.findById(updatedRequest._id)
      .populate('requestor', 'name email')
      .populate('reviewer', 'name email');

    return sendSuccess(res, populatedRequest);

  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status);
    }
    
    logger.error('Error updating request:', {
      error: error.message,
      stack: error.stack,
      requestId: req.params.id
    });
    return sendError(res, 'Failed to update request', 500);
  }
});

// @route   DELETE /api/name-requests/:id
// @desc    Delete a naming request (soft delete)
// @access  Private
// router.delete('/:id', [

module.exports = router;