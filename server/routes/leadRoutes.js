/**
 * Lead Routes
 * Defines API endpoints for lead management
 */
const express = require('express');
const leadController = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// GET /api/leads - Get all leads
// POST /api/leads - Create a new lead
router
  .route('/')
  .get(leadController.getAllLeads)
  .post(leadController.createLead);

// GET /api/leads/:id - Get lead by ID
// PATCH /api/leads/:id - Update lead by ID
// DELETE /api/leads/:id - Delete lead by ID
router
  .route('/:id')
  .get(leadController.getLeadById)
  .patch(leadController.updateLead)
  .delete(leadController.deleteLead);

// PATCH /api/leads/:id/status - Update lead status
router
  .route('/:id/status')
  .patch(leadController.updateLeadStatus);

module.exports = router; 