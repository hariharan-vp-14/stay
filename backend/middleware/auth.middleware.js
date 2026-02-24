const User = require('../models/user.model');
const Owner = require('../models/owner.model');
const BlacklistToken = require('../models/blacklistToken.model');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Extract bearer / cookie token from the request.
 */
function extractToken(req) {
  return req.cookies.token || req.headers.authorization?.split(' ')[1] || null;
}

// Legacy middleware – authenticates users only (kept for backward compatibility)
module.exports.authUser = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized — no token' });
  }

  const isBlacklisted = await BlacklistToken.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or already logged out',
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded._id).select('name email contactNumber roles isBanned');

    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (user.isBanned) return res.status(403).json({ success: false, message: 'Your account has been banned' });

    req.user = user;
    req.roles = user.roles;

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// Unified protect middleware – resolves users, owners, and admins from JWT
module.exports.protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized — no token' });
  }

  const isBlacklisted = await BlacklistToken.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or already logged out',
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    // Support both old tokens (decoded.role string) and new tokens (decoded.roles array)
    const roles = decoded.roles || (decoded.role ? [decoded.role] : ['user']);

    if (roles.includes('owner') && !roles.includes('admin') && !roles.includes('user')) {
      // Pure owner token — resolve from Owner collection
      const owner = await Owner.findById(decoded._id).select('name email contactNumber isBanned');
      if (!owner) return res.status(401).json({ success: false, message: 'Unauthorized' });
      if (owner.isBanned) return res.status(403).json({ success: false, message: 'Your account has been banned' });
      req.user = owner;
      req.roles = ['owner'];
      req.role = 'owner'; // backward compat
    } else {
      // User/Admin — resolve from User collection
      const user = await User.findById(decoded._id).select('name email contactNumber roles isBanned');
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      if (user.isBanned) return res.status(403).json({ success: false, message: 'Your account has been banned' });
      req.user = user;
      req.roles = user.roles;
      // backward compat: set req.role to highest priority role
      if (user.roles.includes('admin')) req.role = 'admin';
      else if (user.roles.includes('owner')) req.role = 'owner';
      else req.role = 'user';
    }

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// Role-based authorization – use after protect middleware
// Checks if ANY of the user's roles matches ANY of the required roles
module.exports.authorizeRoles = (...requiredRoles) => {
  return (req, res, next) => {
    const userRoles = req.roles || (req.role ? [req.role] : []);
    const hasRole = requiredRoles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
    }
    return next();
  };
};