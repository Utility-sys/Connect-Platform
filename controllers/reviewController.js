const Review = require('../models/Review');
const Venue  = require('../models/Venue');
const User   = require('../models/User');

// GET /api/venues/:id/reviews
exports.getVenueReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { venueId: req.params.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/venues/:id/reviews
exports.createReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    const userId = req.user.id;
    const venueId = req.params.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Prevent duplicate reviews from same user on same venue
    const existing = await Review.findOne({ where: { venueId, userId } });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this venue. You can only submit one review per venue.' });
    }

    // Get reviewer name
    const user = await User.findByPk(userId);
    const reviewerName = user ? `${user.firstName} ${user.lastName}` : 'Anonymous';

    const review = await Review.create({
      venueId,
      userId,
      reviewerName,
      rating: parseInt(rating),
      title: title || '',
      comment: comment || '',
    });

    // Recalculate venue average rating
    const allReviews = await Review.findAll({ where: { venueId } });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const finalRating = Math.round(avgRating * 10) / 10;

    await Venue.update(
      { rating: finalRating },
      { where: { id: venueId } }
    );

    res.status(201).json({ 
      review, 
      newRating: finalRating, 
      reviewCount: allReviews.length 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/venues/:id/reviews/:reviewId  (edit own review)
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      where: { id: req.params.reviewId, venueId: req.params.id, userId: req.user.id }
    });
    if (!review) return res.status(404).json({ message: 'Review not found or not yours' });

    const { rating, title, comment } = req.body;
    if (rating) review.rating = parseInt(rating);
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    await review.save();

    // Recalculate average
    const allReviews = await Review.findAll({ where: { venueId: req.params.id } });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const finalRating = Math.round(avgRating * 10) / 10;
    
    await Venue.update({ rating: finalRating }, { where: { id: req.params.id } });

    res.json({ review, newRating: finalRating, reviewCount: allReviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/venues/:id/reviews/:reviewId
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      where: { id: req.params.reviewId, venueId: req.params.id, userId: req.user.id }
    });
    if (!review) return res.status(404).json({ message: 'Review not found or not yours' });
    await review.destroy();

    // Recalculate average
    const allReviews = await Review.findAll({ where: { venueId: req.params.id } });
    let finalRating = 0;
    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      finalRating = Math.round(avgRating * 10) / 10;
      await Venue.update({ rating: finalRating }, { where: { id: req.params.id } });
    } else {
      await Venue.update({ rating: 0 }, { where: { id: req.params.id } });
    }

    res.json({ message: 'Review deleted', newRating: finalRating, reviewCount: allReviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
