const { Sequelize } = require('sequelize');
require('dotenv').config();

// Prefer DATABASE_URL when provided (Railway/Heroku style)
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_STATIC_URL || !!process.env.RAILWAY_ENVIRONMENT || hasDatabaseUrl;

let sequelize;

if (hasDatabaseUrl) {
  // Example: postgres://user:pass@host:port/dbname
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: isProduction ? false : true, // Disable logging in production
    pool: {
      max: 5,
      min: 0,
      acquire: 30000, // Reduced timeout for faster error detection
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 30000 // Reduced timeout for faster error detection
    }
  });
} else {
  // Local/dev fallback using discrete envs
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
