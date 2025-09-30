const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { merchantAuth } = require('../middleware/auth');
const Ground = require('../models/Ground');
const Booking = require('../models/Booking');
const Event = require('../models/Event');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/grounds');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// ==================== GROUND MANAGEMENT ====================

// Get merchant's grounds (Mobile API)
router.get('/grounds', merchantAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    let query = { merchant: req.user._id };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;
    const grounds = await Ground.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Ground.countDocuments(query);

    res.json({
      success: true,
      message: 'Grounds retrieved successfully',
      data: {
        grounds,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalGrounds: total,
          hasNext: skip + grounds.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get grounds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching grounds'
    });
  }
});

// Get single ground (Mobile API)
router.get('/grounds/:id', merchantAuth, async (req, res) => {
  try {
    const ground = await Ground.findOne({
      _id: req.params.id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    res.json({
      success: true,
      message: 'Ground retrieved successfully',
      data: { ground }
    });
  } catch (error) {
    console.error('Get ground error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ground'
    });
  }
});

// Create new ground (Mobile API)
router.post('/grounds', merchantAuth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Ground name is required'),
  body('type').isIn(['cricket', 'football']).withMessage('Invalid ground type'),
  body('location').trim().isLength({ min: 2 }).withMessage('Location is required'),
  body('description').optional().trim(),
  body('capacity').optional().isNumeric().withMessage('Capacity must be a number'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const ground = new Ground({
      ...req.body,
      merchant: req.user._id
    });

    await ground.save();

    res.status(201).json({
      success: true,
      message: 'Ground created successfully',
      data: { ground }
    });
  } catch (error) {
    console.error('Create ground error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating ground'
    });
  }
});

// Update ground (Mobile API)
router.put('/grounds/:id', merchantAuth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Ground name must be at least 2 characters'),
  body('type').optional().isIn(['cricket', 'football']).withMessage('Invalid ground type'),
  body('location').optional().trim().isLength({ min: 2 }).withMessage('Location must be at least 2 characters'),
  body('description').optional().trim(),
  body('capacity').optional().isNumeric().withMessage('Capacity must be a number'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const ground = await Ground.findOneAndUpdate(
      { _id: req.params.id, merchant: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    res.json({
      success: true,
      message: 'Ground updated successfully',
      data: { ground }
    });
  } catch (error) {
    console.error('Update ground error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating ground'
    });
  }
});

// Delete ground (Mobile API)
router.delete('/grounds/:id', merchantAuth, async (req, res) => {
  try {
    const ground = await Ground.findOneAndDelete({
      _id: req.params.id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    // Delete associated images
    if (ground.images && ground.images.length > 0) {
      ground.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    res.json({
      success: true,
      message: 'Ground deleted successfully'
    });
  } catch (error) {
    console.error('Delete ground error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting ground'
    });
  }
});

// Upload ground images (Mobile API)
router.post('/grounds/:id/images', merchantAuth, upload.array('images', 10), async (req, res) => {
  try {
    const ground = await Ground.findOne({
      _id: req.params.id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const currentImageCount = ground.images ? ground.images.length : 0;
    const newImageCount = req.files.length;
    const totalImages = currentImageCount + newImageCount;

    if (totalImages < 5) {
      return res.status(400).json({
        success: false,
        message: `Please upload at least ${5 - currentImageCount} more images. Minimum 5 images required.`
      });
    }

    const newImagePaths = req.files.map(file => `/uploads/grounds/${file.filename}`);

    if (!ground.images) {
      ground.images = [];
    }

    ground.images = [...ground.images, ...newImagePaths];
    await ground.save();

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: ground.images,
        totalImages: ground.images.length
      }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading images'
    });
  }
});

// Delete ground image (Mobile API)
router.delete('/grounds/:id/images/:imageIndex', merchantAuth, async (req, res) => {
  try {
    const ground = await Ground.findOne({
      _id: req.params.id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    const imageIndex = parseInt(req.params.imageIndex);

    if (!ground.images || imageIndex < 0 || imageIndex >= ground.images.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    if (ground.images.length <= 5) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete image. Minimum 5 images required.'
      });
    }

    const imagePath = ground.images[imageIndex];
    const fullPath = path.join(__dirname, '..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    ground.images.splice(imageIndex, 1);
    await ground.save();

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        images: ground.images,
        totalImages: ground.images.length
      }
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting image'
    });
  }
});

// ==================== BOOKING MANAGEMENT ====================

// Get merchant's bookings (Mobile API)
router.get('/bookings', merchantAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, groundId } = req.query;

    const grounds = await Ground.find({ merchant: req.user._id });
    const groundIds = grounds.map(ground => ground._id);

    let query = { ground: { $in: groundIds } };

    if (status) {
      query.status = status;
    }

    if (groundId) {
      // Verify the ground belongs to this merchant
      const ground = grounds.find(g => g._id.toString() === groundId);
      if (ground) {
        query.ground = groundId;
      }
    }

    const skip = (page - 1) * limit;
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('ground', 'name type location')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1, startTime: -1 });

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBookings: total,
          hasNext: skip + bookings.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    });
  }
});

// Get single booking (Mobile API)
router.get('/bookings/:id', merchantAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('ground', 'name type location');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if merchant owns the ground for this booking
    const ground = await Ground.findOne({
      _id: booking.ground._id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      message: 'Booking retrieved successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking'
    });
  }
});

// Update booking status (Mobile API)
router.put('/bookings/:id/status', merchantAuth, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status } = req.body;

    const booking = await Booking.findById(req.params.id).populate('ground');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const ground = await Ground.findOne({
      _id: booking.ground._id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking status'
    });
  }
});

// ==================== EVENT MANAGEMENT ====================

// Get merchant's events (Mobile API)
router.get('/events', merchantAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, groundId } = req.query;

    const grounds = await Ground.find({ merchant: req.user._id });
    const groundIds = grounds.map(ground => ground._id);

    let query = { ground: { $in: groundIds } };

    if (status) {
      query.status = status;
    }

    if (groundId) {
      const ground = grounds.find(g => g._id.toString() === groundId);
      if (ground) {
        query.ground = groundId;
      }
    }

    const skip = (page - 1) * limit;
    const events = await Event.find(query)
      .populate('user', 'name email phone')
      .populate('ground', 'name type location')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1, startTime: -1 });

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      message: 'Events retrieved successfully',
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalEvents: total,
          hasNext: skip + events.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
});

// Get single event (Mobile API)
router.get('/events/:id', merchantAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('ground', 'name type location');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const ground = await Ground.findOne({
      _id: event.ground._id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      message: 'Event retrieved successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  }
});

// Update event status (Mobile API)
router.put('/events/:id/status', merchantAuth, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status } = req.body;

    const event = await Event.findById(req.params.id).populate('ground');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const ground = await Ground.findOne({
      _id: event.ground._id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    event.status = status;
    await event.save();

    res.json({
      success: true,
      message: 'Event status updated successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating event status'
    });
  }
});

// ==================== MERCHANT DASHBOARD ====================

// Get merchant dashboard (Mobile API)
router.get('/dashboard', merchantAuth, async (req, res) => {
  try {
    const grounds = await Ground.find({ merchant: req.user._id });
    const groundIds = grounds.map(ground => ground._id);

    const totalBookings = await Booking.countDocuments({ ground: { $in: groundIds } });
    const confirmedBookings = await Booking.countDocuments({
      ground: { $in: groundIds },
      status: 'confirmed'
    });
    const totalEvents = await Event.countDocuments({ ground: { $in: groundIds } });
    const confirmedEvents = await Event.countDocuments({
      ground: { $in: groundIds },
      status: 'confirmed'
    });

    // Calculate total revenue
    const bookings = await Booking.find({
      ground: { $in: groundIds },
      status: 'confirmed'
    });
    const events = await Event.find({
      ground: { $in: groundIds },
      status: 'confirmed'
    });

    const totalRevenue = [
      ...bookings.map(b => b.totalAmount),
      ...events.map(e => e.totalAmount)
    ].reduce((sum, amount) => sum + amount, 0);

    // Get recent bookings
    const recentBookings = await Booking.find({ ground: { $in: groundIds } })
      .populate('user', 'name email phone')
      .populate('ground', 'name type location')
      .sort({ date: -1, startTime: -1 })
      .limit(5);

    // Get recent events
    const recentEvents = await Event.find({ ground: { $in: groundIds } })
      .populate('user', 'name email phone')
      .populate('ground', 'name type location')
      .sort({ date: -1, startTime: -1 })
      .limit(5);

    // Get ground-wise statistics
    const groundStats = await Promise.all(groundIds.map(async (groundId) => {
      const ground = await Ground.findById(groundId);
      const groundBookings = await Booking.countDocuments({ ground: groundId });
      const groundEvents = await Event.countDocuments({ ground: groundId });

      return {
        groundId,
        groundName: ground.name,
        totalBookings: groundBookings,
        totalEvents: groundEvents
      };
    }));

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        merchant: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email
        },
        stats: {
          totalGrounds: grounds.length,
          totalBookings,
          confirmedBookings,
          totalEvents,
          confirmedEvents,
          totalRevenue
        },
        groundStats,
        recentBookings,
        recentEvents
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// ==================== ANALYTICS ====================

// Get merchant analytics (Mobile API)
router.get('/analytics', merchantAuth, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const grounds = await Ground.find({ merchant: req.user._id });
    const groundIds = grounds.map(ground => ground._id);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get bookings in the period
    const bookings = await Booking.find({
      ground: { $in: groundIds },
      date: { $gte: startDate }
    }).populate('ground', 'name type');

    // Get events in the period
    const events = await Event.find({
      ground: { $in: groundIds },
      date: { $gte: startDate }
    }).populate('ground', 'name type');

    // Calculate daily revenue
    const dailyRevenue = {};
    [...bookings, ...events].forEach(item => {
      const date = item.date.toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += item.totalAmount;
    });

    // Calculate ground-wise revenue
    const groundRevenue = {};
    grounds.forEach(ground => {
      groundRevenue[ground.name] = 0;
    });

    [...bookings, ...events].forEach(item => {
      groundRevenue[item.ground.name] += item.totalAmount;
    });

    // Calculate booking types
    const bookingTypes = {
      regular: bookings.filter(b => b.bookingType === 'regular').length,
      continuous: bookings.filter(b => b.bookingType === 'continuous').length,
      membership: bookings.filter(b => b.bookingType === 'membership').length
    };

    res.json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: {
        period: parseInt(period),
        totalRevenue: Object.values(dailyRevenue).reduce((sum, amount) => sum + amount, 0),
        totalBookings: bookings.length,
        totalEvents: events.length,
        dailyRevenue,
        groundRevenue,
        bookingTypes
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;
