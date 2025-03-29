/**
 * Interaction Controller
 * Handles API requests related to interactions between users and persons
 */
const interactionModel = require('../models/interactionModel');
const { validateInteraction } = require('../utils/validation');

/**
 * Get all interactions with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {String} req.query.personId - Filter by person ID
 * @param {String} req.query.userId - Filter by user ID
 * @param {String} req.query.type - Filter by interaction type
 * @param {String} req.query.status - Filter by status
 * @param {String} req.query.startDate - Filter by date range (start)
 * @param {String} req.query.endDate - Filter by date range (end)
 * @param {String} req.query.campaignId - Filter by campaign ID
 * @param {Number} req.query.page - Page number (0-indexed)
 * @param {Number} req.query.pageSize - Items per page
 * @param {Object} res - Express response object
 */
exports.getAllInteractions = async (req, res) => {
  try {
    const { 
      personId, 
      userId, 
      type, 
      status, 
      startDate, 
      endDate,
      campaignId,
      page = 0, 
      pageSize = 10 
    } = req.query;
    
    // Build filters object
    const filters = {};
    
    if (personId) filters.personId = personId;
    if (userId) filters.userId = userId;
    if (type) filters.interactionType = type;
    if (status) filters.status = status;
    if (campaignId) filters.campaignId = campaignId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    
    // Build pagination object
    const pagination = {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
    
    const interactions = await interactionModel.getAllInteractions(filters, pagination);
    
    res.status(200).json({
      success: true,
      count: interactions.length,
      data: interactions
    });
  } catch (error) {
    console.error('Error in getAllInteractions controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving interactions',
      error: error.message
    });
  }
};

/**
 * Get a single interaction by ID
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {String} req.params.id - Interaction ID
 * @param {Object} res - Express response object
 */
exports.getInteractionById = async (req, res) => {
  try {
    const interaction = await interactionModel.getInteractionById(req.params.id);
    
    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: interaction
    });
  } catch (error) {
    console.error('Error in getInteractionById controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving interaction',
      error: error.message
    });
  }
};

/**
 * Get all interactions for a specific person
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {String} req.params.personId - Person ID
 * @param {Object} req.query - Query parameters
 * @param {Number} req.query.page - Page number (0-indexed)
 * @param {Number} req.query.pageSize - Items per page
 * @param {Object} res - Express response object
 */
exports.getInteractionsByPerson = async (req, res) => {
  try {
    const { page = 0, pageSize = 10 } = req.query;
    
    const pagination = {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
    
    const interactions = await interactionModel.getInteractionsByPersonId(
      req.params.personId,
      pagination
    );
    
    res.status(200).json({
      success: true,
      count: interactions.length,
      data: interactions
    });
  } catch (error) {
    console.error('Error in getInteractionsByPerson controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving interactions',
      error: error.message
    });
  }
};

/**
 * Create a new interaction
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing interaction data
 * @param {Object} res - Express response object
 */
exports.createInteraction = async (req, res) => {
  try {
    // Validate input
    const validationResult = validateInteraction(req.body);
    
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interaction data',
        errors: validationResult.errors
      });
    }
    
    // Add current user ID from auth if not provided
    if (!req.body.user_id && req.user) {
      req.body.user_id = req.user.id;
    }
    
    const interaction = await interactionModel.createInteraction(req.body);
    
    res.status(201).json({
      success: true,
      data: interaction
    });
  } catch (error) {
    console.error('Error in createInteraction controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating interaction',
      error: error.message
    });
  }
};

/**
 * Update an existing interaction
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {String} req.params.id - Interaction ID
 * @param {Object} req.body - Request body containing updated interaction data
 * @param {Object} res - Express response object
 */
exports.updateInteraction = async (req, res) => {
  try {
    // Check if the interaction exists
    const existingInteraction = await interactionModel.getInteractionById(req.params.id);
    
    if (!existingInteraction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }
    
    // Validate input
    const validationResult = validateInteraction(req.body, true);
    
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interaction data',
        errors: validationResult.errors
      });
    }
    
    const updatedInteraction = await interactionModel.updateInteraction(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedInteraction
    });
  } catch (error) {
    console.error('Error in updateInteraction controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating interaction',
      error: error.message
    });
  }
};

/**
 * Delete an interaction
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {String} req.params.id - Interaction ID
 * @param {Object} res - Express response object
 */
exports.deleteInteraction = async (req, res) => {
  try {
    // Check if the interaction exists
    const existingInteraction = await interactionModel.getInteractionById(req.params.id);
    
    if (!existingInteraction) {
      return res.status(404).json({
        success: false,
        message: 'Interaction not found'
      });
    }
    
    await interactionModel.deleteInteraction(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Interaction deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteInteraction controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting interaction',
      error: error.message
    });
  }
};

/**
 * Get interaction counts by type for a person
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {String} req.params.personId - Person ID
 * @param {Object} res - Express response object
 */
exports.getInteractionCountsByType = async (req, res) => {
  try {
    const counts = await interactionModel.getInteractionCountsByType(req.params.personId);
    
    res.status(200).json({
      success: true,
      data: counts
    });
  } catch (error) {
    console.error('Error in getInteractionCountsByType controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving interaction counts',
      error: error.message
    });
  }
};

/**
 * Get recent interactions for the current user
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {Number} req.query.limit - Number of interactions to return
 * @param {Object} res - Express response object
 */
exports.getRecentInteractions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Use current authenticated user ID
    const userId = req.user.id;
    
    const interactions = await interactionModel.getRecentInteractionsByUser(
      userId,
      parseInt(limit)
    );
    
    res.status(200).json({
      success: true,
      count: interactions.length,
      data: interactions
    });
  } catch (error) {
    console.error('Error in getRecentInteractions controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving recent interactions',
      error: error.message
    });
  }
}; 