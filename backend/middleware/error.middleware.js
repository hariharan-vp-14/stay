const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code set
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

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;