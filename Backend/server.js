const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { connectDB, sequelize } = require('./config/db');
const corsOptions = require('./config/corsConfig');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express
const app = express();

// Trust proxy (needed on Railway/behind proxies for correct IP/proto)
app.set('trust proxy', 1);

// Middleware
app.use(cors(corsOptions));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static folder for uploads (note: ephemeral on Railway)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoints
app.get('/health', (req, res) => res.status(200).send('ok'));
app.get('/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).send('ready');
  } catch (e) {
    return res.status(500).send('db_unavailable');
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Simple root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Currency Gift Store API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      cart: '/api/cart',
      reviews: '/api/reviews',
      wishlist: '/api/wishlist',
      contact: '/api/contact',
      admin: '/api/admin'
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Test database connection only (tables already exist)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection verified - using existing tables');
  } catch (error) {
    console.error('Database connection error:', error);
  }
})();