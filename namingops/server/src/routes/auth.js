const express = require('express');
const router = express.Router();
const passport = require('passport');
const { generateJwtToken } = require('../utils/auth');


const isOAuthEnabled = process.env.NODE_ENV !== 'development';

// Google OAuth routes - only enable in production
if (isOAuthEnabled) {
  router.get(
    '/google',
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false 
    })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', { 
      failureRedirect: '/login',
      session: false 
    }),
    (req, res) => {
      const token = generateJwtToken(req.user);
      res.redirect(`/auth/success?token=${token}`);
    }
  );

  router.post('/google', async (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ 
          success: false, 
          message: 'No credential provided' 
        });
      }
      
      // Rest of your Google auth logic...
      
    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Authentication failed' 
      });
    }
  });
} else {
  // Return 503 Service Unavailable in development
  router.get('/google', (req, res) => {
    res.status(503).json({ 
      success: false, 
      message: 'Google OAuth is disabled in development mode' 
    });
  });

  router.post('/google', (req, res) => {
    res.status(503).json({ 
      success: false, 
      message: 'Google OAuth is disabled in development mode' 
    });
  });
}

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }),
  (req, res) => {
    // Generate JWT
    const token = generateJwtToken(req.user);
    res.redirect(`/auth/success?token=${token}`);
  }
);

// Add this route to handle the success redirect
router.get('/success', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ success: false, message: 'No token provided' });
  }
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
});

// Add this route for handling the Google credential login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'No credential provided' });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    
    // Find or create user
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        // Add other required fields
      });
    }

    // Generate JWT
    const token = generateJwtToken(user);
    
    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        // Add other user fields you want to return
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
});

module.exports = router;