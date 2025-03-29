/**
 * Referral Routes
 * Handles referral-related API endpoints
 */
const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all referral routes
router.use(authMiddleware.protect);

// GET /api/referrals - Get all referrals with filtering
// POST /api/referrals - Create a new referral
router
  .route('/')
  .get(referralController.getAllReferrals)
  .post(referralController.createReferral);

// GET /api/referrals/:id - Get referral by ID
// PATCH /api/referrals/:id - Update referral by ID
// DELETE /api/referrals/:id - Delete referral by ID
router
  .route('/:id')
  .get(referralController.getReferralById)
  .patch(referralController.updateReferral)
  .delete(referralController.deleteReferral);

// POST /api/referrals/links - Generate a new referral link
router.post('/links', referralController.generateReferralLink);

// GET /api/referrals/links/:id - Get referral link details
router.get('/links/:id', referralController.getReferralLinkById);

// GET /api/referrals/network/:id - Get referral network for a person
router.get('/network/:id', referralController.getReferralNetwork);

// POST /api/referrals/:id/appointment - Schedule an appointment for a referral
router.post('/:id/appointment', referralController.scheduleAppointment);

// GET /api/referrals/:id/appointment - Get appointment details for a referral
router.get('/:id/appointment', referralController.getAppointmentDetails);

// PATCH /api/referrals/:id/appointment - Update appointment details
router.patch('/:id/appointment', referralController.updateAppointment);

// DELETE /api/referrals/:id/appointment - Cancel an appointment
router.delete('/:id/appointment', referralController.cancelAppointment);

// POST /api/referrals/:id/convert - Convert a referral to a member
router.post('/:id/convert', referralController.convertToMember);

// GET /api/referrals/stats - Get referral statistics
router.get('/stats', authMiddleware.restrictTo('admin'), referralController.getReferralStats);

module.exports = router; 