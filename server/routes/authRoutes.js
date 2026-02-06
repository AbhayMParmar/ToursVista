const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Request logging for auth routes
router.use((req, res, next) => {
  console.log(`🔐 Auth Route: ${req.method} ${req.path}`);
  next();
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (will add middleware later)
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);

// Admin routes
router.get('/users', authController.getAllUsers);
router.delete('/users/:userId', authController.deleteUser);

// Test route for debugging
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
