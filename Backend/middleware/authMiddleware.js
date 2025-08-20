const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const lookupEmail = decoded.email || decoded.id; // token may contain either
      if (!lookupEmail) throw new Error('Invalid token payload');

      const user = await User.findOne({ where: { email: lookupEmail }, attributes: { exclude: ['password'] } });
      if (!user) throw new Error('User not found');

      req.user = user;
      return next();
    } catch (error) {
      console.error('Auth protect error:', error.message || error);
      return res.status(401).json({ message: 'Not authorized' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
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