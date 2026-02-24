const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (userId, roles = ['user']) => {
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return jwt.sign({ _id: userId, roles: rolesArray }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

module.exports = generateToken;