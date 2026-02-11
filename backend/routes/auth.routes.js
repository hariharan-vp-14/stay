const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

// GET /api/auth/me — returns logged-in user/owner with role
router.get('/me', protect, (req, res) => {
  return res.status(200).json({
    success: true,
    role: req.role,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      contactNumber: req.user.contactNumber,
    },
  });
});

module.exports = router;
