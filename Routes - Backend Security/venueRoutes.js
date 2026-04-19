const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', venueController.getAllVenues);
router.post('/', verifyToken, authorizeRoles('owner', 'admin'), venueController.createVenue);
router.put('/:id', verifyToken, authorizeRoles('owner', 'admin'), venueController.updateVenue);
router.delete('/:id', verifyToken, authorizeRoles('owner', 'admin'), venueController.deleteVenue);
router.post('/:id/view', venueController.incrementViews);

module.exports = router;
