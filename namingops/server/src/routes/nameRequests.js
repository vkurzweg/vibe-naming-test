const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const NameRequest = require('../models/NameRequest');
const User = require('../models/User');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/attachments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/name-requests
// @desc    Create a new name request
// @access  Private
router.post(
  '/',
  [
    isAuthenticated,
    upload.single('file_attachment'),
    [
      check('request_title', 'Request title is required').not().isEmpty(),
      check('business_unit', 'Business unit is required').not().isEmpty(),
      check('asset_type', 'Asset type is required').isIn([
        'Product', 'Platform', 'Feature', 'Internal Tool', 
        'Program', 'Initiative', 'Solution', 'Other'
      ]),
      check('asset_description', 'Asset description is required').not().isEmpty(),
      check('proposed_name_1', 'At least one proposed name is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) logger.error('Error deleting file after validation failed:', err);
        });
      }
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        request_title,
        business_unit,
        asset_type,
        asset_type_specify,
        asset_description,
        proposed_name_1,
        proposed_name_2,
        proposed_name_3,
        rename
      } = req.body;

      // Create name request object
      const nameRequestFields = {
        request_title,
        requestor_name: req.user.name,
        requestor_id: req.user.id,
        business_unit,
        asset_type,
        asset_description,
        proposed_name_1,
        rename: rename === 'true'
      };

      // Add optional fields if they exist
      if (asset_type_specify) nameRequestFields.asset_type_specify = asset_type_specify;
      if (proposed_name_2) nameRequestFields.proposed_name_2 = proposed_name_2;
      if (proposed_name_3) nameRequestFields.proposed_name_3 = proposed_name_3;

      // Handle file attachment
      if (req.file) {
        nameRequestFields.file_attachment = {
          path: req.file.path,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        };
      }

      // Create and save name request
      const nameRequest = new NameRequest(nameRequestFields);
      await nameRequest.save();

      // Populate user details
      await nameRequest.populate('reviewer', 'name email');

      res.status(201).json({
        success: true,
        data: nameRequest
      });
    } catch (error) {
      logger.error('Error creating name request:', error);
      
      // Clean up uploaded file if there was an error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) logger.error('Error cleaning up file after error:', err);
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/name-requests
// @desc    Get all name requests with filtering and pagination
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object based on query parameters
    const filter = {};
    
    // Filter by requester (for submitters to see only their requests)
    if (req.user.role === 'submitter') {
      filter.requestor_id = req.user.id;
    }
    
    // Filter by reviewer (for reviewers to see assigned requests)
    if (req.query.reviewer_id) {
      filter.reviewer_id = req.query.reviewer_id;
    }
    
    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Filter by business unit
    if (req.query.business_unit) {
      filter.business_unit = req.query.business_unit;
    }
    
    // Filter by asset type
    if (req.query.asset_type) {
      filter.asset_type = req.query.asset_type;
    }
    
    // Search by text (searches in title and descriptions)
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.request_date = {};
      if (req.query.startDate) {
        filter.request_date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        // Set to end of the day
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        filter.request_date.$lte = endDate;
      }
    }
    
    // Get total count for pagination
    const total = await NameRequest.countDocuments(filter);
    
    // Build sort object
    const sort = {};
    if (req.query.sortBy) {
      const sortOrder = req.query.order === 'desc' ? -1 : 1;
      sort[req.query.sortBy] = sortOrder;
    } else {
      // Default sort by request date descending
      sort.request_date = -1;
    }
    
    // Execute query with pagination
    const nameRequests = await NameRequest.find(filter)
      .populate('reviewer', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    res.json({
      success: true,
      count: nameRequests.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: nameRequests
    });
  } catch (error) {
    logger.error('Error fetching name requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/name-requests/search
// @desc    Search name requests with full-text search
// @access  Private
router.get('/search', isAuthenticated, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const nameRequests = await NameRequest.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(50);
    
    res.json({
      success: true,
      count: nameRequests.length,
      data: nameRequests
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/name-requests/:id
// @desc    Get name request by ID
// @access  Private
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const nameRequest = await NameRequest.findById(req.params.id)
      .populate('reviewer', 'name email');
    
    if (!nameRequest) {
      return res.status(404).json({
        success: false,
        message: 'Name request not found'
      });
    }
    
    // Check if user has permission to view this request
    if (req.user.role === 'submitter' && nameRequest.requestor_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }
    
    res.json({
      success: true,
      data: nameRequest
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Name request not found'
      });
    }
    
    logger.error('Error fetching name request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/name-requests/:id
// @desc    Update name request
// @access  Private
router.put(
  '/:id',
  [
    isAuthenticated,
    upload.single('file_attachment'),
    [
      check('status', 'Status is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) logger.error('Error deleting file after validation failed:', err);
        });
      }
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let nameRequest = await NameRequest.findById(req.params.id);
      
      if (!nameRequest) {
        return res.status(404).json({
          success: false,
          message: 'Name request not found'
        });
      }
      
      // Check permissions
      if (req.user.role === 'submitter' && nameRequest.requestor_id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this request'
        });
      }
      
      // Only reviewers and admins can change status
      if (req.body.status && !['reviewer', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to change request status'
        });
      }
      
      // Build update object
      const updateFields = { ...req.body };
      
      // Handle file attachment
      if (req.file) {
        // Delete old file if it exists
        if (nameRequest.file_attachment && nameRequest.file_attachment.path) {
          fs.unlink(nameRequest.file_attachment.path, (err) => {
            if (err) logger.error('Error deleting old file:', err);
          });
        }
        
        updateFields.file_attachment = {
          path: req.file.path,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        };
      }
      
      // If status is being updated to Approved, set approval date
      if (req.body.status === 'Approved' && nameRequest.status !== 'Approved') {
        updateFields.approval_date = new Date();
      }
      
      // Update name request
      nameRequest = await NameRequest.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).populate('reviewer', 'name email');
      
      res.json({
        success: true,
        data: nameRequest
      });
    } catch (error) {
      logger.error('Error updating name request:', error);
      
      // Clean up uploaded file if there was an error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) logger.error('Error cleaning up file after error:', err);
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/name-requests/:id
// @desc    Delete name request
// @access  Private
router.delete('/:id', [isAuthenticated, hasRole(['admin'])], async (req, res) => {
  try {
    const nameRequest = await NameRequest.findById(req.params.id);
    
    if (!nameRequest) {
      return res.status(404).json({
        success: false,
        message: 'Name request not found'
      });
    }
    
    // Delete file attachment if it exists
    if (nameRequest.file_attachment && nameRequest.file_attachment.path) {
      fs.unlink(nameRequest.file_attachment.path, (err) => {
        if (err) logger.error('Error deleting file:', err);
      });
    }
    
    await nameRequest.remove();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Error deleting name request:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Name request not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/name-requests/stats/overview
// @desc    Get name request statistics
// @access  Private
router.get('/stats/overview', [isAuthenticated, hasRole(['reviewer', 'admin'])], async (req, res) => {
  try {
    const [
      totalRequests,
      newRequests,
      inProgress,
      legalReview,
      onHold,
      cancelled,
      approved,
      byBusinessUnit,
      byAssetType,
      monthlyTrends
    ] = await Promise.all([
      // Total requests
      NameRequest.countDocuments(),
      
      // Count by status
      NameRequest.countDocuments({ status: 'New' }),
      NameRequest.countDocuments({ status: 'In Progress' }),
      NameRequest.countDocuments({ status: 'Legal Review' }),
      NameRequest.countDocuments({ status: 'On Hold' }),
      NameRequest.countDocuments({ status: 'Cancelled' }),
      NameRequest.countDocuments({ status: 'Approved' }),
      
      // Group by business unit
      NameRequest.aggregate([
        { $group: { _id: '$business_unit', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Group by asset type
      NameRequest.aggregate([
        { $group: { _id: '$asset_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Monthly trends (last 12 months)
      NameRequest.aggregate([
        {
          $match: {
            request_date: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)),
              $lte: new Date()
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$request_date' },
              month: { $month: '$request_date' }
            },
            count: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        totalRequests,
        byStatus: {
          new: newRequests,
          inProgress,
          legalReview,
          onHold,
          cancelled,
          approved
        },
        byBusinessUnit,
        byAssetType,
        monthlyTrends: monthlyTrends.map(item => ({
          year: item._id.year,
          month: item._id.month,
          total: item.count,
          approved: item.approved
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
