const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const PS5Booking = require('../models/PS5Booking');
const User = require('../models/User');

const router = express.Router();

// PS5 pricing
const PS5_PRICING = {
  single: 100,
  double: 150
};

// Create new PS5 booking
router.post('/', auth, [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required'),
  body('duration').isNumeric().withMessage('Duration is required'),
  body('playerType').isIn(['single', 'double']).withMessage('Valid player type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, startTime, endTime, duration, playerType, creditPointsUsed = 0 } = req.body;

    // Check availability (PS5 can only be booked by one person at a time)
    const existingBookings = await PS5Booking.find({
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
      return res.status(400).json({ message: 'PS5 is not available at this time' });
    }

    // Calculate pricing
    const hourlyRate = PS5_PRICING[playerType];
    const totalAmount = hourlyRate * duration;
    const creditPointsEarned = Math.floor(totalAmount / 10);

    // Create PS5 booking
    const ps5Booking = new PS5Booking({
      user: req.user._id,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      playerType,
      totalAmount,
      creditPointsEarned,
      creditPointsUsed
    });

    await ps5Booking.save();

    // Update user's credit points
    const user = await User.findById(req.user._id);
    const newCreditPoints = user.creditPoints + creditPointsEarned - creditPointsUsed;
    await User.findByIdAndUpdate(req.user._id, { creditPoints: newCreditPoints });

    // Populate booking details
    await ps5Booking.populate('user', 'name email phone');

    res.status(201).json(ps5Booking);
  } catch (error) {
    console.error('Create PS5 booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's PS5 bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const ps5Bookings = await PS5Booking.find({ user: req.user._id })
      .sort({ date: -1, startTime: -1 });

    res.json(ps5Bookings);
  } catch (error) {
    console.error('Get PS5 bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single PS5 booking
router.get('/:id', auth, async (req, res) => {
  try {
    const ps5Booking = await PS5Booking.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!ps5Booking) {
      return res.status(404).json({ message: 'PS5 booking not found' });
    }

    // Check if user owns this booking
    if (ps5Booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ps5Booking);
  } catch (error) {
    console.error('Get PS5 booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel PS5 booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const ps5Booking = await PS5Booking.findById(req.params.id);

    if (!ps5Booking) {
      return res.status(404).json({ message: 'PS5 booking not found' });
    }

    // Check if user owns this booking
    if (ps5Booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking can be cancelled (not completed)
    if (ps5Booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }

    ps5Booking.status = 'cancelled';
    await ps5Booking.save();

    // Refund credit points if any were used
    if (ps5Booking.creditPointsUsed > 0) {
      const user = await User.findById(req.user._id);
      await User.findByIdAndUpdate(req.user._id, {
        creditPoints: user.creditPoints + ps5Booking.creditPointsUsed
      });
    }

    res.json({ message: 'PS5 booking cancelled successfully', ps5Booking });
  } catch (error) {
    console.error('Cancel PS5 booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get PS5 availability for a specific date
router.get('/availability/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // Get existing bookings for the date
    const existingBookings = await PS5Booking.find({
      date: new Date(date),
      status: { $in: ['confirmed', 'pending'] }
    });

    // Generate available time slots (10 AM to 10 PM, 1-hour slots)
    const availableSlots = [];
    const startHour = 10;
    const endHour = 22;

    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = `${hour.toString().padStart(2, '0')}:00`;
      const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;

      // Check if this slot is available
      const isBooked = existingBookings.some(booking => {
        return (booking.startTime <= slotStart && booking.endTime > slotStart) ||
               (booking.startTime < slotEnd && booking.endTime >= slotEnd) ||
               (booking.startTime >= slotStart && booking.endTime <= slotEnd);
      });

      if (!isBooked) {
        availableSlots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: true
        });
      }
    }

    res.json(availableSlots);
  } catch (error) {
    console.error('Get PS5 availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get PS5 pricing estimate
router.post('/estimate', auth, [
  body('duration').isNumeric().withMessage('Duration is required'),
  body('playerType').isIn(['single', 'double']).withMessage('Valid player type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { duration, playerType } = req.body;

    const hourlyRate = PS5_PRICING[playerType];
    const totalAmount = hourlyRate * duration;
    const creditPointsEarned = Math.floor(totalAmount / 10);

    res.json({
      totalAmount,
      creditPointsEarned,
      hourlyRate,
      pricing: PS5_PRICING
    });
  } catch (error) {
    console.error('Get PS5 estimate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
