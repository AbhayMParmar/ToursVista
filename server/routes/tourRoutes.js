const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');

// Public routes
router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTourById);
router.get('/category/:category', tourController.getToursByCategory);
router.post('/:tourId/rate', tourController.rateTour);
router.get('/:tourId/ratings', tourController.getTourRatings);
router.get('/:tourId/rating/:userId', tourController.getUserRating);

// Protected routes (admin only in production)
router.post('/', tourController.createTour);
router.put('/:id', tourController.updateTour);
router.delete('/:id', tourController.deleteTour);

module.exports = router;