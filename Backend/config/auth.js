const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate JWT token with email as identifier
const generateToken = (email) => {
  return jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

module.exports = { generateToken };