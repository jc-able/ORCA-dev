/**
 * Interaction Routes
 * API endpoints for managing interactions
 */
const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/interactions
 * @desc    Get all interactions with filtering and pagination
 * @access  Private
 */
router.get('/', interactionController.getAllInteractions);

/**
 * @route   GET /api/interactions/:id
 * @desc    Get a single interaction by ID
 * @access  Private
 */
router.get('/:id', interactionController.getInteractionById);

/**
 * @route   GET /api/interactions/person/:personId
 * @desc    Get all interactions for a specific person
 * @access  Private
 */
router.get('/person/:personId', interactionController.getInteractionsByPerson);

/**
 * @route   GET /api/interactions/person/:personId/counts
 * @desc    Get interaction counts by type for a person
 * @access  Private
 */
router.get('/person/:personId/counts', interactionController.getInteractionCountsByType);

/**
 * @route   GET /api/interactions/recent
 * @desc    Get recent interactions for the current user
 * @access  Private
 */
router.get('/recent', interactionController.getRecentInteractions);

/**
 * @route   POST /api/interactions
 * @desc    Create a new interaction
 * @access  Private
 */
router.post('/', interactionController.createInteraction);

/**
 * @route   PUT /api/interactions/:id
 * @desc    Update an existing interaction
 * @access  Private
 */
router.put('/:id', interactionController.updateInteraction);

/**
 * @route   DELETE /api/interactions/:id
 * @desc    Delete an interaction
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware.adminOnly, interactionController.deleteInteraction);

module.exports = router; 