const express = require('express');
const router = express.Router();
const savedController = require('../controllers/savedController');

// Get saved tours for a user
router.get('/:userId', savedController.getSavedTours);

// Save a tour
router.post('/', savedController.saveTour);

// Remove saved tour
router.delete('/:userId/:tourId', savedController.removeSavedTour);

module.exports = router;