/**
 * Auth Routes
 * Define authentication-related API endpoints
 */
const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);

// Protected routes (authentication required)
router.use(protect); // Apply authentication middleware
router.get('/me', authController.getCurrentUser);
router.patch('/profile', authController.updateProfile);
router.post('/logout', authController.logout);
router.patch('/update-password', authController.updatePassword);

module.exports = router; 