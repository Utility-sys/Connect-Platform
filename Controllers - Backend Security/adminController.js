const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const { Sequelize } = require('sequelize');

/**
 * Get system-wide basic statistics.
 */
exports.getStats = async (req, res) => {
  try {
    const userCount = await User.count();
    const venueCount = await Venue.count();
    const bookingCount = await Booking.count();
    
    // Calculate total revenue (confirmed bookings)
    const totalRevenue = await Booking.sum('totalAmount', { where: { status: 'Confirmed' } });

    res.status(200).json({
      users: userCount,
      venues: venueCount,
      bookings: bookingCount,
      revenue: totalRevenue || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * List all users in the system.
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['id', 'DESC']]
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * List all venues with owner details for moderation.
 */
exports.getAllVenuesForAdmin = async (req, res) => {
  try {
    const venues = await Venue.findAll({
      include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }],
      order: [['id', 'DESC']]
    });
    res.status(200).json(venues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Approve or Reject a venue.
 */
exports.moderateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const venue = await Venue.findByPk(id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });

    await venue.update({ status });
    res.status(200).json(venue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin self-service: update their own email and/or password.
 * Requires current password for verification.
 */
const bcrypt = require('bcryptjs');
exports.updateAdminCredentials = async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;

    const admin = await User.findByPk(req.user.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Always verify current password first
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    if (newEmail && newEmail !== admin.email) {
      const taken = await User.findOne({ where: { email: newEmail } });
      if (taken) return res.status(400).json({ message: 'That email is already in use.' });
      admin.email = newEmail;
    }

    if (newPassword) {
      // The beforeSave hook will hash this automatically
      admin.password = newPassword;
    }

    await admin.save();

    const response = admin.toJSON();
    delete response.password;
    res.status(200).json({ message: 'Credentials updated successfully.', user: response });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
