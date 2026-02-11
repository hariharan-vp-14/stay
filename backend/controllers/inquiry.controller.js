const Inquiry = require('../models/inquiry.model');
const Property = require('../models/property.model');

// POST /api/inquiries — user sends inquiry
module.exports.createInquiry = async (req, res) => {
  try {
    const { propertyId, message } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Check duplicate
    const existing = await Inquiry.findOne({ user: req.user._id, property: propertyId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already sent an inquiry for this property' });
    }

    const inquiry = await Inquiry.create({
      user: req.user._id,
      owner: property.owner,
      property: propertyId,
      message,
    });

    // Increment inquiry count
    property.inquiriesCount += 1;
    await property.save();

    return res.status(201).json({ success: true, inquiry });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/inquiries/user — user's sent inquiries
module.exports.getUserInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ user: req.user._id })
      .populate('property', 'title type price address city images')
      .populate('owner', 'name email')
      .sort('-createdAt');

    return res.json({ success: true, inquiries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/inquiries/owner — owner's received inquiries
module.exports.getOwnerInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ owner: req.user._id })
      .populate('property', 'title type price address city images')
      .populate('user', 'name email contactNumber')
      .sort('-createdAt');

    return res.json({ success: true, inquiries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/inquiries/:id/respond — owner responds
module.exports.respondToInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    if (inquiry.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    inquiry.status = 'responded';
    await inquiry.save();
    return res.json({ success: true, inquiry });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
