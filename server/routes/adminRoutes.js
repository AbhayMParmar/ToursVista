const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin dashboard routes
router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsersForAdmin);
router.delete('/users/:userId', adminController.deleteUser);
router.get('/tours', adminController.getAllToursForAdmin);
router.get('/bookings', adminController.getAllBookingsForAdmin);
router.put('/bookings/:id/status', adminController.updateBookingStatus); // ADDED: Admin can update booking status

// Admin actions
router.post('/reset-data', adminController.resetAllData);
router.delete('/bookings/all', adminController.deleteAllBookings);

module.exports = router;