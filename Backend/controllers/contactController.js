const { ContactMessage, AdminUser } = require('../models');
const { Op } = require('sequelize');

// POST /api/contact
exports.createMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};

    const finalName = req.user?.name || name;
    const finalEmail = req.user?.email || email;

    if (!finalName || !finalEmail || !subject || !message) {
      return res.status(400).json({ message: 'name, email, subject and message are required' });
    }

    const created = await ContactMessage.create({
      name: finalName,
      email: finalEmail,
      phone: phone || null,
      subject,
      message
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/contact/user - get messages for logged-in user by email
exports.getUserMessages = async (req, res) => {
  try {
    const rows = await ContactMessage.findAll({
      where: { email: req.user.email },
      order: [['created_at', 'DESC']]
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: GET /api/contact - list all
exports.getAllMessages = async (req, res) => {
  try {
    const { status } = req.query || {};
    const where = status ? { status: status === 'open' ? 'new' : status } : {};
    const rows = await ContactMessage.findAll({ where, order: [['created_at', 'DESC']] });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: PUT /api/contact/:id
exports.updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status, response, assignTo } = req.body || {};

    const row = await ContactMessage.findByPk(id);
    if (!row) return res.status(404).json({ message: 'Message not found' });

    // Normalize legacy status value
    if (status === 'open') status = 'new';

    if (status) row.status = status;
    if (response != null) row.response = response;
    if (assignTo != null) row.assigned_to = assignTo;

    await row.save();
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
