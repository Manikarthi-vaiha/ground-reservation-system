const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Ground = require('../models/Ground');
const User = require('../models/User');

const router = express.Router();

// Calculate pricing based on business rules
const calculatePricing = (date, duration, isContinuous, hasMembership) => {
  const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6; // Friday, Saturday, Sunday

  let hourlyRate;

  if (hasMembership) {
    hourlyRate = 800; // Membership rate for all days
  } else if (isContinuous && duration > 1) {
    hourlyRate = 900; // Continuous booking rate
  } else if (isWeekend) {
    hourlyRate = 1000; // Friday to Sunday
  } else {
    hourlyRate = 800; // Monday to Thursday
  }

  return hourlyRate * duration;
};

// Create new booking
router.post('/', auth, [
  body('groundId').isMongoId().withMessage('Valid ground ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required'),
  body('duration').isNumeric().withMessage('Duration is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groundId, date, startTime, endTime, duration, creditPointsUsed = 0 } = req.body;

    // Get ground details
    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    // Check availability
    const existingBookings = await Booking.find({
      ground: groundId,
      date: new Date(date),
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({ message: 'Time slot is not available' });
    }

    // Get user details for membership check
    const user = await User.findById(req.user._id);
    const hasMembership = user.membership !== 'none' &&
                         user.membershipExpiry &&
                         new Date(user.membershipExpiry) > new Date();

    // Calculate pricing
    const isContinuous = duration > 1;
    const totalAmount = calculatePricing(date, duration, isContinuous, hasMembership);

    // Calculate credit points earned (1 point per 10 rupees spent)
    const creditPointsEarned = Math.floor(totalAmount / 10);

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      ground: groundId,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      totalAmount,
      creditPointsEarned,
      creditPointsUsed,
      bookingType: hasMembership ? 'membership' : (isContinuous ? 'continuous' : 'regular')
    });

    await booking.save();

    // Update user's credit points
    const newCreditPoints = user.creditPoints + creditPointsEarned - creditPointsUsed;
    await User.findByIdAndUpdate(req.user._id, { creditPoints: newCreditPoints });

    // Populate booking details
    await booking.populate('ground', 'name type location');
    await booking.populate('user', 'name email phone');

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('ground', 'name type location')
      .sort({ date: -1, startTime: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('ground', 'name type location')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is a merchant
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'merchant') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking can be cancelled (not completed)
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Refund credit points if any were used
    if (booking.creditPointsUsed > 0) {
      const user = await User.findById(req.user._id);
      await User.findByIdAndUpdate(req.user._id, {
        creditPoints: user.creditPoints + booking.creditPointsUsed
      });
    }

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pricing estimate
router.post('/estimate', auth, [
  body('groundId').isMongoId().withMessage('Valid ground ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('duration').isNumeric().withMessage('Duration is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groundId, date, duration } = req.body;

    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    const user = await User.findById(req.user._id);
    const hasMembership = user.membership !== 'none' &&
                         user.membershipExpiry &&
                         new Date(user.membershipExpiry) > new Date();

    const isContinuous = duration > 1;
    const totalAmount = calculatePricing(date, duration, isContinuous, hasMembership);
    const creditPointsEarned = Math.floor(totalAmount / 10);

    res.json({
      totalAmount,
      creditPointsEarned,
      hasMembership,
      isContinuous,
      pricing: {
        weekday: 800,
        weekend: 1000,
        continuous: 900,
        membership: 800
      }
    });
  } catch (error) {
    console.error('Get estimate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
