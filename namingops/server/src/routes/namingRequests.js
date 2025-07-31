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
  check('requestTitle', 'Request title is required').not().isEmpty().trim().escape(),
  check('description', 'Description is required').not().isEmpty().trim().escape(),
  check('proposedNames', 'At least one proposed name is required').isArray({ min: 1 }),
  check('proposedNames.*.name', 'Name is required').not().isEmpty().trim().escape(),
  check('priority', 'Invalid priority').optional().isIn(['low', 'medium', 'high']),
  check('dueDate', 'Invalid due date').optional().isISO8601()
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
      proposedNames: proposedNames.length,
      metadata: Object.keys(metadata || {})
    });

    // Create the new naming request
    const newRequest = new NamingRequest({
      requestTitle,
      description,
      requestor: requestorId,
      requestorName,
      proposedNames: proposedNames.map(name => ({
        name: name.name,
        description: name.description || '',
        status: 'pending'
      })),
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
    
    // Populate the response
    const populatedRequest = await NamingRequest.findById(savedRequest._id)
      .populate('requestor', 'name email')
      .populate('reviewer', 'name email');
    
    logger.info('Sending success response for request:', savedRequest._id);
    
    res.status(201).json({
      success: true,
      data: populatedRequest
    });
    
  } catch (error) {
    // If we get here, something went wrong
    await session.abortTransaction();
    
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
router.get('/', [
  isAuthenticated,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  query('sortBy').optional().isString().trim().escape(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('status').optional().isString().trim().escape(),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('search').optional().isString().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Invalid query parameters', 400, errors.array());
    }

    const { 
      status, 
      priority, 
      search, 
      page = DEFAULT_PAGE, 
      limit = DEFAULT_LIMIT,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const filter = { isActive: true };

    // Apply filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Regular users can only see their own requests
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('reviewer')) {
      filter.requestor = req.user.id;
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { requestTitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'proposedNames.name': { $regex: search, $options: 'i' } }
      ];
    }

    const [requests, total] = await Promise.all([
      NamingRequest.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('requestor', 'name email')
        .populate('reviewer', 'name email'),
      NamingRequest.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching naming requests:', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });
    return sendError(res, 'Failed to fetch requests', 500);
  }
});

// @route   GET /api/name-requests/:id
// @desc    Get single naming request by ID
// @access  Private
router.get('/:id', [
  isAuthenticated,
  check('id').isMongoId().withMessage('Invalid request ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Invalid request ID', 400, errors.array());
    }

    const request = await NamingRequest.findById(req.params.id)
      .populate('requestor', 'name email')
      .populate('reviewer', 'name email')
      .populate('history.changedBy', 'name email');

    if (!request || !request.isActive) {
      return sendError(res, 'Request not found', 404);
    }

    // Authorization check
    if (!req.user.roles.includes('admin') && 
        !req.user.roles.includes('reviewer') && 
        request.requestor._id.toString() !== req.user.id) {
      return sendError(res, 'Not authorized to view this request', 403);
    }

    return sendSuccess(res, request);

  } catch (error) {
    logger.error('Error fetching request:', {
      error: error.message,
      stack: error.stack,
      requestId: req.params.id
    });
    return sendError(res, 'Failed to fetch request', 500);
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
router.delete('/:id', [
  isAuthenticated,
  check('id').isMongoId().withMessage('Invalid request ID')
], async (req, res) => {
  try {
    const result = await withTransaction(async (session) => {
      const request = await NamingRequest.findById(req.params.id).session(session);
      
      if (!request || !request.isActive) {
        throw { status: 404, message: 'Request not found' };
      }

      // Authorization check
      if (request.requestor.toString() !== req.user.id && 
          !req.user.roles.includes('admin')) {
        throw { status: 403, message: 'Not authorized to delete this request' };
      }

      // Soft delete
      request.isActive = false;
      request.history.push({
        status: request.status,
        changedBy: req.user.id,
        changedByName: req.user.name,
        comment: 'Request deleted',
        timestamp: new Date()
      });

      await request.save({ session });
      logger.info(`Request deleted: ${request._id}`);
      return request;
    });

    return sendSuccess(res, { id: result._id, message: 'Request deleted successfully' });

  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status);
    }
    
    logger.error('Error deleting request:', {
      error: error.message,
      stack: error.stack,
      requestId: req.params.id
    });
    return sendError(res, 'Failed to delete request', 500);
  }
});

// @route   PUT /api/name-requests/:id/submit
// @desc    Submit a draft request for review
// @access  Private
router.put('/:id/submit', [
  isAuthenticated,
  check('id').isMongoId().withMessage('Invalid request ID')
], async (req, res) => {
  try {
    const result = await withTransaction(async (session) => {
      const request = await NamingRequest.findById(req.params.id).session(session);
      
      if (!request || !request.isActive) {
        throw { status: 404, message: 'Request not found' };
      }

      // Only the requestor can submit their own draft
      if (request.requestor.toString() !== req.user.id) {
        throw { status: 403, message: 'Not authorized to submit this request' };
      }

      if (request.status !== 'draft') {
        throw { status: 400, message: 'Only draft requests can be submitted' };
      }

      // Update status and add to history
      request.status = 'submitted';
      request.history.push({
        status: 'submitted',
        changedBy: req.user.id,
        changedByName: req.user.name,
        comment: 'Request submitted for review',
        timestamp: new Date()
      });

      const savedRequest = await request.save({ session });
      logger.info(`Request submitted: ${savedRequest._id}`);
      return savedRequest;
    });

    const populatedRequest = await NamingRequest.findById(result._id)
      .populate('requestor', 'name email')
      .populate('reviewer', 'name email');

    return sendSuccess(res, populatedRequest);

  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status);
    }
    
    logger.error('Error submitting request:', {
      error: error.message,
      stack: error.stack,
      requestId: req.params.id
    });
    return sendError(res, 'Failed to submit request', 500);
  }
});
// @route   PUT /api/name-requests/:id/claim
// @desc    Claim a request for review
// @access  Private (Reviewer/Admin)
router.put('/:id/claim', [
  isAuthenticated,
  hasRole(['reviewer', 'admin']),
  check('id').isMongoId().withMessage('Invalid request ID')
], async (req, res) => {
  try {
    const result = await withTransaction(async (session) => {
      const request = await NamingRequest.findById(req.params.id).session(session);
      
      if (!request || !request.isActive) {
        throw { status: 404, message: 'Request not found' };
      }

      if (request.status !== 'submitted') {
        throw { status: 400, message: 'Only submitted requests can be claimed for review' };
      }

      // Check if already claimed by someone else
      if (request.reviewer && request.reviewer.toString() !== req.user.id) {
        throw { 
          status: 400, 
          message: 'This request is already claimed by another reviewer' 
        };
      }

      // Claim the request
      request.status = 'in_review';
      request.reviewer = req.user.id;
      request.reviewerName = req.user.name;
      request.reviewDate = new Date();
      
      request.history.push({
        status: 'in_review',
        changedBy: req.user.id,
        changedByName: req.user.name,
        comment: 'Request claimed for review',
        timestamp: new Date()
      });

      const savedRequest = await request.save({ session });
      logger.info(`Request claimed: ${savedRequest._id} by user ${req.user.id}`);
      return savedRequest;
    });

    const populatedRequest = await NamingRequest.findById(result._id)
      .populate('requestor', 'name email')
      .populate('reviewer', 'name email');

    return sendSuccess(res, populatedRequest);

  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status);
    }
    
    logger.error('Error claiming request:', {
      error: error.message,
      stack: error.stack,
      requestId: req.params.id,
      userId: req.user.id
    });
    return sendError(res, 'Failed to claim request', 500);
  }
});

// @route   PUT /api/name-requests/:id/approve
// @desc    Approve a naming request
// @access  Private (Reviewer/Admin)
router.put('/:id/approve', [
  isAuthenticated,
  hasRole(['reviewer', 'admin']),
  check('id').isMongoId().withMessage('Invalid request ID'),
  check('comment', 'Approval comment is required').not().isEmpty().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const result = await withTransaction(async (session) => {
      const request = await NamingRequest.findById(req.params.id).session(session);
      
      if (!request || !request.isActive) {
        throw { status: 404, message: 'Request not found' };
      }

      // Check if the request is assigned to the current user
      if (request.reviewer.toString() !== req.user.id && 
          !req.user.roles.includes('admin')) {
        throw { 
          status: 403, 
          message: 'Not authorized to approve this request' 
        };
      }

      // Update request status
      request.status = 'approved';
      request.reviewDate = new Date();
      request.reviewComments = req.body.comment;
      
      // Update all proposed names to approved
      request.proposedNames = request.proposedNames.map(name => ({
        ...name.toObject(),
        status: 'approved'
      }));

      request.history.push({
        status: 'approved',
        changedBy: req.user.id,
        changedByName: req.user.name,
        comment: req.body.comment,
        timestamp: new Date()
      });

      const savedRequest = await request.save({ session });
      logger.info(`Request approved: ${savedRequest._id} by user ${req.user.id}`);
      return savedRequest;
    });

    const populatedRequest = await NamingRequest.findById(result._id)
      .populate('requestor', 'name email')
      .populate('reviewer', 'name email');

    return sendSuccess(res, populatedRequest);

  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status);
    }
    
    logger.error('Error approving request:', {
      error: error.message,
      stack: error.stack,
      requestId: req.params.id,
      userId: req.user.id
    });
    return sendError(res, 'Failed to approve request', 500);
  }
});

// @route   PUT /api/name-requests/:id/reject
// @desc    Reject a naming request
// @access  Private (Reviewer/Admin)
router.put('/:id/reject', [
  isAuthenticated,
  hasRole(['reviewer', 'admin']),
  check('id').isMongoId().withMessage('Invalid request ID'),
  check('comment', 'Rejection reason is required').not().isEmpty().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const result = await withTransaction(async (session) => {
      const request = await NamingRequest.findById(req.params.id).session(session);
      
      if (!request || !request.isActive) {
        throw { status: 404, message: 'Request not found' };
      }

      // Check if the request is assigned to the current user
      if (request.reviewer.toString() !== req.user.id && 
          !req.user.roles.includes('admin')) {
        throw { 
          status: 403, 
          message: 'Not authorized to reject this request' 
        };
      }

      // Update request status
      request.status = 'rejected';
      request.reviewDate = new Date();
      request.reviewComments = req.body.comment;
      
      // Update all proposed names to rejected
      request.proposedNames = request.proposedNames.map(name => ({
        ...name.toObject(),
        status: 'rejected'
      }));

      request.history.push({
        status: 'rejected',
        changedBy: req.user.id,
        changedByName: req.user.name,
        comment: req.body.comment,
        timestamp: new Date()
      });

      const savedRequest = await request.save({ session });
      logger.info(`Request rejected: ${savedRequest._id} by user ${req.user.id}`);
      return savedRequest;
    });

    const populatedRequest = await NamingRequest.findById(result._id)
      .populate('requestor', 'name email')
      .populate('reviewer', 'name email');

    return sendSuccess(res, populatedRequest);

  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status);
    }
    
    logger.error('Error rejecting request:', {
      error: error.message,
      stack: error.stack,
      requestId: req.params.id,
      userId: req.user.id
    });
    return sendError(res, 'Failed to reject request', 500);
  }
});

// @route   PUT /api/name-requests/:id/return
// @desc    Return a request to the submitter for changes
// @access  Private (Reviewer/Admin)
router.put('/:id/return', [
  isAuthenticated,
  hasRole(['reviewer', 'admin']),
  check('id').isMongoId().withMessage('Invalid request ID'),
  check('comment', 'Return reason is required').not().isEmpty().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const result = await withTransaction(async (session) => {
      const request = await NamingRequest.findById(req.params.id).session(session);
      
      if (!request || !request.isActive) {
        throw { status: 404, message: 'Request not found' };
      }

      // Check if the request is assigned to the current user
      if (request.reviewer.toString() !== req.user.id && 
          !req.user.roles.includes('admin')) {
        throw { 
          status: 403, 
          message: 'Not authorized to return this request' 
        };
      }

      // Update request status
      request.status = 'draft';
      request.reviewer = null;
      request.reviewerName = null;
      
      request.history.push({
        status: 'returned',
        changedBy: req.user.id,
        changedByName: req.user.name,
        comment: `Returned for changes: ${req.body.comment}`,
        timestamp: new Date()
      });

      const savedRequest = await request.save({ session });
      logger.info(`Request returned for changes: ${savedRequest._id} by user ${req.user.id}`);
      return savedRequest;
    });

    const populatedRequest = await NamingRequest.findById(result._id)
      .populate('requestor', 'name email')
      .populate('reviewer', 'name email');

    return sendSuccess(res, populatedRequest);

  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status);
    }
    
    logger.error('Error returning request:', {
      error: error.message,
      stack: error.stack,
      requestId: req.params.id,
      userId: req.user.id
    });
    return sendError(res, 'Failed to return request', 500);
  }
});

module.exports = router;