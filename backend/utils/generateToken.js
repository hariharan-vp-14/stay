const jwt = require('jsonwebtoken');

const generateToken = (userId, roles = ['user']) => {
  // Support both array and string for backward compat
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return jwt.sign({ _id: userId, roles: rolesArray }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;