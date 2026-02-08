const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTourById);
router.get('/category/:category', tourController.getToursByCategory);
router.post('/:tourId/rate', tourController.rateTour);
router.get('/:tourId/ratings', tourController.getTourRatings);
router.get('/:tourId/rating/:userId', tourController.getUserRating);

// Protected routes (admin only)
router.post('/', protect, admin, tourController.createTour);
router.put('/:id', protect, admin, tourController.updateTour);
router.delete('/:id', protect, admin, tourController.deleteTour);

module.exports = router;