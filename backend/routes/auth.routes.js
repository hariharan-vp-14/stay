const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const config = require('../config');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/security.middleware');
const generateToken = require('../utils/generateToken');

// Google ID-token controllers (per-role)
const { googleAuth: googleAuthUser } = require('../controllers/user.controller');
const { googleAuth: googleAuthOwner } = require('../controllers/owner.controller');
const { googleAuthAdmin } = require('../controllers/admin.controller');

// ── GET /api/auth/me — returns logged-in user with roles ──
router.get('/me', protect, (req, res) => {
  return res.status(200).json({
    success: true,
    role: req.role,
    roles: req.roles || [req.role],
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      contactNumber: req.user.contactNumber,
    },
  });
});

// ═══════════════════════════════════════════════════════════════
//  Google OAuth — Passport redirect flow
//  GET /api/auth/google?role=user|owner|admin
//  GET /api/auth/google/callback
// ═══════════════════════════════════════════════════════════════

router.get(
  '/google',
  authLimiter,
  (req, res, next) => {
    const role = req.query.role || 'user';
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: role, // pass requested role to the strategy
      prompt: 'select_account',
    })(req, res, next);
  },
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${config.CLIENT_ORIGIN}/login?error=google_failed` }),
  (req, res) => {
    // req.user is set by Passport after successful verification
    const token = generateToken(req.user._id, req.user.roles);

    res.cookie('token', token, config.COOKIE_OPTIONS);

    // Redirect to frontend with token (frontend reads it from cookie or URL)
    const role = req.user.roles.includes('admin') ? 'admin' : req.user.roles.includes('owner') ? 'owner' : 'user';
    const redirectPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';
    res.redirect(`${config.CLIENT_ORIGIN}${redirectPath}?token=${token}`);
  },
);

// ═══════════════════════════════════════════════════════════════
//  POST /api/auth/google-login
//  Unified Google ID-token login — dispatches to the correct
//  controller based on the "role" field in the request body.
//  Body: { token: "<Google ID token>", role: "user"|"owner"|"admin" }
// ═══════════════════════════════════════════════════════════════
router.post('/google-login', authLimiter, (req, res, next) => {
  const role = (req.body.role || 'user').toLowerCase();

  switch (role) {
    case 'owner':
      return googleAuthOwner(req, res, next);
    case 'admin':
      return googleAuthAdmin(req, res, next);
    default:
      return googleAuthUser(req, res, next);
  }
});

module.exports = router;
