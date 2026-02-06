const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Request logging middleware
router.use((req, res, next) => {
  console.log(`📊 Booking Route: ${req.method} ${req.path}`);
  next();
});

// Public routes
router.post('/', bookingController.createBooking);

// Protected routes
router.get('/user/:userId', bookingController.getUserBookings);
router.put('/:id', bookingController.updateBookingStatus);
router.delete('/:id', bookingController.deleteBooking);

// Admin routes
router.get('/', bookingController.getAllBookings);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Booking API is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
