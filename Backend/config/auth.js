const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate JWT token with email as identifier
const generateToken = (email) => {
  return jwt.sign(
    { 
      email,
      iat: Math.floor(Date.now() / 1000),
      // Add a unique token ID to allow token revocation if needed
      jti: require('crypto').randomBytes(16).toString('hex')
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE || '7d' // Shorter default expiry
    }
  );
};

// Generate refresh token with longer expiry
const generateRefreshToken = (email) => {
  return jwt.sign(
    { 
      email,
      type: 'refresh',
      jti: require('crypto').randomBytes(16).toString('hex')
    }, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
    }
  );
};

module.exports = { generateToken, generateRefreshToken };