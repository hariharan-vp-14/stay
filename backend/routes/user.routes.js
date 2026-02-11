const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, refreshToken, googleAuth, updateUserProfile } = require('../controllers/user.controller');
const { authUser, protect, authorizeRoles } = require('../middleware/auth.middleware');
const { saveProperty, unsaveProperty, getSavedProperties } = require('../controllers/wishlist.controller');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/google-login', googleAuth);  // Alias for frontend compatibility

// Protected routes
router.get('/profile', authUser, getUserProfile);
router.put('/profile', authUser, updateUserProfile);
router.post('/refresh', authUser, refreshToken);

// Wishlist routes
router.post('/save/:propertyId', protect, authorizeRoles('user'), saveProperty);
router.delete('/save/:propertyId', protect, authorizeRoles('user'), unsaveProperty);
router.get('/saved', protect, authorizeRoles('user'), getSavedProperties);

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