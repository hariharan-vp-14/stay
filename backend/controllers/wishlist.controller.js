const User = require('../models/user.model');
const Property = require('../models/property.model');

// POST /api/users/save/:propertyId
module.exports.saveProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const user = await User.findById(req.user._id);

    if (user.savedProperties.includes(propertyId)) {
      return res.status(400).json({ success: false, message: 'Already saved' });
    }

    user.savedProperties.push(propertyId);
    await user.save();

    return res.json({ success: true, message: 'Property saved' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/users/save/:propertyId
module.exports.unsaveProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const user = await User.findById(req.user._id);

    user.savedProperties = user.savedProperties.filter(
      (id) => id.toString() !== propertyId
    );
    await user.save();

    return res.json({ success: true, message: 'Property removed from saved' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/saved
module.exports.getSavedProperties = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedProperties',
      populate: { path: 'owner', select: 'name email contactNumber' },
    });

    return res.json({ success: true, properties: user.savedProperties });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
