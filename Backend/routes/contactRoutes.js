const express = require('express');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  createMessage,
  getUserMessages,
  getAllMessages,
  updateMessageStatus
} = require('../controllers/contactController');

const router = express.Router();

// User creates a support ticket
router.post('/', optionalAuth, createMessage);

// Logged-in user can view their tickets
router.get('/user', protect, getUserMessages);

// Admin endpoints (could be guarded by separate admin middleware; keep simple)
router.get('/', protect, getAllMessages);
router.put('/:id', protect, updateMessageStatus);

module.exports = router;
