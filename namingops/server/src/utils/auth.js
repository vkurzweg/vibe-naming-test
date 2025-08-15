const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateJwtToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      // Add other user properties you want to include in the token
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket;
}

module.exports = {
  generateJwtToken,
  verifyGoogleToken,
};