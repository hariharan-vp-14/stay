const config = require('../config');

/**
 * Centralized error handler — must be the LAST middleware registered.
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(statusCode).json({
      success: false,
      message: messages.join(', '),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    return res.status(statusCode).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Multer file-size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large (max 5 MB)' });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    ...(!config.IS_PRODUCTION && { stack: err.stack }),
  });
};

module.exports = errorHandler;