const express = require('express');
const router = express.Router();
const {
  registerOwner,
  loginOwner,
  getOwnerProfile,
  refreshToken,
  googleAuth,
  logoutOwner,
  updateOwnerProfile,
} = require('../controllers/owner.controller');
const { authOwner } = require('../middleware/ownerAuth.middleware');

router.post('/register', registerOwner);
router.post('/login', loginOwner);
router.post('/google', googleAuth);
router.post('/google-login', googleAuth);  // Alias for frontend compatibility
router.get('/profile', authOwner, getOwnerProfile);
router.put('/profile', authOwner, updateOwnerProfile);
router.post('/refresh', authOwner, refreshToken);
router.get('/logout', authOwner, logoutOwner);

module.exports = router;
