const User = require('../models/user.model');
const Owner = require('../models/owner.model');
const BlacklistToken = require('../models/blacklistToken.model');
const jwt = require('jsonwebtoken');

// Legacy middleware – authenticates users only (kept for backward compatibility)
module.exports.authUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'unauthorized' });
  }

  const isBlacklisted = await BlacklistToken.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or already logged out',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// Unified protect middleware – resolves both users and owners from JWT
module.exports.protect = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'unauthorized' });
  }

  const isBlacklisted = await BlacklistToken.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or already logged out',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role || 'user';

    if (role === 'owner') {
      const owner = await Owner.findById(decoded._id).select('name email contactNumber');
      if (!owner) return res.status(401).json({ message: 'unauthorized' });
      req.user = owner;
      req.role = 'owner';
    } else {
      const user = await User.findById(decoded._id).select('name email contactNumber');
      if (!user) return res.status(401).json({ message: 'unauthorized' });
      req.user = user;
      req.role = 'user';
    }

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'unauthorized' });
  }
};

// Role-based authorization – use after protect middleware
module.exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    return next();
  };
};