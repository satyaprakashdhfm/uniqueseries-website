// Dynamic CORS configuration suitable for local dev and Railway production
const isProd = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_STATIC_URL || !!process.env.RAILWAY_ENVIRONMENT;

const envOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_FRONTEND_URL
].filter(Boolean);

const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

const railwayHostRegex = /(^https?:\/\/)?([\w-]+\.)*railway\.app(?::\d+)?$/i;

const allowOrigin = (origin) => {
  if (!origin) return true; // mobile apps, curl, same-origin
  if (envOrigins.includes(origin)) return true;
  if (!isProd && devOrigins.includes(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (railwayHostRegex.test(hostname)) return true;
  } catch (_) {}
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (allowOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = corsOptions;