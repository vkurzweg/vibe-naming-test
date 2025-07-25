const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const logger = require('../utils/logger');

// Google OAuth2 client for token verification
const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth2 Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
      passReqToCallback: true,
      scope: ['profile', 'email']
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Update user's Google ID if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        }

        // Create new user if doesn't exist
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          emailVerified: true
        });

        await user.save();
        logger.info(`New user created via Google OAuth: ${user.email}`);
        done(null, user);
      } catch (error) {
        logger.error('Error in Google OAuth strategy:', error);
        done(error, null);
      }
    }
  )
);

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Not authenticated' });
};

// Middleware to check user role
const hasRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Required role(s): ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware to verify Google ID token
const verifyGoogleToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'No token provided' });
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    req.googleUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };

    next();
  } catch (error) {
    logger.error('Error verifying Google token:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = {
  initialize: passport.initialize(),
  session: passport.session(),
  isAuthenticated,
  hasRole,
  verifyGoogleToken
};
