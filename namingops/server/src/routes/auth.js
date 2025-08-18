const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { generateJwtToken, verifyGoogleToken } = require('../utils/auth');
const User = require('../models/User');

// Google OAuth login route (session/cookie flow)
if (process.env.NODE_ENV === 'development') {
  router.get('/google', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(clientUrl);
});
  router.get('/google/callback', (req, res) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(clientUrl);
  });
} else {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: true })
  );

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: true }),
    (req, res) => {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(clientUrl);

      // Option 2: If you want JWT instead of session, uncomment below:
      // const token = generateJwtToken(req.user);
      // res.redirect(`${clientUrl}/auth/callback?token=${token}`);
    }
  );
}

// Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(clientUrl);
  });
});

// POST /api/v1/auth/google (JWT flow for SPA)
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await verifyGoogleToken(token);
    const payload = ticket.getPayload();

    // Find or create user in your DB
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        // ...other fields
      });
    }

    // Generate JWT for the user
    const jwtToken = generateJwtToken(user);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture
      },
      token: jwtToken
    });
  } catch (error) {
    res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
});

// JWT Middleware
const requireAuth = process.env.NODE_ENV === 'development'
  ? (req, res, next) => {
      // Mock user for development
      req.user = { id: 'dev-user', name: 'Dev User', email: 'dev@example.com', role: 'admin' };
      next();
    }
  : function(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: 'No token' });
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
      } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    };

// GET /api/v1/auth/me (JWT-protected user info)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture
    }
  });
});

module.exports = router;