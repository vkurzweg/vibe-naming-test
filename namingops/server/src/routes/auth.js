const express = require('express');
const passport = require('passport');
const router = express.Router();
const { generateJwtToken } = require('../utils/auth'); // Your JWT utility
const User = require('../models/User');

// Google OAuth login route
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: true })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req, res) => {
    // Option 1: Use session (recommended for web apps)
    // Redirect to frontend with session cookie set
    res.redirect(process.env.CLIENT_URL || '/');
    
    // Option 2: If you want JWT instead of session, uncomment below:
    // const token = generateJwtToken(req.user);
    // res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(process.env.CLIENT_URL || '/');
  });
});

module.exports = router;