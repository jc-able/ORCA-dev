/**
 * Interaction Model
 * Handles database interactions for tracking activities and communications
 */
const supabase = require('../config/supabase');
const { SchemaConstraints } = require('../db/schema/types');

/**
 * Standard fields for the interactions table, matching Supabase database structure
 * Used for validation and documentation purposes
 */
exports.interactionFields = {
  // Core fields
  id: 'uuid',
  person_id: 'uuid', // NOT NULL constraint in SQL
  user_id: 'uuid', // Nullable in SQL
  interaction_type: 'text',
  
  // Content
  subject: 'text',
  content: 'text',
  attachments: 'jsonb[]', // Array of JSON objects
  
  // Status and tracking
  status: 'text', // DEFAULT 'completed'::text in SQL
  scheduled_at: 'timestamp',
  completed_at: 'timestamp',
  duration_minutes: 'integer',
  
  // Response tracking
  response_received: 'boolean', // DEFAULT false in SQL
  response_date: 'timestamp',
  response_content: 'text',
  sentiment: 'text', // Free-form text field in SQL
  
  // Association with campaigns
  campaign_id: 'text',
  template_id: 'text',
  
  // Meta
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp', // DEFAULT now() in SQL
  notes: 'text',
  custom_fields: 'jsonb' // DEFAULT '{}'::jsonb in SQL
};

/**
 * Validates interaction data against schema constraints
 * @param {Object} interactionData - The interaction data to validate
 * @returns {Object} Object with isValid and errors properties
 */
exports.validateInteraction = (interactionData) => {
  const errors = [];
  
  // Check required fields
  if (!interactionData.person_id) {
    errors.push('person_id is required');
  }
  
  // Ensure attachments is properly formatted as an array
  if (interactionData.attachments && !Array.isArray(interactionData.attachments)) {
    errors.push('attachments must be an array');
  }
  
  // Set default values if not provided
  if (interactionData.status === undefined) {
    interactionData.status = SchemaConstraints.DEFAULT_VALUES.INTERACTION_STATUS;
  }
  
  if (interactionData.response_received === undefined) {
    interactionData.response_received = SchemaConstraints.DEFAULT_VALUES.RESPONSE_RECEIVED;
  }
  
  // Apply default values to custom_fields if not provided
  if (interactionData.custom_fields === undefined) {
    interactionData.custom_fields = {};
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: interactionData
  };
};

/**
 * Get all interactions with optional filtering
 * @param {Object} filters - Optional query filters
 * @param {UUID} filters.personId - Filter by person ID
 * @param {UUID} filters.userId - Filter by user ID
 * @param {String} filters.interactionType - Filter by interaction type
 * @param {String} filters.status - Filter by status
 * @param {Date} filters.startDate - Filter by date range (start)
 * @param {Date} filters.endDate - Filter by date range (end)
 * @param {String} filters.campaignId - Filter by campaign ID
 * @param {Object} pagination - Pagination options
 * @param {Number} pagination.page - Page number (0-indexed)
 * @param {Number} pagination.pageSize - Items per page
 * @returns {Promise<Array>} Array of interaction records
 */
exports.getAllInteractions = async (filters = {}, pagination = { page: 0, pageSize: 10 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('interactions')
      .select(`
        *,
        persons:person_id (id, first_name, last_name, email, phone),
        users:user_id (id, first_name, last_name, email)
      `)
      .range(from, to);
    
    // Apply filters
    if (filters.personId) {
      query = query.eq('person_id', filters.personId);
    }
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.interactionType) {
      query = query.eq('interaction_type', filters.interactionType);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.campaignId) {
      query = query.eq('campaign_id', filters.campaignId);
    }
    
    if (filters.startDate && filters.endDate) {
      query = query.gte('scheduled_at', filters.startDate).lte('scheduled_at', filters.endDate);
    } else if (filters.startDate) {
      query = query.gte('scheduled_at', filters.startDate);
    } else if (filters.endDate) {
      query = query.lte('scheduled_at', filters.endDate);
    }
    
    // Order by scheduled_at date descending (most recent first)
    query = query.order('scheduled_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getAllInteractions:', error);
    throw error;
  }
};

/**
 * Get an interaction by ID
 * @param {UUID} id - Interaction ID
 * @returns {Promise<Object>} Interaction record
 */
exports.getInteractionById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select(`
        *,
        persons:person_id (id, first_name, last_name, email, phone),
        users:user_id (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getInteractionById:', error);
    throw error;
  }
};

/**
 * Get interactions for a specific person
 * @param {UUID} personId - Person ID
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of interaction records
 */
exports.getInteractionsByPersonId = async (personId, pagination = { page: 0, pageSize: 10 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from('interactions')
      .select(`
        *,
        users:user_id (id, first_name, last_name, email)
      `)
      .eq('person_id', personId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getInteractionsByPersonId:', error);
    throw error;
  }
};

/**
 * Create a new interaction
 * @param {Object} interactionData - Interaction data
 * @param {UUID} interactionData.person_id - Person ID (required)
 * @param {UUID} interactionData.user_id - User ID who performed the interaction
 * @param {String} interactionData.interaction_type - Type of interaction (email, call, meeting, etc.)
 * @param {String} interactionData.subject - Subject line or title
 * @param {String} interactionData.content - Main content or notes
 * @param {Array} interactionData.attachments - Array of attachment objects as jsonb[]
 * @param {String} interactionData.status - Status of the interaction
 * @param {Date} interactionData.scheduled_at - When the interaction is scheduled
 * @param {Date} interactionData.completed_at - When the interaction was completed
 * @param {Number} interactionData.duration_minutes - Duration in minutes
 * @param {Boolean} interactionData.response_received - Whether a response was received
 * @param {Date} interactionData.response_date - When the response was received
 * @param {String} interactionData.response_content - Content of the response
 * @param {String} interactionData.sentiment - Sentiment analysis of response
 * @param {String} interactionData.campaign_id - Associated campaign ID
 * @param {String} interactionData.template_id - Template used for the interaction
 * @param {String} interactionData.notes - Additional notes
 * @param {Object} interactionData.custom_fields - Custom data fields
 * @returns {Promise<Object>} Created interaction record
 */
exports.createInteraction = async (interactionData) => {
  try {
    // Validate data
    const validation = exports.validateInteraction(interactionData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Add timestamps if not provided
    const now = new Date().toISOString();
    const dataWithTimestamps = {
      ...validation.data,
      created_at: interactionData.created_at || now,
      updated_at: interactionData.updated_at || now
    };
    
    const { data, error } = await supabase
      .from('interactions')
      .insert(dataWithTimestamps)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createInteraction:', error);
    throw error;
  }
};

/**
 * Update an interaction
 * @param {UUID} id - Interaction ID
 * @param {Object} interactionData - Interaction data to update
 * @returns {Promise<Object>} Updated interaction record
 */
exports.updateInteraction = async (id, interactionData) => {
  try {
    // Validate data
    const validation = exports.validateInteraction(interactionData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Add updated timestamp
    const now = new Date().toISOString();
    const dataWithTimestamp = {
      ...validation.data,
      updated_at: now
    };
    
    const { data, error } = await supabase
      .from('interactions')
      .update(dataWithTimestamp)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateInteraction:', error);
    throw error;
  }
};

/**
 * Delete an interaction
 * @param {UUID} id - Interaction ID
 * @returns {Promise<boolean>} Success flag
 */
exports.deleteInteraction = async (id) => {
  try {
    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteInteraction:', error);
    throw error;
  }
};

/**
 * Get interaction counts by type
 * @param {UUID} personId - Person ID
 * @returns {Promise<Object>} Count of interactions by type
 */
exports.getInteractionCountsByType = async (personId) => {
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select('interaction_type')
      .eq('person_id', personId);
    
    if (error) {
      throw error;
    }
    
    // Count interactions by type
    const counts = {};
    data.forEach(interaction => {
      const type = interaction.interaction_type;
      counts[type] = (counts[type] || 0) + 1;
    });
    
    return counts;
  } catch (error) {
    console.error('Error in getInteractionCountsByType:', error);
    throw error;
  }
};

/**
 * Get recent interactions for a user
 * @param {UUID} userId - User ID
 * @param {Number} limit - Maximum number of interactions to return
 * @returns {Promise<Array>} Array of recent interaction records
 */
exports.getRecentInteractionsByUser = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select(`
        *,
        persons:person_id (id, first_name, last_name, email, phone)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getRecentInteractionsByUser:', error);
    throw error;
  }
};

/**
 * Count scheduled interactions for a period
 * @param {Date} startDate - Start date for counting
 * @param {Date} endDate - End date for counting
 * @param {UUID} userId - Optional user ID to filter by
 * @returns {Promise<number>} Count of scheduled interactions
 */
exports.countScheduledInteractions = async (startDate, endDate, userId = null) => {
  try {
    let query = supabase
      .from('interactions')
      .select('id', { count: 'exact' })
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { count, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return count;
  } catch (error) {
    console.error('Error in countScheduledInteractions:', error);
    throw error;
  }
};

/**
 * Get recent interactions
 * @param {Object} options - Options
 * @param {number} options.limit - Number of interactions to return
 * @param {UUID} options.userId - Optional user ID to filter by
 * @returns {Promise<Array>} Array of recent interactions
 */
exports.getRecentInteractions = async ({ limit = 5, userId = null }) => {
  try {
    let query = supabase
      .from('interactions')
      .select(`
        *,
        persons:person_id (id, first_name, last_name, email, phone),
        users:user_id (id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getRecentInteractions:', error);
    throw error;
  }
}; 