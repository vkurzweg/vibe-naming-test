const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyGoogleToken } = require('../config/passport');
const logger = require('../utils/logger');
const { isAuthenticated, hasRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT
    const token = generateToken(req.user);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// @route   POST /api/auth/google/token
// @desc    Authenticate with Google token (for mobile)
// @access  Public
router.post('/google/token', verifyGoogleToken, async (req, res) => {
  try {
    const { email, name, picture } = req.googleUser;
    
    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        email,
        name,
        avatar: picture,
        emailVerified: true
      });
      await user.save();
      logger.info(`New user created via Google token: ${email}`);
    } else if (!user.googleId) {
      // Update existing user with Google ID
      user.googleId = req.googleUser.id;
      user.avatar = picture;
      await user.save();
    }

    // Generate JWT
    const token = generateToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    logger.error('Google token auth error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // Create new user
      user = new User({
        name,
        email,
        password
      });

      await user.save();

      // Generate JWT
      const token = generateToken(user);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // Check if account is locked
      if (user.isLocked()) {
        const retryAfter = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
        return res.status(403).json({
          errors: [{
            msg: `Account locked. Try again in ${retryAfter} minutes.`
          }]
        });
      }

      // Verify password
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        // Handle failed login attempt
        await user.handleFailedLogin();
        
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0 || user.lockUntil) {
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      // Generate JWT
      const token = generateToken(user);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Private
router.post('/refresh-token', isAuthenticated, (req, res) => {
  try {
    const token = generateToken(req.user);
    res.json({ success: true, token });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

module.exports = router;
