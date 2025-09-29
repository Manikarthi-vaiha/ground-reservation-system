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

// Get merchant's grounds
router.get('/grounds', merchantAuth, async (req, res) => {
  try {
    const grounds = await Ground.find({ merchant: req.user._id });
    res.json(grounds);
  } catch (error) {
    console.error('Get grounds error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new ground
router.post('/grounds', merchantAuth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Ground name is required'),
  body('type').isIn(['cricket', 'football']).withMessage('Invalid ground type'),
  body('location').trim().isLength({ min: 2 }).withMessage('Location is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ground = new Ground({
      ...req.body,
      merchant: req.user._id
    });

    await ground.save();
    res.status(201).json(ground);
  } catch (error) {
    console.error('Create ground error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update ground
router.put('/grounds/:id', merchantAuth, async (req, res) => {
  try {
    const ground = await Ground.findOneAndUpdate(
      { _id: req.params.id, merchant: req.user._id },
      req.body,
      { new: true }
    );

    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    res.json(ground);
  } catch (error) {
    console.error('Update ground error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete ground
router.delete('/grounds/:id', merchantAuth, async (req, res) => {
  try {
    const ground = await Ground.findOneAndDelete({
      _id: req.params.id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    res.json({ message: 'Ground deleted successfully' });
  } catch (error) {
    console.error('Delete ground error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload ground images
router.post('/grounds/:id/images', merchantAuth, upload.array('images', 10), async (req, res) => {
  try {
    const ground = await Ground.findOne({
      _id: req.params.id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    // Check if adding these images would exceed the minimum requirement
    const currentImageCount = ground.images ? ground.images.length : 0;
    const newImageCount = req.files.length;
    const totalImages = currentImageCount + newImageCount;

    if (totalImages < 5) {
      return res.status(400).json({
        message: `Please upload at least ${5 - currentImageCount} more images. Minimum 5 images required.`
      });
    }

    // Add new image paths to the ground
    const newImagePaths = req.files.map(file => `/uploads/grounds/${file.filename}`);

    if (!ground.images) {
      ground.images = [];
    }

    ground.images = [...ground.images, ...newImagePaths];
    await ground.save();

    res.json({
      message: 'Images uploaded successfully',
      images: ground.images,
      totalImages: ground.images.length
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete ground image
router.delete('/grounds/:id/images/:imageIndex', merchantAuth, async (req, res) => {
  try {
    const ground = await Ground.findOne({
      _id: req.params.id,
      merchant: req.user._id
    });

    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    const imageIndex = parseInt(req.params.imageIndex);

    if (!ground.images || imageIndex < 0 || imageIndex >= ground.images.length) {
      return res.status(400).json({ message: 'Invalid image index' });
    }

    // Check if removing this image would go below minimum requirement
    if (ground.images.length <= 5) {
      return res.status(400).json({
        message: 'Cannot delete image. Minimum 5 images required.'
      });
    }

    // Delete the file from filesystem
    const imagePath = ground.images[imageIndex];
    const fullPath = path.join(__dirname, '..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Remove from array
    ground.images.splice(imageIndex, 1);
    await ground.save();

    res.json({
      message: 'Image deleted successfully',
      images: ground.images,
      totalImages: ground.images.length
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get merchant's bookings
router.get('/bookings', merchantAuth, async (req, res) => {
  try {
    const grounds = await Ground.find({ merchant: req.user._id });
    const groundIds = grounds.map(ground => ground._id);

    const bookings = await Booking.find({ ground: { $in: groundIds } })
      .populate('user', 'name email phone')
      .populate('ground', 'name type location')
      .sort({ date: -1, startTime: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status
router.put('/bookings/:id/status', merchantAuth, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    // Check if merchant owns the ground for this booking
    const booking = await Booking.findById(req.params.id).populate('ground');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.ground.merchant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get merchant's events
router.get('/events', merchantAuth, async (req, res) => {
  try {
    const grounds = await Ground.find({ merchant: req.user._id });
    const groundIds = grounds.map(ground => ground._id);

    const events = await Event.find({ ground: { $in: groundIds } })
      .populate('user', 'name email phone')
      .populate('ground', 'name type location')
      .sort({ date: -1, startTime: -1 });

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event status
router.put('/events/:id/status', merchantAuth, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    // Check if merchant owns the ground for this event
    const event = await Event.findById(req.params.id).populate('ground');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.ground.merchant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    event.status = status;
    await event.save();

    res.json(event);
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get merchant dashboard stats
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

    res.json({
      totalGrounds: grounds.length,
      totalBookings,
      confirmedBookings,
      totalEvents,
      confirmedEvents,
      totalRevenue
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
