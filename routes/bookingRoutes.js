const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.get('/', bookingController.getAllBookings);
router.get('/user/:userId', bookingController.getUserBookings);
router.get('/owner/:ownerId', bookingController.getOwnerBookings);
router.post('/', bookingController.createBooking);
router.put('/:id/cancel', bookingController.cancelBooking);
router.put('/:id', bookingController.updateBooking);

module.exports = router;
