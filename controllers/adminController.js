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
    const venueCount = await Venue.count({
      where: { status: { [Sequelize.Op.ne]: 'Rejected' } }
    });
    const bookingCount = await Booking.count();
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
 * System Analytics — real-time data for admin dashboard charts.
 */
exports.getAnalytics = async (req, res) => {
  try {
    // ── 1. Venue Status Distribution (Pie Chart) ──────────────────────────────
    const venueStatuses = await Venue.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true
    });
    const venueStatusData = venueStatuses.map(v => ({ name: v.status, value: parseInt(v.count) }));

    // ── 2. User Role Breakdown (Pie Chart) ────────────────────────────────────
    const userRoles = await User.findAll({
      attributes: ['role', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['role'],
      raw: true
    });
    const userRoleData = userRoles.map(u => ({
      name: u.role === 'owner' ? 'Venue Owners' : u.role === 'admin' ? 'Admins' : 'Customers',
      value: parseInt(u.count)
    }));

    // ── 3. Booking Status Breakdown (Pie Chart) ───────────────────────────────
    const bookingStatuses = await Booking.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true
    });
    const bookingStatusData = bookingStatuses.map(b => ({ name: b.status, value: parseInt(b.count) }));

    // ── 4. Monthly Bookings & Revenue (Bar Chart — last 6 months) ─────────────
    const allBookings = await Booking.findAll({
      attributes: ['createdAt', 'totalAmount', 'status'],
      raw: true
    });

    const monthMap = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthMap[key] = { month: key, bookings: 0, revenue: 0 };
    }

    allBookings.forEach(b => {
      const d = new Date(b.createdAt);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthMap[key]) {
        monthMap[key].bookings += 1;
        if (b.status === 'Confirmed') monthMap[key].revenue += (b.totalAmount || 0);
      }
    });
    const monthlyData = Object.values(monthMap);

    // ── 5. Top 5 Venues by Bookings (Bar Chart) ───────────────────────────────
    const venueBookings = await Booking.findAll({
      attributes: ['venueName', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['venueName'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: true
    });
    const topVenuesData = venueBookings.map(v => ({
      name: v.venueName ? (v.venueName.length > 15 ? v.venueName.substring(0, 15) + '…' : v.venueName) : 'Unknown',
      bookings: parseInt(v.count)
    }));

    // ── 6. New User Registrations per month (last 6 months) ───────────────────
    const allUsers = await User.findAll({ attributes: ['createdAt'], raw: true });
    const userMonthMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      userMonthMap[key] = { month: key, users: 0 };
    }
    allUsers.forEach(u => {
      const key = new Date(u.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (userMonthMap[key]) userMonthMap[key].users += 1;
    });
    const userGrowthData = Object.values(userMonthMap);

    res.status(200).json({
      venueStatusData,
      userRoleData,
      bookingStatusData,
      monthlyData,
      topVenuesData,
      userGrowthData
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

    // Invalidate the venue cache so searchers see the "Approved" status instantly
    const { venueCache } = require('./venueController');
    venueCache.del('all_venues');

    // ── Security: Audit Logging ───────────────────────────────────────────────
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      action: `VENUE_MODERATION_${status.toUpperCase()}`,
      userId: req.user ? req.user.id : 'system',
      targetId: id,
      ipAddress: req.ip || req.connection.remoteAddress,
      details: { previousStatus: venue.status, newStatus: status }
    });

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
