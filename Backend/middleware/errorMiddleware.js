// Custom Error Class for API errors
class AppError extends Error {
  constructor(message, statusCode, code = 'server_error') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not Found error handler
const notFound = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404, 'not_found');
  next(error);
};

// General error handler
const errorHandler = (err, req, res, next) => {
  // Default to 500 if statusCode not specified
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  const errorCode = err.code || 'server_error';
  
  // Log error for debugging (could use a proper logger in production)
  console.error(`[${new Date().toISOString()}] Error:`, {
    path: req.path,
    method: req.method,
    statusCode,
    message: err.message,
    code: errorCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
  
  // Return standardized error response
  res.status(statusCode).json({
    success: false,
    code: errorCode,
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    ...(err.errors && { errors: err.errors })
  });
};

module.exports = { 
  notFound, 
  errorHandler,
  AppError // Export for use in controllers
};