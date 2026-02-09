const User = require('../models/user.model');
const BlacklistToken = require('../models/blacklistToken.model');
const jwt = require('jsonwebtoken');

module.exports.authUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'unauthorized' });
  }

  const isBlacklisted = await BlacklistToken.findOne({ token: token });

  if (isBlacklisted) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or already logged out',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Only fetch non-sensitive fields to avoid leaking password in downstream handlers
    const user = await User.findById(decoded._id).select('name email contactNumber');

    req.user = user;

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'unauthorized' });
  }
};

module.exports.protect = async (req, res, next) => {
  return module.exports.authUser(req, res, next);
};