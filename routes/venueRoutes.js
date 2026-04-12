const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');

router.get('/', venueController.getAllVenues);
router.post('/', venueController.createVenue);
router.put('/:id', venueController.updateVenue);
router.delete('/:id', venueController.deleteVenue);
router.post('/:id/view', venueController.incrementViews);

module.exports = router;
