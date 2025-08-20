const jwt = require('jsonwebtoken');
const { AdminUser } = require('../models');

exports.adminProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.isAdmin) throw new Error('Not admin');
      const admin = await AdminUser.findByPk(decoded.id, { attributes:{ exclude:['password'] } });
      if (!admin) throw new Error('Admin not found');
      req.admin = admin; // attach
      next();
    } catch (err) {
      console.error('admin auth error', err);
      return res.status(401).json({ message:'Not authorized as admin' });
    }
  } else {
    return res.status(401).json({ message:'No token' });
  }
};
