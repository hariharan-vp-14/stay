const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const {
  createInquiry,
  getUserInquiries,
  getOwnerInquiries,
  respondToInquiry,
} = require('../controllers/inquiry.controller');

// User sends inquiry
router.post('/', protect, authorizeRoles('user'), createInquiry);

// User's sent inquiries
router.get('/user', protect, authorizeRoles('user'), getUserInquiries);

// Owner's received inquiries
router.get('/owner', protect, authorizeRoles('owner'), getOwnerInquiries);

// Owner responds to inquiry
router.put('/:id/respond', protect, authorizeRoles('owner'), respondToInquiry);

module.exports = router;
