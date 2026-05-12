const express = require('express');
const router = express.Router();
const venueController  = require('../controllers/venueController');
const reviewController = require('../controllers/reviewController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { cacheMiddleware, clearCache } = require('../services/redisClient');

// Middleware to clear cache after successful mutations
const clearVenueCache = async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      await clearCache('venues');
    }
  });
  next();
};

// ── Analytics (Must be above /:id to avoid collision) ────────────────────────
router.get('/owner/analytics', verifyToken, authorizeRoles('owner', 'admin'), venueController.getOwnerAnalytics);

// ── Venue CRUD ────────────────────────────────────────────────────────────────
router.get('/',    cacheMiddleware('venues', 300), venueController.getAllVenues);
router.get('/:id', cacheMiddleware('venues', 60), venueController.getVenueById);

router.post('/',   verifyToken, authorizeRoles('owner', 'admin'), clearVenueCache, venueController.createVenue);
router.put('/:id', verifyToken, clearVenueCache, venueController.updateVenue); 
router.delete('/:id', verifyToken, clearVenueCache, venueController.deleteVenue);
router.post('/:id/view', clearVenueCache, venueController.incrementViews);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.get('/:id/reviews',   reviewController.getVenueReviews);                     // public
router.post('/:id/reviews',  verifyToken, reviewController.createReview);            // logged-in users
router.put('/:id/reviews/:reviewId',    verifyToken, reviewController.updateReview);
router.delete('/:id/reviews/:reviewId', verifyToken, reviewController.deleteReview);

module.exports = router;

