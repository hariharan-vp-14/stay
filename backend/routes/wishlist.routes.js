const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const {
  saveProperty,
  unsaveProperty,
  getSavedProperties,
} = require('../controllers/wishlist.controller');

router.post('/save/:propertyId', protect, authorizeRoles('user'), saveProperty);
router.delete('/save/:propertyId', protect, authorizeRoles('user'), unsaveProperty);
router.get('/saved', protect, authorizeRoles('user'), getSavedProperties);

module.exports = router;
