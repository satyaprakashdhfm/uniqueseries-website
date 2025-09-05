const { User } = require('../models');
const { generateToken } = require('../config/auth');
const bcrypt = require('bcryptjs');
const emailService = require('../config/email');
const whatsAppService = require('../config/whatsapp');

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ 
        success: false,
        code: 'user_exists',
        message: 'User already exists' 
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address
    });

    if (user) {
      // Generate tokens
      const token = generateToken(user.email);
      const refreshToken = generateRefreshToken(user.email);
      
      // Send welcome notifications
      try {
        // Send welcome email
        await emailService.sendWelcomeEmail(user.email, user.name);
        console.log(`✅ Welcome email sent to ${user.email}`);
        
        // Send welcome WhatsApp message if phone provided and WhatsApp is ready
        if (user.phone && whatsAppService.isClientReady()) {
          await whatsAppService.sendWelcomeMessage(user.phone, user.name);
          console.log(`✅ Welcome WhatsApp sent to ${user.phone}`);
        }
      } catch (notificationError) {
        console.error('Failed to send welcome notifications:', notificationError);
        // Log the error but don't fail registration
      }

      res.status(201).json({
        success: true,
        name: user.name,
        email: user.email,
        token,
        refreshToken
      });
    } else {
      res.status(400).json({ 
        success: false,
        code: 'invalid_data',
        message: 'Invalid user data' 
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        code: 'validation_error',
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    // Handle other database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        code: 'unique_constraint',
        message: 'A user with this email already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      code: 'server_error',
      message: 'An unexpected error occurred'
    });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: 'missing_credentials',
        message: 'Email and password are required'
      });
    }

    // Find user by email - be careful not to reveal if email exists
    const user = await User.findOne({ where: { email } });
    
    // Rate limiting could be implemented here
    
    if (user && (await user.matchPassword(password))) {
      // Generate both access and refresh tokens
      const token = generateToken(user.email);
      const refreshToken = generateRefreshToken(user.email);
      
      res.json({
        success: true,
        name: user.name,
        email: user.email,
        token,
        refreshToken
      });
    } else {
      // Use a consistent response time to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 200));
      
      res.status(401).json({ 
        success: false,
        code: 'invalid_credentials',
        message: 'Invalid email or password' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      code: 'server_error',
      message: 'An unexpected error occurred' 
    });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.email, {
      attributes: { exclude: ['password'] }
    });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.email);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};