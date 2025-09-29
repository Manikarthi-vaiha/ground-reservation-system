const mongoose = require('mongoose');

const groundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['cricket', 'football'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  images: [String],
  facilities: [String],
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pricing: {
    weekday: {
      type: Number,
      default: 800
    },
    weekend: {
      type: Number,
      default: 1000
    },
    continuous: {
      type: Number,
      default: 900
    },
    membership: {
      type: Number,
      default: 800
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ground', groundSchema);
