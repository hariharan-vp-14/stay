const Property = require('../models/property.model');

// POST /api/properties — owner creates a property
module.exports.createProperty = async (req, res) => {
  try {
    const {
      title, type, price, deposit, gender,
      amenities, images, location, address, city,
      description, contactNumber, googleMapLink,
    } = req.body;

    const property = await Property.create({
      title,
      type,
      price,
      deposit,
      gender,
      amenities: amenities || [],
      images: images || [],
      location: location || { type: 'Point', coordinates: [0, 0] },
      address,
      city,
      description,
      contactNumber: contactNumber || '',
      googleMapLink: googleMapLink || '',
      owner: req.user._id,
    });

    return res.status(201).json({ success: true, property });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/properties — public list with filters + pagination
module.exports.getProperties = async (req, res) => {
  try {
    const {
      type, city, minPrice, maxPrice, gender,
      amenities, search, page = 1, limit = 12,
      sort = '-createdAt',
    } = req.query;

    const filter = { available: true };

    if (type) filter.type = type;
    if (city) filter.city = city.toLowerCase();
    if (gender) filter.gender = gender;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (amenities) {
      const arr = amenities.split(',').map((a) => a.trim());
      filter.amenities = { $all: arr };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('owner', 'name email contactNumber')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/properties/near — geo search
module.exports.getNearbyProperties = async (req, res) => {
  try {
    const { lat, lng, radius = 5, type } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const filter = {
      available: true,
      location: {
        $geoWithin: {
          $centerSphere: [
            [Number(lng), Number(lat)],
            Number(radius) / 6378.1, // radius in km → radians
          ],
        },
      },
    };

    if (type) filter.type = type;

    const properties = await Property.find(filter)
      .populate('owner', 'name email contactNumber')
      .limit(50);

    return res.json({ success: true, properties });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/properties/my — owner's own properties
module.exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).sort('-createdAt');
    return res.json({ success: true, properties });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/properties/:id
module.exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      'owner',
      'name email contactNumber'
    );

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Increment view count
    property.viewsCount += 1;
    await property.save();

    return res.json({ success: true, property });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/properties/:id — owner updates
module.exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowed = [
      'title', 'type', 'price', 'deposit', 'gender',
      'amenities', 'images', 'location', 'address', 'city',
      'description', 'available', 'contactNumber', 'googleMapLink',
    ];

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        property[key] = req.body[key];
      }
    });

    await property.save();
    return res.json({ success: true, property });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/properties/:id
module.exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await property.deleteOne();
    return res.json({ success: true, message: 'Property deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
