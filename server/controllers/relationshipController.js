/**
 * Relationship Controller
 * 
 * Handles operations for relationships between persons
 * Manages referral connections and other relationship types
 */

const relationshipModel = require('../models/relationshipModel');
const personModel = require('../models/personModel');

/**
 * Create a new relationship
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createRelationship = async (req, res) => {
  try {
    const relationshipData = req.body;
    
    // Validate that both persons exist
    const personA = await personModel.getPersonById(relationshipData.person_a_id);
    const personB = await personModel.getPersonById(relationshipData.person_b_id);
    
    if (!personA || !personB) {
      return res.status(404).json({ 
        success: false, 
        error: !personA ? 'Person A not found' : 'Person B not found' 
      });
    }
    
    const relationship = await relationshipModel.createRelationship(relationshipData);
    res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    console.error('Error creating relationship:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get a relationship by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getRelationshipById = async (req, res) => {
  try {
    const { id } = req.params;
    const relationship = await relationshipModel.getRelationshipById(id);
    
    if (!relationship) {
      return res.status(404).json({ success: false, error: 'Relationship not found' });
    }
    
    res.status(200).json({ success: true, data: relationship });
  } catch (error) {
    console.error('Error getting relationship:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update a relationship
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateRelationship = async (req, res) => {
  try {
    const { id } = req.params;
    const relationshipData = req.body;
    
    const updatedRelationship = await relationshipModel.updateRelationship(id, relationshipData);
    
    if (!updatedRelationship) {
      return res.status(404).json({ success: false, error: 'Relationship not found' });
    }
    
    res.status(200).json({ success: true, data: updatedRelationship });
  } catch (error) {
    console.error('Error updating relationship:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete a relationship
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteRelationship = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await relationshipModel.deleteRelationship(id);
    
    if (!success) {
      return res.status(404).json({ success: false, error: 'Relationship not found' });
    }
    
    res.status(200).json({ success: true, message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * List relationships with filtering
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const listRelationships = async (req, res) => {
  try {
    const { type, person_id, direction } = req.query;
    
    // If person_id is provided, get relationships for that person
    if (person_id) {
      const options = {};
      if (type) options.relationshipType = type;
      if (direction) options.direction = direction;
      
      const relationships = await relationshipModel.getRelationshipsForPerson(person_id, options);
      return res.status(200).json({ success: true, data: relationships });
    }
    
    // Otherwise, this is a general query (can be expanded as needed)
    // For now, we'll return an error as we require a person_id filter
    return res.status(400).json({ 
      success: false, 
      error: 'A person_id is required for listing relationships' 
    });
  } catch (error) {
    console.error('Error listing relationships:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create a referral relationship (specialized relationship)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createReferralRelationship = async (req, res) => {
  try {
    const referralData = req.body;
    
    // Validate that both persons exist
    const referrer = await personModel.getPersonById(referralData.referrer_id);
    const referred = await personModel.getPersonById(referralData.referred_id);
    
    if (!referrer || !referred) {
      return res.status(404).json({ 
        success: false, 
        error: !referrer ? 'Referrer not found' : 'Referred person not found' 
      });
    }
    
    // Create the referral relationship
    const relationship = await relationshipModel.createReferralRelationship(referralData);
    
    // If the referred person isn't already marked as a referral, update them
    if (!referred.is_referral) {
      await personModel.updatePerson(referred.id, { 
        is_referral: true,
        referral_source: referrer.id 
      });
    }
    
    res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    console.error('Error creating referral relationship:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get referral relationships
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getReferralRelationships = async (req, res) => {
  try {
    const { page = 1, limit = 20, referrer_id, referred_id, status, start_date, end_date, channel } = req.query;
    
    // Build filters object
    const filters = {};
    if (referrer_id) filters.referrerId = referrer_id;
    if (referred_id) filters.referredId = referred_id;
    if (status) filters.status = status;
    if (start_date) filters.startDate = start_date;
    if (end_date) filters.endDate = end_date;
    if (channel) filters.channel = channel;
    
    const result = await relationshipModel.getReferralRelationships(filters, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Error getting referral relationships:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get network visualization data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getNetworkVisualization = async (req, res) => {
  try {
    const { personId } = req.params;
    const { levels = 3 } = req.query;
    
    // Check if person exists
    const person = await personModel.getPersonById(personId);
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    // Get network visualization data
    const network = await relationshipModel.getReferralNetwork(personId, parseInt(levels));
    
    res.status(200).json({ success: true, data: network });
  } catch (error) {
    console.error('Error getting network visualization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get relationships for a person
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getRelationshipsForPerson = async (req, res) => {
  try {
    const { personId } = req.params;
    const { type, direction } = req.query;
    
    // Check if person exists
    const person = await personModel.getPersonById(personId);
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    // Build options
    const options = {};
    if (type) options.relationshipType = type;
    if (direction) options.direction = direction;
    
    // Get relationships
    const relationships = await relationshipModel.getRelationshipsForPerson(personId, options);
    
    res.status(200).json({ success: true, data: relationships });
  } catch (error) {
    console.error('Error getting relationships for person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createRelationship,
  getRelationshipById,
  updateRelationship,
  deleteRelationship,
  listRelationships,
  createReferralRelationship,
  getReferralRelationships,
  getNetworkVisualization,
  getRelationshipsForPerson
}; 