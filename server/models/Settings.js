const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  siteTitle: {
    type: String,
    default: 'Ground Booking'
  },
  siteDescription: {
    type: String,
    default: 'Your premier destination for cricket and football ground bookings. Book your favorite sports ground with ease and enjoy the best facilities.'
  },
  contactInfo: {
    happyCustomers: {
      type: String,
      default: 'happy customer'
    },
    sportsGrounds: {
      type: String,
      default: 'sports ground'
    },
    successfulBookings: {
      type: String,
      default: 'Successful Bookings'
    },
    customerSupport: {
      type: String,
      default: 'Customer Support'
    }
  },
  rates: {
    weeklyRate: {
      type: Number,
      default: 0
    },
    weekendRate: {
      type: Number,
      default: 0
    },
    continuousBooking: {
      type: Number,
      default: 0
    },
    membership: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
