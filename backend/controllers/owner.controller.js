const ownerModel = require('../models/owner.model');
const ownerService = require('../services/owner.services');
const { validationResult } = require('express-validator');
const blackListTokenModel = require('../models/blacklistToken.model');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports.registerOwner = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, contactNumber } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const existingOwner = await ownerModel.findOne({ email });
  if (existingOwner) {
    return res.status(400).json({ message: 'Owner already exists' });
  }

  const hashPassword = await ownerModel.hashPassword(password);

  const owner = await ownerService.createOwner({
    name,
    email,
    password: hashPassword,
    contactNumber,
  });

  const token = owner.generateAuthToken();
  res.cookie('token', token);

  const ownerProfile = {
    name: owner.name,
    email: owner.email,
    contactNumber: owner.contactNumber,
    googleId: owner.googleId,
  };

  return res.status(201).json({ token, owner: ownerProfile });
};

module.exports.loginOwner = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const owner = await ownerModel.findOne({ email }).select('+password');

  if (!owner) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!owner.password) {
    return res.status(500).json({ message: 'Owner password is not set' });
  }

  const isMatch = await owner.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = owner.generateAuthToken();
  res.cookie('token', token);

  const ownerProfile = {
    name: owner.name,
    email: owner.email,
    contactNumber: owner.contactNumber,
    googleId: owner.googleId,
  };

  return res.status(200).json({ token, owner: ownerProfile });
};

module.exports.getOwnerProfile = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

  const ownerProfile = req.owner
    ? {
        name: req.owner.name,
        email: req.owner.email,
        contactNumber: req.owner.contactNumber,
      }
    : null;

  return res.status(200).json({ token, owner: ownerProfile });
};

module.exports.refreshToken = async (req, res, next) => {
  if (!req.owner) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const token = req.owner.generateAuthToken();
  res.cookie('token', token);
  return res.status(200).json({ token, owner: req.owner });
};

module.exports.logoutOwner = async (req, res, next) => {
  res.clearCookie('token');
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  await blackListTokenModel.create({ token });
  return res.status(200).json({ message: 'Logged out' });
};

module.exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email?.split('@')[0];

    if (!email) {
      return res.status(400).json({ message: 'Email not available from Google' });
    }

    let owner = await ownerModel.findOne({ email });

    if (!owner) {
      const randomPassword = await ownerModel.hashPassword(`${Date.now()}-${googleId}`);
      owner = await ownerModel.create({
        name,
        email,
        password: randomPassword,
        googleId,
      });
    } else if (!owner.googleId) {
      owner.googleId = googleId;
      await owner.save();
    }

    const token = owner.generateAuthToken();
    res.cookie('token', token);

    const ownerProfile = {
      name: owner.name,
      email: owner.email,
      contactNumber: owner.contactNumber,
      googleId: owner.googleId,
    };

    return res.status(200).json({ token, owner: ownerProfile });
  } catch (err) {
    return res.status(401).json({ message: 'Google authentication failed', error: err.message });
  }
};
