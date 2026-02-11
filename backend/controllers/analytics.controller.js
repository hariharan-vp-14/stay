const Property = require('../models/property.model');
const Inquiry = require('../models/inquiry.model');

// GET /api/owner/analytics
module.exports.getOwnerAnalytics = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const properties = await Property.find({ owner: ownerId });

    const totalProperties = properties.length;
    const totalViews = properties.reduce((sum, p) => sum + p.viewsCount, 0);
    const totalInquiries = properties.reduce((sum, p) => sum + p.inquiriesCount, 0);

    const mostViewedProperty =
      properties.length > 0
        ? properties.reduce((max, p) => (p.viewsCount > max.viewsCount ? p : max), properties[0])
        : null;

    // Per-property breakdown for charts
    const propertyStats = properties.map((p) => ({
      _id: p._id,
      title: p.title,
      type: p.type,
      views: p.viewsCount,
      inquiries: p.inquiriesCount,
    }));

    return res.json({
      success: true,
      analytics: {
        totalProperties,
        totalViews,
        totalInquiries,
        mostViewedProperty: mostViewedProperty
          ? { _id: mostViewedProperty._id, title: mostViewedProperty.title, views: mostViewedProperty.viewsCount }
          : null,
        propertyStats,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
