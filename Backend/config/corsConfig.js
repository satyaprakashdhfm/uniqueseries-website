// Build allowed origins from environment variables
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://18.219.166.213'
];

// Add production frontend URLs from environment variables
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  // Also allow without www
  const withoutWww = process.env.FRONTEND_URL.replace('www.', '');
  if (withoutWww !== process.env.FRONTEND_URL) {
    allowedOrigins.push(withoutWww);
  }
}
if (process.env.ADMIN_FRONTEND_URL) {
  allowedOrigins.push(process.env.ADMIN_FRONTEND_URL);
}

// Log allowed origins for debugging
console.log('🔒 CORS allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    console.log('�� CORS request from origin:', origin);
    
    // Allow requests with no origin (mobile apps, Postman, internal Railway requests)
    if (!origin) {
      console.log('✅ No origin - allowing request');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ Origin blocked:', origin, 'Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = corsOptions;
