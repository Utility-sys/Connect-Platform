const Venue = require('../models/Venue');
const User = require('../models/User');
const NodeCache = require('node-cache');
const venueCache = new NodeCache({ stdTTL: 300 }); // 5 minute TTL
exports.venueCache = venueCache;

exports.getAllVenues = async (req, res) => {
  try {
    const cachedData = venueCache.get('all_venues');
    if (cachedData) {
      console.log('⚡ Serving venues from Cache');
      return res.status(200).json(cachedData);
    }

    const venues = await Venue.findAll({
      attributes: { exclude: ['verificationDoc', 'verificationAnalysis'] },
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['id', 'DESC']],
    });
    
    // Fix: Convert Sequelize instances to plain JSON objects before caching
    // to prevent node-cache from cloning complex objects with TCP sockets
    const venuesJSON = venues.map(v => v.toJSON());
    
    venueCache.set('all_venues', venuesJSON);
    console.log('💾 Venues cached to memory');
    res.status(200).json(venuesJSON);
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getVenueById = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await Venue.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.status(200).json(venue);
  } catch (error) {
    console.error('Get venue by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};


const verificationService = require('../services/verificationService');

exports.createVenue = async (req, res) => {
  try {
    const data = { ...req.body };
    
    // ── Automated Verification Integration ──────────────────────────────────────
    if (data.verificationDoc) {
      const result = await verificationService.verifyDocument(data.verificationDoc, data.docType || 'NIC');
      data.confidenceScore = result.confidence;
      data.verificationAnalysis = result.analysis;
      
      // All new venues start as Pending regardless of confidence score.
      data.status = 'Pending';
    }

    const venue = await Venue.create(data);
    venueCache.del('all_venues'); // Invalidate cache
    res.status(201).json(venue);
  } catch (error) {
    console.error('Create venue error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    // Robust ownership check: Allow the designated owner OR an admin to update
    const venue = await Venue.findByPk(id);
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    const ownerIdStr = String(venue.ownerId || '').trim();
    const userIdStr  = String(req.user?.id || '').trim();

    const isOwner = ownerIdStr === userIdStr;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      console.warn(`🔒 Access Denied: User [${userIdStr}] (${req.user?.role}) attempted to edit Venue ${id} owned by [${ownerIdStr}]`);
      return res.status(403).json({ message: 'Access denied: You do not have permission to edit this venue' });
    }
    // Extract standard fields
    const updates = { ...req.body };
    
    // Ensure amenities is parsed if sent as a string (rare but possible with form-data)
    if (typeof updates.amenities === 'string') {
      try { updates.amenities = JSON.parse(updates.amenities); } catch { updates.amenities = updates.amenities.split(',').map(s=>s.trim()); }
    }

    await venue.update(updates);
    venueCache.del('all_venues'); // Invalidate cache
    res.status(200).json(venue);
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await Venue.findByPk(id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });

    const isOwner = String(venue.ownerId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to delete this venue' });
    }

    await venue.destroy();
    venueCache.del('all_venues'); // Invalidate cache
    res.status(200).json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await Venue.findByPk(id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    await venue.increment('views', { by: 1 });
    res.status(200).json({ views: venue.views + 1 });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Owner Analytics — real-time data scoped to the requesting venue owner.
 */
exports.getOwnerAnalytics = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const { Sequelize, Op } = require('sequelize');
    const ownerId = req.user.id;

    // Fetch this owner's venues
    const venues = await Venue.findAll({ where: { ownerId }, raw: true });
    const venueIds = venues.map(v => v.id);

    // Fetch all bookings for this owner's venues (more robust than filtering by ownerId directly)
    const bookings = venueIds.length > 0
      ? await Booking.findAll({ where: { venueId: { [Op.in]: venueIds } }, raw: true })
      : [];

    // ── 1. Booking Status Breakdown (Pie) ─────────────────────────────────────
    const statusCounts = { Confirmed: 0, Cancelled: 0, Edited: 0 };
    bookings.forEach(b => { if (statusCounts[b.status] !== undefined) statusCounts[b.status]++; });
    const bookingStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // ── 2. Venue Status Distribution (Pie) ────────────────────────────────────
    const venueCounts = { Approved: 0, Pending: 0, Rejected: 0 };
    venues.forEach(v => { if (venueCounts[v.status] !== undefined) venueCounts[v.status]++; });
    const venueStatusData = Object.entries(venueCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

    // ── 3. Monthly Revenue & Bookings (Bar — last 6 months) ───────────────────
    const now = new Date();
    const monthMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthMap[key] = { month: key, bookings: 0, revenue: 0 };
    }
    bookings.forEach(b => {
      const key = new Date(b.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthMap[key]) {
        monthMap[key].bookings++;
        if (b.status === 'Confirmed') monthMap[key].revenue += (b.totalAmount || 0);
      }
    });
    const monthlyData = Object.values(monthMap);

    // ── 4. Revenue per Venue (Bar) ────────────────────────────────────────────
    const revenueByVenue = {};
    venues.forEach(v => { revenueByVenue[v.id] = { name: v.name?.length > 14 ? v.name.substring(0, 14) + '…' : v.name, revenue: 0, bookings: 0 }; });
    bookings.forEach(b => {
      if (revenueByVenue[b.venueId] && b.status === 'Confirmed') {
        revenueByVenue[b.venueId].revenue += (b.totalAmount || 0);
        revenueByVenue[b.venueId].bookings++;
      }
    });
    const revenueByVenueData = Object.values(revenueByVenue);

    // ── 5. Summary totals ─────────────────────────────────────────────────────
    const totalRevenue = bookings.filter(b => b.status === 'Confirmed').reduce((s, b) => s + (b.totalAmount || 0), 0);
    const totalViews = venues.reduce((s, v) => s + (v.views || 0), 0);

    res.status(200).json({
      bookingStatusData,
      venueStatusData,
      monthlyData,
      revenueByVenueData,
      totalRevenue,
      totalViews,
      totalVenues: venues.length,
      totalBookings: bookings.length
    });
  } catch (error) {
    console.error('Owner analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};
