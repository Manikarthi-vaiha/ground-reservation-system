const mongoose = require('mongoose');

const ps5BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true // in hours
  },
  playerType: {
    type: String,
    enum: ['single', 'double'],
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  creditPointsEarned: {
    type: Number,
    default: 0
  },
  creditPointsUsed: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PS5Booking', ps5BookingSchema);
