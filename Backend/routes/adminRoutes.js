const express = require('express');
const { register, login, listAdmins } = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', adminProtect, listAdmins);

module.exports = router;
