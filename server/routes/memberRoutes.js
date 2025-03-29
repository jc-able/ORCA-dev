/**
 * Member Routes
 * 
 * API routes for handling member-specific operations
 * These extend the core person routes with member-specific functionality
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const memberController = require('../controllers/memberController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create a new member (converts existing person to member)
router.post('/convert/:personId', memberController.convertToMember);

// Get member extension by person ID
router.get('/extension/:personId', memberController.getMemberExtension);

// Update member extension
router.put('/extension/:id', memberController.updateMemberExtension);

// List members with filtering and pagination
router.get('/', memberController.listMembers);

// Get full member profile with all related data
router.get('/:id/profile', memberController.getMemberProfile);

// Record member check-in
router.post('/:id/check-in', memberController.recordCheckIn);

// Get member network visualization data
router.get('/:id/network', memberController.getMemberNetwork);

// Get member referrals made
router.get('/:id/referrals', memberController.getMemberReferrals);

// Get member's financial summary
router.get('/:id/financials', memberController.getMemberFinancials);

// Get member activity and engagement metrics
router.get('/:id/engagement', memberController.getMemberEngagement);

module.exports = router; 