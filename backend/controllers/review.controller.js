const Review = require('../models/review.model');
const Property = require('../models/property.model');

// POST /api/reviews — user submits a review
module.exports.createReview = async (req, res) => {
  try {
    const { propertyId, rating, comment } = req.body;

    if (!propertyId || !rating) {
      return res.status(400).json({ success: false, message: 'propertyId and rating are required' });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Upsert — update if exists, create if not
    const review = await Review.findOneAndUpdate(
      { user: req.user._id, property: propertyId },
      { rating, comment },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this property' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/:propertyId — get all reviews for a property
module.exports.getPropertyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ property: req.params.propertyId })
      .populate('user', 'name email')
      .sort('-createdAt');

    // Compute average
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

    return res.status(200).json({
      success: true,
      reviews,
      averageRating: Math.round(avg * 10) / 10,
      total,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/user/my-reviews — get all reviews by current user
module.exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('property', 'title type city images price')
      .sort('-createdAt');

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/reviews/:reviewId — user deletes own review
module.exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await review.deleteOne();
    return res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
