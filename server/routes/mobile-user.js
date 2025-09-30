const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Ground = require('../models/Ground');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const PS5Booking = require('../models/PS5Booking');
const User = require('../models/User');

const router = express.Router();

// Calculate pricing based on business rules
const calculatePricing = (date, duration, isContinuous, hasMembership) => {
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

  let hourlyRate;

  if (hasMembership) {
    hourlyRate = 800;
  } else if (isContinuous && duration > 1) {
    hourlyRate = 900;
  } else if (isWeekend) {
    hourlyRate = 1000;
  } else {
    hourlyRate = 800;
  }

  return hourlyRate * duration;
};

// Calculate event pricing
const calculateEventPricing = (date, duration, guestCount, catering, decorations) => {
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

  const baseRate = isWeekend ? 1200 : 1000;
  let totalAmount = baseRate * duration;

  if (catering) {
    totalAmount += guestCount * 200;
  }

  if (decorations) {
    totalAmount += 1000;
  }

  return totalAmount;
};

// ==================== GROUNDS ====================

// Get all grounds (Mobile API)
router.get('/grounds', async (req, res) => {
  try {
    const { type, location, page = 1, limit = 10 } = req.query;
    let query = { isActive: true };

    if (type) {
      query.type = type;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const grounds = await Ground.find(query)
      .populate('merchant', 'name email phone')
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
router.get('/grounds/:id', async (req, res) => {
  try {
    const ground = await Ground.findById(req.params.id)
      .populate('merchant', 'name email phone');

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

// Check ground availability (Mobile API)
router.get('/grounds/:id/availability', async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, start time, and end time are required'
      });
    }

    const ground = await Ground.findById(req.params.id);
    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    const existingBookings = await Booking.find({
      ground: req.params.id,
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
      ground: req.params.id,
      date: new Date(date),
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    const isAvailable = existingBookings.length === 0 && existingEvents.length === 0;

    res.json({
      success: true,
      message: 'Availability checked successfully',
      data: {
        isAvailable,
        conflictingBookings: existingBookings.length,
        conflictingEvents: existingEvents.length
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking availability'
    });
  }
});

// Get available time slots (Mobile API)
router.get('/grounds/:id/slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const ground = await Ground.findById(req.params.id);

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    const existingBookings = await Booking.find({
      ground: req.params.id,
      date: new Date(date),
      status: { $in: ['confirmed', 'pending'] }
    });

    const existingEvents = await Event.find({
      ground: req.params.id,
      date: new Date(date),
      status: { $in: ['confirmed', 'pending'] }
    });

    const availableSlots = [];
    const startHour = 6;
    const endHour = 22;

    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = `${hour.toString().padStart(2, '0')}:00`;
      const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;

      const isBooked = [...existingBookings, ...existingEvents].some(booking => {
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

    res.json({
      success: true,
      message: 'Available slots retrieved successfully',
      data: { availableSlots }
    });
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching time slots'
    });
  }
});

// ==================== BOOKINGS ====================

// Create new booking (Mobile API)
router.post('/bookings', auth, [
  body('groundId').isMongoId().withMessage('Valid ground ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required'),
  body('duration').isNumeric().withMessage('Duration is required')
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

    const { groundId, date, startTime, endTime, duration, creditPointsUsed = 0 } = req.body;

    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
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
      return res.status(400).json({
        success: false,
        message: 'Time slot is not available'
      });
    }

    const user = await User.findById(req.user._id);
    const hasMembership = user.membership !== 'none' &&
                         user.membershipExpiry &&
                         new Date(user.membershipExpiry) > new Date();

    const isContinuous = duration > 1;
    const totalAmount = calculatePricing(date, duration, isContinuous, hasMembership);
    const creditPointsEarned = Math.floor(totalAmount / 10);

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

    const newCreditPoints = user.creditPoints + creditPointsEarned - creditPointsUsed;
    await User.findByIdAndUpdate(req.user._id, { creditPoints: newCreditPoints });

    await booking.populate('ground', 'name type location');
    await booking.populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating booking'
    });
  }
});

// Get user's bookings (Mobile API)
router.get('/bookings/my-bookings', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    let query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const bookings = await Booking.find(query)
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
router.get('/bookings/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('ground', 'name type location')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user._id.toString() !== req.user._id.toString()) {
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

// Cancel booking (Mobile API)
router.put('/bookings/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    if (booking.creditPointsUsed > 0) {
      const user = await User.findById(req.user._id);
      await User.findByIdAndUpdate(req.user._id, {
        creditPoints: user.creditPoints + booking.creditPointsUsed
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking'
    });
  }
});

// Get booking pricing estimate (Mobile API)
router.post('/bookings/estimate', auth, [
  body('groundId').isMongoId().withMessage('Valid ground ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('duration').isNumeric().withMessage('Duration is required')
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

    const { groundId, date, duration } = req.body;

    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    const user = await User.findById(req.user._id);
    const hasMembership = user.membership !== 'none' &&
                         user.membershipExpiry &&
                         new Date(user.membershipExpiry) > new Date();

    const isContinuous = duration > 1;
    const totalAmount = calculatePricing(date, duration, isContinuous, hasMembership);
    const creditPointsEarned = Math.floor(totalAmount / 10);

    res.json({
      success: true,
      message: 'Pricing estimate retrieved successfully',
      data: {
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
      }
    });
  } catch (error) {
    console.error('Get estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating estimate'
    });
  }
});

// ==================== EVENTS ====================

// Create new event (Mobile API)
router.post('/events', auth, [
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
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
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

    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
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
      return res.status(400).json({
        success: false,
        message: 'Time slot is not available'
      });
    }

    const totalAmount = calculateEventPricing(date, duration, guestCount, catering, decorations);
    const creditPointsEarned = Math.floor(totalAmount / 10);

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

    const user = await User.findById(req.user._id);
    await User.findByIdAndUpdate(req.user._id, {
      creditPoints: user.creditPoints + creditPointsEarned
    });

    await event.populate('ground', 'name type location');
    await event.populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating event'
    });
  }
});

// Get user's events (Mobile API)
router.get('/events/my-events', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    let query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const events = await Event.find(query)
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
router.get('/events/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('ground', 'name type location')
      .populate('user', 'name email phone');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.user._id.toString() !== req.user._id.toString()) {
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

// Cancel event (Mobile API)
router.put('/events/:id/cancel', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (event.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed event'
      });
    }

    event.status = 'cancelled';
    await event.save();

    res.json({
      success: true,
      message: 'Event cancelled successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling event'
    });
  }
});

// Get event pricing estimate (Mobile API)
router.post('/events/estimate', auth, [
  body('groundId').isMongoId().withMessage('Valid ground ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('duration').isNumeric().withMessage('Duration is required'),
  body('guestCount').isNumeric().withMessage('Guest count is required')
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

    const { groundId, date, duration, guestCount, catering = false, decorations = false } = req.body;

    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    const totalAmount = calculateEventPricing(date, duration, guestCount, catering, decorations);
    const creditPointsEarned = Math.floor(totalAmount / 10);

    res.json({
      success: true,
      message: 'Event pricing estimate retrieved successfully',
      data: {
        totalAmount,
        creditPointsEarned,
        pricing: {
          baseRate: new Date(date).getDay() === 0 || new Date(date).getDay() === 5 || new Date(date).getDay() === 6 ? 1200 : 1000,
          catering: catering ? guestCount * 200 : 0,
          decorations: decorations ? 1000 : 0
        }
      }
    });
  } catch (error) {
    console.error('Get event estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating event estimate'
    });
  }
});

// ==================== PS5 BOOKINGS ====================

// Create new PS5 booking (Mobile API)
router.post('/ps5/bookings', auth, [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required'),
  body('duration').isNumeric().withMessage('Duration is required'),
  body('playerType').isIn(['single', 'double']).withMessage('Valid player type is required')
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

    const { date, startTime, endTime, duration, playerType, creditPointsUsed = 0 } = req.body;

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
      return res.status(400).json({
        success: false,
        message: 'PS5 is not available at this time'
      });
    }

    const PS5_PRICING = { single: 100, double: 150 };
    const hourlyRate = PS5_PRICING[playerType];
    const totalAmount = hourlyRate * duration;
    const creditPointsEarned = Math.floor(totalAmount / 10);

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

    const user = await User.findById(req.user._id);
    const newCreditPoints = user.creditPoints + creditPointsEarned - creditPointsUsed;
    await User.findByIdAndUpdate(req.user._id, { creditPoints: newCreditPoints });

    await ps5Booking.populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'PS5 booking created successfully',
      data: { ps5Booking }
    });
  } catch (error) {
    console.error('Create PS5 booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating PS5 booking'
    });
  }
});

// Get user's PS5 bookings (Mobile API)
router.get('/ps5/my-bookings', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    let query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const ps5Bookings = await PS5Booking.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1, startTime: -1 });

    const total = await PS5Booking.countDocuments(query);

    res.json({
      success: true,
      message: 'PS5 bookings retrieved successfully',
      data: {
        ps5Bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBookings: total,
          hasNext: skip + ps5Bookings.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get PS5 bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching PS5 bookings'
    });
  }
});

// Get PS5 availability (Mobile API)
router.get('/ps5/availability/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const existingBookings = await PS5Booking.find({
      date: new Date(date),
      status: { $in: ['confirmed', 'pending'] }
    });

    const availableSlots = [];
    const startHour = 10;
    const endHour = 22;

    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = `${hour.toString().padStart(2, '0')}:00`;
      const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;

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

    res.json({
      success: true,
      message: 'PS5 availability retrieved successfully',
      data: { availableSlots }
    });
  } catch (error) {
    console.error('Get PS5 availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching PS5 availability'
    });
  }
});

// Get PS5 pricing estimate (Mobile API)
router.post('/ps5/estimate', auth, [
  body('duration').isNumeric().withMessage('Duration is required'),
  body('playerType').isIn(['single', 'double']).withMessage('Valid player type is required')
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

    const { duration, playerType } = req.body;

    const PS5_PRICING = { single: 100, double: 150 };
    const hourlyRate = PS5_PRICING[playerType];
    const totalAmount = hourlyRate * duration;
    const creditPointsEarned = Math.floor(totalAmount / 10);

    res.json({
      success: true,
      message: 'PS5 pricing estimate retrieved successfully',
      data: {
        totalAmount,
        creditPointsEarned,
        hourlyRate,
        pricing: PS5_PRICING
      }
    });
  } catch (error) {
    console.error('Get PS5 estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating PS5 estimate'
    });
  }
});

// ==================== USER DASHBOARD ====================

// Get user dashboard (Mobile API)
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const totalBookings = await Booking.countDocuments({ user: req.user._id });
    const confirmedBookings = await Booking.countDocuments({ user: req.user._id, status: 'confirmed' });
    const totalEvents = await Event.countDocuments({ user: req.user._id });
    const confirmedEvents = await Event.countDocuments({ user: req.user._id, status: 'confirmed' });
    const totalPS5Bookings = await PS5Booking.countDocuments({ user: req.user._id });

    // Get recent bookings
    const recentBookings = await Booking.find({ user: req.user._id })
      .populate('ground', 'name type location')
      .sort({ date: -1, startTime: -1 })
      .limit(5);

    // Get recent events
    const recentEvents = await Event.find({ user: req.user._id })
      .populate('ground', 'name type location')
      .sort({ date: -1, startTime: -1 })
      .limit(5);

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          creditPoints: user.creditPoints,
          membership: user.membership,
          membershipExpiry: user.membershipExpiry
        },
        stats: {
          totalBookings,
          confirmedBookings,
          totalEvents,
          confirmedEvents,
          totalPS5Bookings
        },
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

module.exports = router;
