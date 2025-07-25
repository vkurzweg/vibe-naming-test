const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware to verify JWT token
const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User no longer exists' 
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'User account is deactivated' 
        });
      }
      
      // Check if password was changed after the token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({ 
          success: false, 
          message: 'User recently changed password. Please log in again.' 
        });
      }
      
      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token has expired' 
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      }
      
      throw error;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Middleware to check user role
const hasRole = (roles = []) => {
  // Convert string to array if a single role is passed
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Check if user has one of the required roles
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Required role(s): ${roles.join(', ')}` 
      });
    }
    
    next();
  };
};

// Middleware to handle impersonation
const handleImpersonation = async (req, res, next) => {
  try {
    // Check if this is an impersonated session
    if (req.user.isImpersonated && req.user.originalUserId) {
      const originalUser = await User.findById(req.user.originalUserId)
        .select('-password -twoFactorSecret');
      
      if (!originalUser) {
        return res.status(401).json({ 
          success: false, 
          message: 'Original user not found' 
        });
      }
      
      // Attach original user to request
      req.originalUser = originalUser;
    }
    
    next();
  } catch (error) {
    logger.error('Impersonation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing impersonation' 
    });
  }
};

// Middleware to restrict access to admin only
const isAdmin = [isAuthenticated, hasRole('admin')];

// Middleware to restrict access to reviewers and admins
const isReviewer = [isAuthenticated, hasRole(['reviewer', 'admin'])];

// Middleware to restrict access to submitters and above
const isSubmitter = [isAuthenticated];

module.exports = {
  isAuthenticated,
  hasRole,
  handleImpersonation,
  isAdmin,
  isReviewer,
  isSubmitter
};
