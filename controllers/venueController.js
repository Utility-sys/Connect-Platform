const Venue = require('../models/Venue');
const User = require('../models/User');

exports.getAllVenues = async (req, res) => {
  try {
    const venues = await Venue.findAll({
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['id', 'DESC']],
    });
    res.status(200).json(venues);
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createVenue = async (req, res) => {
  try {
    const venue = await Venue.create(req.body);
    res.status(201).json(venue);
  } catch (error) {
    console.error('Create venue error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    // Ensure only the owner can update
    const venue = await Venue.findOne({ where: { id, ownerId: req.body.ownerId } });
    if (!venue) return res.status(403).json({ message: 'Venue not found or unauthorized' });
    await venue.update(req.body);
    res.status(200).json(venue);
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;
    await Venue.destroy({ where: { id } });
    res.status(200).json({ message: 'Venue deleted' });
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
