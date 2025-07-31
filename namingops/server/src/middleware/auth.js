const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware to verify JWT token
const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: No Bearer token in Authorization header');
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied',
        code: 'NO_AUTH_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      logger.warn('Authentication failed: Empty token in Authorization header');
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied',
        code: 'EMPTY_AUTH_TOKEN'
      });
    }
    
    // Skip token verification in development if using mock token
    if (process.env.NODE_ENV === 'development' && token === 'dev-mock-token-12345') {
      logger.debug('Development mode: Using mock authentication');
      req.user = { 
        id: 'dev-user-id',
        email: 'dev@example.com',
        role: 'admin',
        isAdmin: true
      };
      return next();
    }
    
    // Verify token
    try {
      // Log token verification attempt
      logger.debug('Verifying JWT token');
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        ignoreExpiration: false,
      });
      
      logger.debug('Token verified successfully', { userId: decoded.id });
      
      // Check if user still exists
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        logger.warn(`Authentication failed: User not found for token (ID: ${decoded.id})`);
        return res.status(401).json({ 
          success: false, 
          message: 'User no longer exists',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        logger.warn(`Authentication failed: User account is deactivated (ID: ${user._id})`);
        return res.status(401).json({ 
          success: false, 
          message: 'User account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }
      
      // Check if password was changed after the token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        logger.warn(`Authentication failed: Password changed after token was issued (User ID: ${user._id})`);
        return res.status(401).json({
          success: false,
          message: 'User recently changed password. Please log in again.',
          code: 'PASSWORD_CHANGED'
        });
      }
      
      // Attach user to request object
      req.user = user;
      logger.debug(`Authentication successful for user ${user._id} (${user.email})`);
      next();
    } catch (error) {
      // Enhanced error logging
      if (error.name === 'TokenExpiredError') {
        logger.warn('Token verification failed: Token expired', { 
          expiredAt: error.expiredAt,
          currentTime: new Date() 
        });
        return res.status(401).json({ 
          success: false, 
          message: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
          expiredAt: error.expiredAt
        });
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('Token verification failed: Invalid token', { error: error.message });
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token. Please log in again.',
          code: 'INVALID_TOKEN',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      } else {
        logger.error('Token verification failed with unexpected error:', error);
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication failed',
          code: 'AUTH_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
