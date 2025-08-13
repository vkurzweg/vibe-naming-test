const express = require('express');
const passport = require('passport');
const router = express.Router();
const { generateJwtToken } = require('../utils/auth');
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
    // Use full URL for Heroku and local
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(clientUrl);

    // Option 2: If you want JWT instead of session, uncomment below:
    // const token = generateJwtToken(req.user);
    // res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(clientUrl);
  });
});

module.exports = router;