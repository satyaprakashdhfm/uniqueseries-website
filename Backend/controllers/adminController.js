const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AdminUser } = require('../models');
const { Order, OrderItem, Payment, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/db');

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

// GET /api/admin/orders
exports.adminListOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '20', 10));
    const offset = (page - 1) * limit;
    const { from, to, status, search, sort = 'created_at:desc' } = req.query;

    const where = {};
    if (status) where.order_status = status;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at[Op.gte] = new Date(from);
      if (to) where.created_at[Op.lte] = new Date(to);
    }
    if (search) {
      const q = `%${String(search).trim()}%`;
      where[Op.or] = [
        { order_number: { [Op.iLike]: q } },
        { customer_email: { [Op.iLike]: q } },
        { customer_name: { [Op.iLike]: q } }
      ];
    }

    const [sortField, sortDirRaw] = String(sort).split(':');
    const sortDir = (sortDirRaw || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { rows, count } = await Order.findAndCountAll({
      where,
      offset,
      limit,
      order: [[sortField || 'created_at', sortDir]],
      attributes: {
        include: [
          [literal('(SELECT COUNT(*) FROM order_items oi WHERE oi.order_number = "Order"."order_number")'), 'itemsCount']
        ]
      },
      include: [
        { model: Payment, as: 'payment', attributes: ['payment_status'] }
      ]
    });

    res.json({ rows, count, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/orders/:orderNumber
exports.adminGetOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ where: { order_number: orderNumber }, include: [{ model: Payment, as: 'payment' }, { model: User, as: 'customer', attributes: ['email', 'name'] }] });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const items = await OrderItem.findAll({ where: { order_number: orderNumber } });
    res.json({ ...order.toJSON(), items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/summary
exports.adminSummary = async (req, res) => {
  try {
    const { period = 'today', from, to } = req.query;
    let start = null, end = null;
    const now = new Date();
    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (period === '7d') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = now;
    } else if (period === '30d') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
    } else if (period === 'custom' && (from || to)) {
      start = from ? new Date(from) : null;
      end = to ? new Date(to) : null;
    }

    const where = {};
    if (start) where.created_at = { ...(where.created_at || {}), [Op.gte]: start };
    if (end) where.created_at = { ...(where.created_at || {}), [Op.lte]: end };

    const [totalOrders, totalRevenueRow, pending, confirmed, delivered, cancelled] = await Promise.all([
      Order.count({ where }),
      Order.findOne({ where, attributes: [[fn('COALESCE', fn('SUM', col('total_amount')), 0), 'revenue']] }),
      Order.count({ where: { ...where, order_status: 'pending' } }),
      Order.count({ where: { ...where, order_status: 'confirmed' } }),
      Order.count({ where: { ...where, order_status: 'delivered' } }),
      Order.count({ where: { ...where, order_status: 'cancelled' } })
    ]);

    const recent = await Order.findAll({ where, order: [['created_at', 'DESC']], limit: 5, attributes: ['order_number', 'customer_name', 'customer_email', 'total_amount', 'order_status', 'created_at'] });

    const revenue = Number(totalRevenueRow?.get('revenue') || 0);
    res.json({ totalOrders, revenue, pending, confirmed, delivered, cancelled, recent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
