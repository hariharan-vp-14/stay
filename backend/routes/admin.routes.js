const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const {
  registerAdmin,
  loginAdmin,
  googleAuthAdmin,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  getPendingProperties,
  getAllProperties,
  approveProperty,
  rejectProperty,
  deleteProperty,
  getAdminAnalytics,
  getAllUsers,
  getAllOwners,
  banUser,
  unbanUser,
  banOwner,
  unbanOwner,
  getAuditLogs,
} = require('../controllers/admin.controller');

// Rate limiter for admin auth routes (max 10 attempts per 15 min per IP)
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public: Admin auth (rate-limited) ──
router.post(
  '/register',
  adminAuthLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  registerAdmin
);

router.post(
  '/login',
  adminAuthLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginAdmin
);

router.post('/google', adminAuthLimiter, googleAuthAdmin);
router.post('/google-login', adminAuthLimiter, googleAuthAdmin);

// Forgot / reset password (public, rate-limited)
router.post('/forgot-password', adminAuthLimiter, forgotPassword);
router.put('/reset-password/:token', resetPassword);

// ── Protected: Admin-only routes ──
router.get('/logout', protect, authorizeRoles('admin'), logoutAdmin);

// Properties moderation
router.get('/properties/pending', protect, authorizeRoles('admin'), getPendingProperties);
router.get('/properties', protect, authorizeRoles('admin'), getAllProperties);
router.put('/properties/:id/approve', protect, authorizeRoles('admin'), approveProperty);
router.put('/properties/:id/reject', protect, authorizeRoles('admin'), rejectProperty);
router.delete('/properties/:id', protect, authorizeRoles('admin'), deleteProperty);

// Analytics
router.get('/analytics', protect, authorizeRoles('admin'), getAdminAnalytics);

// User/Owner management
router.get('/users', protect, authorizeRoles('admin'), getAllUsers);
router.get('/owners', protect, authorizeRoles('admin'), getAllOwners);
router.put('/users/:id/ban', protect, authorizeRoles('admin'), banUser);
router.put('/users/:id/unban', protect, authorizeRoles('admin'), unbanUser);
router.put('/owners/:id/ban', protect, authorizeRoles('admin'), banOwner);
router.put('/owners/:id/unban', protect, authorizeRoles('admin'), unbanOwner);

// Audit logs
router.get('/audit-logs', protect, authorizeRoles('admin'), getAuditLogs);

module.exports = router;
