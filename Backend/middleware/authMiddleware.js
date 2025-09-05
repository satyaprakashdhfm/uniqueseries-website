const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify the token with stronger validation
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'], // Be explicit about the algorithm
        maxAge: process.env.JWT_EXPIRE || '7d' // Double-check expiry
      });
      
      // Check token type is not a refresh token
      if (decoded.type === 'refresh') {
        throw new Error('Invalid token type');
      }
      
      const lookupEmail = decoded.email || decoded.id; // token may contain either
      if (!lookupEmail) throw new Error('Invalid token payload');

      // Find user with minimal projection
      const user = await User.findOne({ 
        where: { email: lookupEmail }, 
        attributes: ['email', 'name', 'phone', 'address'] // Explicit attributes to return
      });
      
      if (!user) throw new Error('User not found');

      req.user = user;
      // Store token data for potential access in the request
      req.token = { id: decoded.jti, email: decoded.email, iat: decoded.iat };
      return next();
    } catch (error) {
      // More specific error messages based on error type
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', code: 'token_expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token', code: 'invalid_token' });
      }
      
      console.error('Auth protect error:', error.message || error);
      return res.status(401).json({ message: 'Not authorized', code: 'unauthorized' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token', code: 'no_token' });
};

// Optional auth - sets user if token is valid but doesn't block request if no token
exports.optionalAuth = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const lookupEmail = decoded.email || decoded.id; // our User PK is email
      if (lookupEmail) {
        req.user = await User.findOne({
          where: { email: lookupEmail },
          attributes: { exclude: ['password'] }
        });
      }
    } catch (error) {
      console.error('Optional auth error:', error);
    }
  }
  
  next();
};