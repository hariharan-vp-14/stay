/**
 * Owner Controller — register, login, Google ID-token auth, profile, logout
 */
const Owner = require('../models/owner.model');
const ownerService = require('../services/owner.services');
const BlacklistToken = require('../models/blacklistToken.model');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config');

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// ── Register ──
module.exports.registerOwner = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, contactNumber } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const existingOwner = await Owner.findOne({ email });
    if (existingOwner) {
      return res.status(400).json({ success: false, message: 'Owner already exists' });
    }

    const hashPassword = await Owner.hashPassword(password);

    const owner = await ownerService.createOwner({
      name,
      email,
      password: hashPassword,
      contactNumber,
    });

    const token = owner.generateAuthToken();
    res.cookie('token', token, config.COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      token,
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        contactNumber: owner.contactNumber,
        googleId: owner.googleId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ──
module.exports.loginOwner = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const owner = await Owner.findOne({ email }).select('+password');
    if (!owner) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!owner.password) {
      return res.status(400).json({ success: false, message: 'This account uses Google login. Please sign in with Google.' });
    }

    const isMatch = await owner.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (owner.isBanned) {
      return res.status(403).json({ success: false, message: 'Your account has been banned' });
    }

    const token = owner.generateAuthToken();
    res.cookie('token', token, config.COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      token,
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        contactNumber: owner.contactNumber,
        googleId: owner.googleId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Profile ──
module.exports.getOwnerProfile = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

  return res.status(200).json({
    success: true,
    token,
    owner: req.owner
      ? { name: req.owner.name, email: req.owner.email, contactNumber: req.owner.contactNumber }
      : null,
  });
};

// ── Update Profile ──
module.exports.updateOwnerProfile = async (req, res, next) => {
  try {
    const owner = await Owner.findById(req.owner._id);
    if (!owner) return res.status(404).json({ success: false, message: 'Owner not found' });

    const { name, contactNumber, password } = req.body;
    if (name) owner.name = name;
    if (contactNumber) owner.contactNumber = contactNumber;
    if (password) owner.password = await Owner.hashPassword(password);

    await owner.save();

    return res.json({
      success: true,
      owner: { name: owner.name, email: owner.email, contactNumber: owner.contactNumber },
    });
  } catch (err) {
    next(err);
  }
};

// ── Refresh Token ──
module.exports.refreshToken = async (req, res) => {
  if (!req.owner) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  const token = req.owner.generateAuthToken();
  res.cookie('token', token, config.COOKIE_OPTIONS);
  return res.status(200).json({ success: true, token, owner: req.owner });
};

// ── Logout ──
module.exports.logoutOwner = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (token) await BlacklistToken.create({ token });

    res.clearCookie('token', { httpOnly: true, secure: config.IS_PRODUCTION, sameSite: config.IS_PRODUCTION ? 'none' : 'lax' });
    return res.status(200).json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

// ── Google ID-Token Auth ──
module.exports.googleAuth = async (req, res) => {
  try {
    // Accept both field names: "token" (preferred) and "idToken" (legacy)
    const idToken = req.body.token || req.body.idToken;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google token is required (send as "token" or "idToken")' });
    }

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('[googleAuth-owner] verifyIdToken FAILED:', verifyErr.message);
      return res.status(401).json({
        success: false,
        message: 'Google token verification failed',
        error: verifyErr.message,
      });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email?.split('@')[0];

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not available from Google' });
    }

    let owner = await Owner.findOne({ email });

    if (!owner) {
      const randomPassword = await Owner.hashPassword(`${Date.now()}-${googleId}`);
      owner = await Owner.create({ name, email, password: randomPassword, googleId });
    } else {
      if (!owner.googleId) {
        owner.googleId = googleId;
        await owner.save();
      }
    }

    if (owner.isBanned) {
      return res.status(403).json({ success: false, message: 'Your account has been banned' });
    }

    const jwtToken = owner.generateAuthToken();
    res.cookie('token', jwtToken, config.COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      token: jwtToken,
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        contactNumber: owner.contactNumber,
        googleId: owner.googleId,
      },
    });
  } catch (err) {
    console.error('Google Auth Error (owner):', err.message);
    return res.status(401).json({ success: false, message: 'Google authentication failed', error: err.message });
  }
};
