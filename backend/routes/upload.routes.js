const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// POST /api/upload/images — upload up to 6 property images
router.post(
  '/images',
  protect,
  authorizeRoles('owner'),
  (req, res, next) => {
    upload.array('images', 6)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  (req, res) => {
    try {
      const urls = req.files.map(
        (f) => `/uploads/properties/${f.filename}`
      );
      return res.status(200).json({ success: true, urls });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
