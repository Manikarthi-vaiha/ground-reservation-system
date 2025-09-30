const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/grounds', require('./routes/grounds'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/events', require('./routes/events'));
app.use('/api/ps5', require('./routes/ps5'));
app.use('/api/admin', require('./routes/admin'));

// Mobile API Routes (REST APIs for mobile app)
app.use('/api/mobile', require('./routes/mobile'));
app.use('/api/mobile/user', require('./routes/mobile-user'));
app.use('/api/mobile/merchant', require('./routes/mobile-merchant'));

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
