const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const { getOwnerAnalytics } = require('../controllers/analytics.controller');

router.get('/analytics', protect, authorizeRoles('owner'), getOwnerAnalytics);

module.exports = router;
