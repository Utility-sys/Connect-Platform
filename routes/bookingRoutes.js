const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Public Webhook Route for PayHere (NFR-SEC-05)
router.post('/webhook/payhere', bookingController.payHereWebhook);

// All other booking routes require authentication
router.use(verifyToken);

router.get('/', authorizeRoles('admin'), bookingController.getAllBookings);
router.get('/user/:userId', bookingController.getUserBookings);
router.get('/owner/:ownerId', authorizeRoles('owner', 'admin'), bookingController.getOwnerBookings);
router.post('/', bookingController.createBooking);
router.put('/:id/cancel', bookingController.cancelBooking);
router.put('/:id', bookingController.updateBooking);

module.exports = router;
