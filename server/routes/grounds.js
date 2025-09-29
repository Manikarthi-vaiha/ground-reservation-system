const express = require('express');
const Ground = require('../models/Ground');
const Booking = require('../models/Booking');

const router = express.Router();

// Get all grounds
router.get('/', async (req, res) => {
  try {
    const { type, location } = req.query;
    let query = { isActive: true };

    if (type) {
      query.type = type;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const grounds = await Ground.find(query).populate('merchant', 'name email phone');
    res.json(grounds);
  } catch (error) {
    console.error('Get grounds error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single ground
router.get('/:id', async (req, res) => {
  try {
    const ground = await Ground.findById(req.params.id)
      .populate('merchant', 'name email phone');

    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    res.json(ground);
  } catch (error) {
    console.error('Get ground error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check availability for a specific date and time
router.get('/:id/availability', async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Date, start time, and end time are required' });
    }

    const ground = await Ground.findById(req.params.id);
    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    // Check for existing bookings
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

    const isAvailable = existingBookings.length === 0;

    res.json({
      isAvailable,
      conflictingBookings: existingBookings
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a specific date
router.get('/:id/slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const ground = await Ground.findById(req.params.id);

    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    // Get existing bookings for the date
    const existingBookings = await Booking.find({
      ground: req.params.id,
      date: new Date(date),
      status: { $in: ['confirmed', 'pending'] }
    });

    // Generate available time slots (6 AM to 10 PM, 1-hour slots)
    const availableSlots = [];
    const startHour = 6;
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
    console.error('Get time slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
