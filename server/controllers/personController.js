/**
 * Person Controller
 * 
 * Handles operations for the unified person model
 * This provides a base for managing all types of contacts (leads, referrals, members)
 */

const personModel = require('../models/personModel');
const relationshipModel = require('../models/relationshipModel');

/**
 * Create a new person
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createPerson = async (req, res) => {
  try {
    const personData = req.body;
    const person = await personModel.createPerson(personData);
    res.status(201).json({ success: true, data: person });
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get a person by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await personModel.getPersonById(id);
    
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    res.status(200).json({ success: true, data: person });
  } catch (error) {
    console.error('Error getting person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get person summary for dashboard/quick view
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getPersonSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get person with all extensions
    const person = await personModel.getPersonById(id);
    
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    // Create summary object with key information
    const summary = {
      id: person.id,
      name: `${person.first_name} ${person.last_name}`,
      email: person.email,
      phone: person.phone,
      type: {
        isLead: person.is_lead,
        isReferral: person.is_referral,
        isMember: person.is_member
      },
      status: {
        leadStatus: person.lead_extensions?.[0]?.lead_status,
        referralStatus: person.referral_extensions?.[0]?.referral_status,
        memberStatus: person.member_extensions?.[0]?.membership_status
      },
      lastContact: person.last_contacted,
      createdAt: person.created_at,
      updatedAt: person.updated_at
    };
    
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting person summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update a person
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updatePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const personData = req.body;
    const updatedPerson = await personModel.updatePerson(id, personData);
    
    if (!updatedPerson) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    res.status(200).json({ success: true, data: updatedPerson });
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete a person
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deletePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await personModel.deletePerson(id);
    
    if (!success) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    res.status(200).json({ success: true, message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * List persons with filtering
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const listPersons = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, assigned_to, status, is_lead, is_referral, is_member } = req.query;
    
    // Build filters object
    const filters = {};
    if (search) filters.search = search;
    if (assigned_to) filters.assigned_to = assigned_to;
    if (status) filters.status = status;
    if (is_lead === 'true') filters.is_lead = true;
    if (is_referral === 'true') filters.is_referral = true;
    if (is_member === 'true') filters.is_member = true;
    
    const result = await personModel.listPersons(filters, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Error listing persons:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Search persons
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const searchPersons = async (req, res) => {
  try {
    const { query } = req.params;
    const results = await personModel.searchPersons(query);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching persons:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get relationships for a person
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getPersonRelationships = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, direction } = req.query;
    
    // Check if person exists
    const person = await personModel.getPersonById(id);
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    // Get relationships
    const relationships = await relationshipModel.getRelationshipsForPerson(id, {
      relationshipType: type,
      direction: direction
    });
    
    res.status(200).json({ success: true, data: relationships });
  } catch (error) {
    console.error('Error getting person relationships:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get interactions for a person
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getPersonInteractions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    // Check if person exists
    const person = await personModel.getPersonById(id);
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    // Build filters
    const filters = { person_id: id };
    if (type) filters.interaction_type = type;
    
    // Get interactions
    const interactions = await personModel.getPersonInteractions(id, filters, parseInt(page), parseInt(limit));
    
    res.status(200).json({ success: true, ...interactions });
  } catch (error) {
    console.error('Error getting person interactions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate a referral link for a person
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const generateReferralLink = async (req, res) => {
  try {
    const { referrerId, referrerName } = req.body;
    
    if (!referrerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Referrer ID is required' 
      });
    }
    
    // Check if person exists
    const person = await personModel.getPersonById(referrerId);
    if (!person) {
      return res.status(404).json({ 
        success: false, 
        error: 'Person not found' 
      });
    }
    
    // Generate a unique link ID
    const linkId = require('crypto').randomUUID();
    
    // Create a mock link (in production, use Firebase Dynamic Links or similar)
    const linkData = {
      id: linkId,
      referrerId,
      created_at: new Date().toISOString(),
      url: `https://orca.app/r/${linkId}?ref=${referrerId}`,
      shortLink: `https://orca.app/r/${linkId}`,
      active: true
    };
    
    // In a real implementation, save this link to the database
    // For now, just return the generated link
    
    res.status(200).json({ 
      success: true, 
      data: linkData
    });
  } catch (error) {
    console.error('Error generating referral link:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = {
  createPerson,
  getPersonById,
  getPersonSummary,
  updatePerson,
  deletePerson,
  listPersons,
  searchPersons,
  getPersonRelationships,
  getPersonInteractions,
  generateReferralLink
}; 