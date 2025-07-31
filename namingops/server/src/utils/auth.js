const jwt = require('jsonwebtoken');

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

module.exports = { generateJwtToken };