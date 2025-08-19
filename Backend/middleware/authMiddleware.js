const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the token (supports tokens with id or email)
      const lookupEmail = decoded.email || decoded.id; // our User PK is email
      if (lookupEmail) {
        req.user = await User.findOne({
          where: { email: lookupEmail },
          attributes: { exclude: ['password'] }
        });
      }
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
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