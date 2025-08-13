const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// @route   GET /api/users
// @desc    Get all users (paginated)
// @access  Private/Admin
router.get('/', [isAuthenticated, hasRole(['admin'])], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    
    // Search by name or email
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ];
    }
    
    // Filter by role
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    // Filter by status
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    // Execute query with pagination
    const users = await User.find(filter)
      .select('-password -twoFactorSecret -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -twoFactorSecret -passwordResetToken -passwordResetExpires -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put(
  '/me',
  [
    isAuthenticated,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('preferences.theme', 'Invalid theme').optional().isIn(['light', 'dark', 'system'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, preferences } = req.body;
      
      // Check if email is already taken by another user
      if (email !== req.user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use'
          });
        }
      }
      
      // Update user
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { 
          name,
          email,
          preferences: { ...req.user.preferences, ...preferences }
        },
        { new: true, runValidators: true }
      ).select('-password -twoFactorSecret -passwordResetToken -passwordResetExpires -emailVerificationToken');
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error updating user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true' ? error.message : undefined
      });
    }
  }
);

// @route   PUT /api/users/me/password
// @desc    Update current user password
// @access  Private
router.put(
  '/me/password',
  [
    isAuthenticated,
    [
      check('currentPassword', 'Current password is required').exists(),
      check('newPassword', 'Please enter a password with 8 or more characters').isLength({ min: 8 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      
      // Get user with password
      const user = await User.findById(req.user.id).select('+password');
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Update password
      user.password = newPassword;
      user.passwordChangedAt = Date.now();
      await user.save();
      
      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      logger.error('Error updating password:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', [isAuthenticated, hasRole(['admin'])], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -twoFactorSecret -passwordResetToken -passwordResetExpires -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    logger.error('Error fetching user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private/Admin
router.put(
  '/:id',
  [
    isAuthenticated,
    hasRole(['admin']),
    [
      check('name', 'Name is required').optional().not().isEmpty(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('role', 'Invalid role').optional().isIn(['submitter', 'reviewer', 'admin']),
      check('isActive', 'isActive must be a boolean').optional().isBoolean()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, role, isActive, department, employeeId } = req.body;
      
      // Check if user exists
      let user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use'
          });
        }
      }
      
      // Check if employee ID is already taken by another user
      if (employeeId && employeeId !== user.employeeId) {
        const existingUser = await User.findOne({ employeeId });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Employee ID already in use'
          });
        }
      }
      
      // Build update object
      const updateFields = {};
      if (name) updateFields.name = name;
      if (email) updateFields.email = email;
      if (role) updateFields.role = role;
      if (isActive !== undefined) updateFields.isActive = isActive;
      if (department !== undefined) updateFields.department = department;
      if (employeeId !== undefined) updateFields.employeeId = employeeId;
      
      // Update user
      user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select('-password -twoFactorSecret -passwordResetToken -passwordResetExpires -emailVerificationToken');
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      
      if (error.kind === 'ObjectId') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', [isAuthenticated, hasRole(['admin'])], async (req, res) => {
  try {
    // Prevent deleting own account
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has any name requests
    const hasRequests = await NameRequest.exists({ requestor_id: req.params.id });
    if (hasRequests) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with existing name requests. Reassign or delete the requests first.'
      });
    }
    
    // Delete user
    await user.remove();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true' ? error.message : undefined
    });
  }
});

// @route   POST /api/users/:id/impersonate
// @desc    Impersonate a user (admin only)
// @access  Private/Admin
router.post('/:id/impersonate', [isAuthenticated, hasRole(['admin'])], async (req, res) => {
  try {
    // Prevent impersonating self
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot impersonate yourself'
      });
    }
    
    // Check if user exists
    const user = await User.findById(req.params.id)
      .select('-password -twoFactorSecret -passwordResetToken -passwordResetExpires -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate impersonation token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        isImpersonated: true,
        originalUserId: req.user.id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isImpersonated: true,
        originalUserId: req.user.id
      }
    });
  } catch (error) {
    logger.error('Error impersonating user:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true' ? error.message : undefined
    });
  }
});

module.exports = router;
