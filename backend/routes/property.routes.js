const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const {
  createProperty,
  getProperties,
  getNearbyProperties,
  getMyProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} = require('../controllers/property.controller');

// Public routes
router.get('/', getProperties);
router.get('/near', getNearbyProperties);

// Owner-only routes (must come before :id param)
router.get('/my', protect, authorizeRoles('owner'), getMyProperties);
router.post('/', protect, authorizeRoles('owner'), createProperty);

// Public single property
router.get('/:id', getPropertyById);

// Owner-only update/delete
router.put('/:id', protect, authorizeRoles('owner'), updateProperty);
router.delete('/:id', protect, authorizeRoles('owner'), deleteProperty);

module.exports = router;
