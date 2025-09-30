const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Middleware to block admin access from mobile apps
const blockMobileAdminAccess = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const isMobileApp = userAgent.includes('Mobile') ||
                     userAgent.includes('Android') ||
                     userAgent.includes('iOS') ||
                     req.get('X-Mobile-App') === 'true';

  if (isMobileApp) {
    return res.status(403).json({
      success: false,
      message: 'Admin access is not available on mobile applications'
    });
  }

  next();
};

// Get all users and merchants
router.get('/users', blockMobileAdminAccess, adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['user', 'merchant'] } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status (active/inactive)
router.patch('/users/:id/status', blockMobileAdminAccess, adminAuth, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User status updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', blockMobileAdminAccess, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get site settings
router.get('/settings', blockMobileAdminAccess, adminAuth, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update site settings
router.put('/settings', blockMobileAdminAccess, adminAuth, [
  body('siteTitle').optional().trim().isLength({ min: 1 }).withMessage('Site title cannot be empty'),
  body('siteDescription').optional().trim().isLength({ min: 1 }).withMessage('Site description cannot be empty'),
  body('contactInfo.happyCustomers').optional().trim(),
  body('contactInfo.sportsGrounds').optional().trim(),
  body('contactInfo.successfulBookings').optional().trim(),
  body('contactInfo.customerSupport').optional().trim(),
  body('rates.weeklyRate').optional().isNumeric().withMessage('Weekly rate must be a number'),
  body('rates.weekendRate').optional().isNumeric().withMessage('Weekend rate must be a number'),
  body('rates.continuousBooking').optional().isNumeric().withMessage('Continuous booking rate must be a number'),
  body('rates.membership').optional().isNumeric().withMessage('Membership rate must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const settings = await Settings.getSettings();

    // Update only provided fields
    const updateData = {};
    if (req.body.siteTitle !== undefined) updateData.siteTitle = req.body.siteTitle;
    if (req.body.siteDescription !== undefined) updateData.siteDescription = req.body.siteDescription;

    if (req.body.contactInfo) {
      updateData.contactInfo = { ...settings.contactInfo, ...req.body.contactInfo };
    }

    if (req.body.rates) {
      updateData.rates = { ...settings.rates, ...req.body.rates };
    }

    const updatedSettings = await Settings.findByIdAndUpdate(
      settings._id,
      updateData,
      { new: true }
    );

    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard statistics
router.get('/dashboard', blockMobileAdminAccess, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalMerchants = await User.countDocuments({ role: 'merchant' });
    const activeUsers = await User.countDocuments({ role: 'user', isActive: { $ne: false } });
    const activeMerchants = await User.countDocuments({ role: 'merchant', isActive: { $ne: false } });

    res.json({
      stats: {
        totalUsers,
        totalMerchants,
        activeUsers,
        activeMerchants
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public endpoint to get pricing settings (no auth required)
router.get('/public/settings', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    // Only return pricing and basic site info, not sensitive data
    res.json({
      siteTitle: settings.siteTitle,
      siteDescription: settings.siteDescription,
      contactInfo: settings.contactInfo,
      rates: settings.rates
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
