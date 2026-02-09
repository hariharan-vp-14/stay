const express = require('express');
const router = express.Router();
const {
  registerOwner,
  loginOwner,
  getOwnerProfile,
  refreshToken,
  googleAuth,
  logoutOwner,
} = require('../controllers/owner.controller');
const { authOwner } = require('../middleware/ownerAuth.middleware');

router.post('/register', registerOwner);
router.post('/login', loginOwner);
router.post('/google', googleAuth);
router.get('/profile', authOwner, getOwnerProfile);
router.post('/refresh', authOwner, refreshToken);
router.get('/logout', authOwner, logoutOwner);

module.exports = router;
