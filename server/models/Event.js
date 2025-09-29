const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ground: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ground',
    required: true
  },
  eventType: {
    type: String,
    enum: ['birthday', 'corporate', 'tournament', 'other'],
    required: true
  },
  eventName: {
    type: String,
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
  guestCount: {
    type: Number,
    required: true
  },
  specialRequirements: {
    type: String
  },
  catering: {
    type: Boolean,
    default: false
  },
  decorations: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  creditPointsEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
