/**
 * Relationship Routes
 * 
 * API routes for handling relationship operations
 * These manage connections between persons, such as referrals
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const relationshipController = require('../controllers/relationshipController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create a new relationship
router.post('/', relationshipController.createRelationship);

// Get a relationship by ID
router.get('/:id', relationshipController.getRelationshipById);

// Update a relationship
router.put('/:id', relationshipController.updateRelationship);

// Delete a relationship
router.delete('/:id', relationshipController.deleteRelationship);

// List relationships with filtering
router.get('/', relationshipController.listRelationships);

// Create a referral relationship (specialized relationship)
router.post('/referral', relationshipController.createReferralRelationship);

// Get referral relationships
router.get('/referrals', relationshipController.getReferralRelationships);

// Get network visualization data
router.get('/network/:personId', relationshipController.getNetworkVisualization);

// Get relationships for a person
router.get('/person/:personId', relationshipController.getRelationshipsForPerson);

module.exports = router; 