const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Event = require('../models/Event');
const Ground = require('../models/Ground');
const User = require('../models/User');
const Booking = require('../models/Booking');

const router = express.Router();

// Calculate event pricing (base rate + additional services)
const calculateEventPricing = (date, duration, guestCount, catering, decorations) => {
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

  // Base rate (higher for events)
  const baseRate = isWeekend ? 1200 : 1000;
  let totalAmount = baseRate * duration;

  // Additional charges
  if (catering) {
    totalAmount += guestCount * 200; // 200 per person for catering
  }

  if (decorations) {
    totalAmount += 1000; // Fixed decoration charge
  }

  return totalAmount;
};

// Create new event booking
router.post('/', auth, [
  body('groundId').isMongoId().withMessage('Valid ground ID is required'),
  body('eventType').isIn(['birthday', 'corporate', 'tournament', 'other']).withMessage('Valid event type is required'),
  body('eventName').trim().isLength({ min: 2 }).withMessage('Event name is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required'),
  body('duration').isNumeric().withMessage('Duration is required'),
  body('guestCount').isNumeric().withMessage('Guest count is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      groundId,
      eventType,
      eventName,
      date,
      startTime,
      endTime,
      duration,
      guestCount,
      specialRequirements,
      catering = false,
      decorations = false,
      notes
    } = req.body;

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

    const existingEvents = await Event.find({
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

    if (existingBookings.length > 0 || existingEvents.length > 0) {
      return res.status(400).json({ message: 'Time slot is not available' });
    }

    // Calculate pricing
    const totalAmount = calculateEventPricing(date, duration, guestCount, catering, decorations);
    const creditPointsEarned = Math.floor(totalAmount / 10);

    // Create event
    const event = new Event({
      user: req.user._id,
      ground: groundId,
      eventType,
      eventName,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      guestCount,
      totalAmount,
      creditPointsEarned,
      specialRequirements,
      catering,
      decorations,
      notes
    });

    await event.save();

    // Update user's credit points
    const user = await User.findById(req.user._id);
    await User.findByIdAndUpdate(req.user._id, {
      creditPoints: user.creditPoints + creditPointsEarned
    });

    // Populate event details
    await event.populate('ground', 'name type location');
    await event.populate('user', 'name email phone');

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's events
router.get('/my-events', auth, async (req, res) => {
  try {
    const events = await Event.find({ user: req.user._id })
      .populate('ground', 'name type location')
      .sort({ date: -1, startTime: -1 });

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('ground', 'name type location')
      .populate('user', 'name email phone');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user owns this event or is a merchant
    if (event.user._id.toString() !== req.user._id.toString() && req.user.role !== 'merchant') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel event
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user owns this event
    if (event.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if event can be cancelled (not completed)
    if (event.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed event' });
    }

    event.status = 'cancelled';
    await event.save();

    res.json({ message: 'Event cancelled successfully', event });
  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event pricing estimate
router.post('/estimate', auth, [
  body('groundId').isMongoId().withMessage('Valid ground ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('duration').isNumeric().withMessage('Duration is required'),
  body('guestCount').isNumeric().withMessage('Guest count is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groundId, date, duration, guestCount, catering = false, decorations = false } = req.body;

    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    const totalAmount = calculateEventPricing(date, duration, guestCount, catering, decorations);
    const creditPointsEarned = Math.floor(totalAmount / 10);

    res.json({
      totalAmount,
      creditPointsEarned,
      pricing: {
        baseRate: new Date(date).getDay() === 0 || new Date(date).getDay() === 5 || new Date(date).getDay() === 6 ? 1200 : 1000,
        catering: catering ? guestCount * 200 : 0,
        decorations: decorations ? 1000 : 0
      }
    });
  } catch (error) {
    console.error('Get event estimate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
