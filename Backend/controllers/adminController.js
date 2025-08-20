const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AdminUser } = require('../models');

const genToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/admin/register (only first user or super_admin should call)
exports.register = async (req, res) => {
  try {
    const { email, name, password, role='admin' } = req.body;
    if(!email || !name || !password) return res.status(400).json({ message:'email, name, password required' });
    const exists = await AdminUser.findOne({ where:{ email } });
    if(exists) return res.status(400).json({ message:'User already exists' });
    const created = await AdminUser.create({ email, name, password, role });
    const token = genToken({ id: created.id, email: created.email, role: created.role, isAdmin:true });
    res.status(201).json({ token, admin:{ id:created.id, email:created.email, name:created.name, role:created.role } });
  } catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};

// POST /api/admin/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await AdminUser.findOne({ where:{ email } });
    if(!user) return res.status(401).json({ message:'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(401).json({ message:'Invalid credentials' });
    const token = genToken({ id: user.id, email: user.email, role: user.role, isAdmin:true });
    res.json({ token, admin:{ id:user.id, email:user.email, name:user.name, role:user.role } });
  } catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};

// GET /api/admin/users (requires super_admin)
exports.listAdmins = async (req,res)=>{
  try{
    if(req.admin.role !== 'super_admin') return res.status(403).json({ message:'Forbidden' });
    const admins = await AdminUser.findAll({ attributes:{ exclude:['password'] } });
    res.json(admins);
  }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};
