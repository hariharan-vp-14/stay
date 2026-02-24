const Owner = require('../models/owner.model');
const BlacklistToken = require('../models/blacklistToken.model');
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports.authOwner = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

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
    const owner = await Owner.findById(decoded._id).select('name email contactNumber');

    if (!owner) return res.status(401).json({ success: false, message: 'Unauthorized' });

    req.owner = owner;

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};
