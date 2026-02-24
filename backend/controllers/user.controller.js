/**
 * User Controller — register, login, Google ID-token auth, profile, logout
 */
const User = require('../models/user.model');
const userService = require('../services/user.services');
const BlacklistToken = require('../models/blacklistToken.model');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config');

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// ── Register ──
module.exports.registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { fullname, name, email, password, contactNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const resolvedName =
      name ||
      (fullname && typeof fullname === 'object' && fullname.firstname && fullname.lastname && `${fullname.firstname} ${fullname.lastname}`) ||
      (fullname && typeof fullname === 'object' && (fullname.firstname || fullname.lastname)) ||
      (typeof fullname === 'string' ? fullname : undefined);

    if (!resolvedName) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const hashPassword = await User.hashPassword(password);

    const user = await userService.createUser({
      name: resolvedName,
      email,
      password: hashPassword,
      contactNumber,
    });

    const token = user.generateAuthToken();
    res.cookie('token', token, config.COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        roles: user.roles,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ──
module.exports.loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'This account uses Google login. Please sign in with Google.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = user.generateAuthToken();
    res.cookie('token', token, config.COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        roles: user.roles,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Google ID-Token Auth (used by @react-oauth/google on frontend) ──
module.exports.googleAuth = async (req, res) => {
  try {
    // Accept both field names: "token" (preferred) and "idToken" (legacy)
    const idToken = req.body.token || req.body.idToken;

    console.log('[googleAuth] body keys:', Object.keys(req.body));
    console.log('[googleAuth] token received:', idToken ? `yes (${idToken.length} chars)` : 'NONE');
    console.log('[googleAuth] GOOGLE_CLIENT_ID:', config.GOOGLE_CLIENT_ID ? 'set' : 'MISSING');

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
      console.error('[googleAuth] verifyIdToken FAILED:', verifyErr.message);
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

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = await User.hashPassword(`${Date.now()}-${googleId}`);
      user = await User.create({ name, email, password: randomPassword, googleId, roles: ['user'] });
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Your account has been banned' });
    }

    const jwtToken = user.generateAuthToken();
    res.cookie('token', jwtToken, config.COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        roles: user.roles,
        googleId: user.googleId,
      },
    });
  } catch (err) {
    console.error('Google Auth Error (user):', err.message);
    return res.status(401).json({ success: false, message: 'Google authentication failed', error: err.message });
  }
};

// ── Get Profile ──
module.exports.getUserProfile = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

  return res.status(200).json({
    success: true,
    token,
    user: req.user
      ? { name: req.user.name, email: req.user.email, contactNumber: req.user.contactNumber }
      : null,
  });
};

// ── Update Profile ──
module.exports.updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, contactNumber, password } = req.body;
    if (name) user.name = name;
    if (contactNumber) user.contactNumber = contactNumber;
    if (password) user.password = await User.hashPassword(password);

    await user.save();

    return res.json({
      success: true,
      user: { name: user.name, email: user.email, contactNumber: user.contactNumber },
    });
  } catch (err) {
    next(err);
  }
};

// ── Refresh Token ──
module.exports.refreshToken = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  const token = req.user.generateAuthToken();
  res.cookie('token', token, config.COOKIE_OPTIONS);
  return res.status(200).json({ success: true, token, user: req.user });
};

// ── Logout ──
module.exports.logoutUser = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (token) await BlacklistToken.create({ token });

    res.clearCookie('token', { httpOnly: true, secure: config.IS_PRODUCTION, sameSite: config.IS_PRODUCTION ? 'none' : 'lax' });
    return res.status(200).json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};