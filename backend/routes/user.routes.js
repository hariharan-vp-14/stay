const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, refreshToken, googleAuth } = require('../controllers/user.controller');
const { authUser } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/google-login', googleAuth);  // Alias for frontend compatibility

// Protected routes
router.get('/profile', authUser, getUserProfile);
router.post('/refresh', authUser, refreshToken);

// Logout route
router.get('/logout', authUser, async (req, res) => {
  const BlacklistToken = require('../models/blacklistToken.model');
  
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await BlacklistToken.create({ token, userId: req.user._id });
    }
    
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;