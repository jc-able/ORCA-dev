/**
 * Relationship Model
 * 
 * Handles operations related to relationships between persons in the database
 * Manages referral relationships, family connections, and more
 */

const supabase = require('../config/supabase');
const { errorHandler } = require('../utils/errorHandler');

/**
 * Standard fields for the relationships table, matching Supabase database structure
 * Used for validation and documentation purposes
 */
exports.relationshipFields = {
  // Core fields
  id: 'uuid',
  person_a_id: 'uuid', // NOT NULL constraint in SQL
  person_b_id: 'uuid', // NOT NULL constraint in SQL
  relationship_type: 'text', // NOT NULL constraint in SQL
  
  // Direction and metadata
  direction: 'text', // Free-form text field in SQL
  
  // Referral-specific fields
  referral_date: 'timestamp',
  referral_channel: 'text',
  referral_campaign: 'text',
  referral_link_id: 'text',
  
  // Attribution
  is_primary_referrer: 'boolean', // DEFAULT false in SQL
  attribution_percentage: 'integer', // SQL CHECK constraint: attribution_percentage >= 0 AND attribution_percentage <= 100, DEFAULT 100 in SQL
  
  // Status and strength
  status: 'text', // DEFAULT 'active'::text in SQL
  relationship_level: 'integer', // SQL CHECK constraint: relationship_level >= 1, DEFAULT 1 in SQL
  relationship_strength: 'text', // Free-form text field in SQL
  
  // Meta
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp', // DEFAULT now() in SQL
  notes: 'text'
};

/**
 * Create a new relationship
 * @param {Object} relationshipData - Relationship data
 * @returns {Promise<Object>} Created relationship
 */
exports.createRelationship = async (relationshipData) => {
  try {
    // Validate required fields
    if (!relationshipData.person_a_id) {
      throw new Error('person_a_id is required');
    }
    
    if (!relationshipData.person_b_id) {
      throw new Error('person_b_id is required');
    }
    
    if (!relationshipData.relationship_type) {
      throw new Error('relationship_type is required');
    }
    
    // Check for potential duplicate (UNIQUE constraint violation)
    const { data: existingRelationships, error: checkError } = await supabase
      .from('relationships')
      .select('id')
      .eq('person_a_id', relationshipData.person_a_id)
      .eq('person_b_id', relationshipData.person_b_id)
      .eq('relationship_type', relationshipData.relationship_type)
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingRelationships && existingRelationships.length > 0) {
      throw new Error('A relationship with the same person_a_id, person_b_id, and relationship_type already exists');
    }
    
    // Validate attribution_percentage constraint
    if (relationshipData.attribution_percentage !== undefined &&
        (relationshipData.attribution_percentage < 0 || relationshipData.attribution_percentage > 100)) {
      throw new Error('attribution_percentage must be between 0 and 100');
    }
    
    // Validate relationship_level constraint
    if (relationshipData.relationship_level !== undefined && relationshipData.relationship_level < 1) {
      throw new Error('relationship_level must be greater than or equal to 1');
    }
    
    // Set default values
    const now = new Date().toISOString();
    const dataWithDefaults = {
      ...relationshipData,
      status: relationshipData.status || 'active',
      relationship_level: relationshipData.relationship_level || 1,
      created_at: relationshipData.created_at || now,
      updated_at: relationshipData.updated_at || now
    };
    
    const { data, error } = await supabase
      .from('relationships')
      .insert(dataWithDefaults)
      .select()
      .single();
    
    if (error) {
      // Handle specific error cases
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('A relationship with the same person_a_id, person_b_id, and relationship_type already exists');
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createRelationship:', error);
    throw error;
  }
};

/**
 * Get relationship by ID
 * @param {UUID} id - Relationship ID
 * @returns {Promise<Object>} Relationship data with resolved person data
 */
exports.getRelationshipById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('relationships')
      .select(`
        *,
        person_a:person_a_id (id, first_name, last_name, email, phone),
        person_b:person_b_id (id, first_name, last_name, email, phone)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getRelationshipById:', error);
    throw error;
  }
};

/**
 * Update a relationship
 * @param {UUID} id - Relationship ID
 * @param {Object} relationshipData - Updated relationship data
 * @returns {Promise<Object>} Updated relationship
 */
exports.updateRelationship = async (id, relationshipData) => {
  try {
    // Check if we're trying to update the unique key fields
    if (relationshipData.person_a_id || relationshipData.person_b_id || relationshipData.relationship_type) {
      const currentRel = await exports.getRelationshipById(id);
      
      // Build the potential new unique key
      const newPersonAId = relationshipData.person_a_id || currentRel.person_a_id;
      const newPersonBId = relationshipData.person_b_id || currentRel.person_b_id;
      const newRelType = relationshipData.relationship_type || currentRel.relationship_type;
      
      // Only check for duplicates if we're actually changing one of the unique key fields
      if (newPersonAId !== currentRel.person_a_id || 
          newPersonBId !== currentRel.person_b_id || 
          newRelType !== currentRel.relationship_type) {
        
        // Check for potential duplicate (UNIQUE constraint violation)
        const { data: existingRelationships, error: checkError } = await supabase
          .from('relationships')
          .select('id')
          .eq('person_a_id', newPersonAId)
          .eq('person_b_id', newPersonBId)
          .eq('relationship_type', newRelType)
          .neq('id', id) // Exclude current relationship
          .limit(1);
        
        if (checkError) {
          throw checkError;
        }
        
        if (existingRelationships && existingRelationships.length > 0) {
          throw new Error('A relationship with the same person_a_id, person_b_id, and relationship_type already exists');
        }
      }
    }
    
    // Validate attribution_percentage constraint
    if (relationshipData.attribution_percentage !== undefined &&
        (relationshipData.attribution_percentage < 0 || relationshipData.attribution_percentage > 100)) {
      throw new Error('attribution_percentage must be between 0 and 100');
    }
    
    // Validate relationship_level constraint
    if (relationshipData.relationship_level !== undefined && relationshipData.relationship_level < 1) {
      throw new Error('relationship_level must be greater than or equal to 1');
    }
    
    // Add updated timestamp
    const now = new Date().toISOString();
    const dataWithTimestamp = {
      ...relationshipData,
      updated_at: now
    };
    
    const { data, error } = await supabase
      .from('relationships')
      .update(dataWithTimestamp)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Handle specific error cases
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('A relationship with the same person_a_id, person_b_id, and relationship_type already exists');
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateRelationship:', error);
    throw error;
  }
};

/**
 * Delete a relationship
 * @param {UUID} id - Relationship ID
 * @returns {Promise<Boolean>} True if successful
 */
exports.deleteRelationship = async (id) => {
  try {
    const { error } = await supabase
      .from('relationships')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteRelationship:', error);
    throw error;
  }
};

/**
 * Get all relationships for a person
 * @param {UUID} personId - Person ID
 * @param {Object} options - Query options
 * @param {String} options.direction - 'outgoing', 'incoming', or 'both'
 * @param {String} options.relationshipType - Filter by relationship type
 * @param {String} options.status - Filter by relationship status
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of relationships
 */
exports.getRelationshipsForPerson = async (personId, options = {}, pagination = { page: 0, pageSize: 20 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    // Build query based on direction
    let query;
    const direction = options.direction || 'both';
    
    if (direction === 'outgoing') {
      // Relationships where person is person_a (outgoing)
      query = supabase
        .from('relationships')
        .select(`
          *,
          person_b:person_b_id (id, first_name, last_name, email, phone)
        `)
        .eq('person_a_id', personId);
    } else if (direction === 'incoming') {
      // Relationships where person is person_b (incoming)
      query = supabase
        .from('relationships')
        .select(`
          *,
          person_a:person_a_id (id, first_name, last_name, email, phone)
        `)
        .eq('person_b_id', personId);
    } else {
      // Both directions (union query)
      const outgoingQuery = supabase
        .from('relationships')
        .select(`
          *,
          direction:text
        `)
        .eq('person_a_id', personId)
        .order('created_at', { ascending: false });
      
      const incomingQuery = supabase
        .from('relationships')
        .select(`
          *,
          direction:text
        `)
        .eq('person_b_id', personId)
        .order('created_at', { ascending: false });
      
      // Apply filters to both queries
      if (options.relationshipType) {
        outgoingQuery = outgoingQuery.eq('relationship_type', options.relationshipType);
        incomingQuery = incomingQuery.eq('relationship_type', options.relationshipType);
      }
      
      if (options.status) {
        outgoingQuery = outgoingQuery.eq('status', options.status);
        incomingQuery = incomingQuery.eq('status', options.status);
      }
      
      // Execute both queries
      const { data: outgoing, error: outError } = await outgoingQuery;
      
      if (outError) {
        throw outError;
      }
      
      const { data: incoming, error: inError } = await incomingQuery;
      
      if (inError) {
        throw inError;
      }
      
      // Add direction marker
      const outgoingWithDirection = outgoing.map(rel => ({ ...rel, direction: 'outgoing' }));
      const incomingWithDirection = incoming.map(rel => ({ ...rel, direction: 'incoming' }));
      
      // Combine and sort
      const combined = [...outgoingWithDirection, ...incomingWithDirection]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Apply pagination manually
      return combined.slice(from, to + 1);
    }
    
    // Apply filters if provided (for single direction queries)
    if (options.relationshipType) {
      query = query.eq('relationship_type', options.relationshipType);
    }
    
    if (options.status) {
      query = query.eq('status', options.status);
    }
    
    // Apply pagination and sorting
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getRelationshipsForPerson:', error);
    throw error;
  }
};

/**
 * Get referral relationships with filtering
 * @param {Object} filters - Query filters
 * @param {UUID} filters.referrerId - Filter by referrer ID
 * @param {UUID} filters.referralId - Filter by referral ID
 * @param {String} filters.channel - Filter by referral channel
 * @param {String} filters.campaign - Filter by referral campaign
 * @param {String} filters.dateFrom - Filter from date
 * @param {String} filters.dateTo - Filter to date
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of referral relationships
 */
exports.getReferralRelationships = async (filters = {}, pagination = { page: 0, pageSize: 20 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('relationships')
      .select(`
        *,
        referrer:person_a_id (id, first_name, last_name, email, phone),
        referred:person_b_id (id, first_name, last_name, email, phone, is_lead, is_referral, is_member)
      `)
      .eq('relationship_type', 'referral')
      .range(from, to);
    
    // Apply filters
    if (filters.referrerId) {
      query = query.eq('person_a_id', filters.referrerId);
    }
    
    if (filters.referralId) {
      query = query.eq('person_b_id', filters.referralId);
    }
    
    if (filters.channel) {
      query = query.eq('referral_channel', filters.channel);
    }
    
    if (filters.campaign) {
      query = query.eq('referral_campaign', filters.campaign);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.isPrimaryReferrer !== undefined) {
      query = query.eq('is_primary_referrer', filters.isPrimaryReferrer);
    }
    
    if (filters.dateFrom && filters.dateTo) {
      query = query.gte('referral_date', filters.dateFrom).lte('referral_date', filters.dateTo);
    } else if (filters.dateFrom) {
      query = query.gte('referral_date', filters.dateFrom);
    } else if (filters.dateTo) {
      query = query.lte('referral_date', filters.dateTo);
    }
    
    // Order by date (newest first)
    query = query.order('referral_date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getReferralRelationships:', error);
    throw error;
  }
};

/**
 * Create a referral relationship
 * @param {Object} referralData - Referral relationship data
 * @param {UUID} referralData.referrerId - Person ID who made the referral
 * @param {UUID} referralData.referralId - Person ID who was referred
 * @param {String} referralData.channel - Referral channel
 * @param {String} referralData.campaign - Referral campaign
 * @param {String} referralData.linkId - Referral link ID
 * @param {Boolean} referralData.isPrimary - Whether this is the primary referrer
 * @returns {Promise<Object>} Created relationship
 */
exports.createReferralRelationship = async (referralData) => {
  try {
    const {
      referrerId,
      referralId,
      channel = 'direct',
      campaign,
      linkId,
      isPrimary = true,
      strength = 'medium',
      notes
    } = referralData;
    
    // Validate required fields
    if (!referrerId) {
      throw new Error('referrerId is required');
    }
    
    if (!referralId) {
      throw new Error('referralId is required');
    }
    
    // Create relationship record
    const relationship = {
      person_a_id: referrerId,
      person_b_id: referralId,
      relationship_type: 'referral',
      direction: 'a_to_b',
      referral_date: new Date().toISOString(),
      referral_channel: channel,
      referral_campaign: campaign,
      referral_link_id: linkId,
      is_primary_referrer: isPrimary,
      attribution_percentage: isPrimary ? 100 : 0,
      status: 'active',
      relationship_level: 1,
      relationship_strength: strength,
      notes
    };
    
    return await exports.createRelationship(relationship);
  } catch (error) {
    console.error('Error in createReferralRelationship:', error);
    throw error;
  }
};

/**
 * Mark a relationship as primary referrer
 * @param {UUID} relationshipId - Relationship ID to mark as primary
 * @param {UUID} referralId - Person ID who was referred
 * @returns {Promise<Object>} Updated relationship
 */
exports.markAsPrimaryReferrer = async (relationshipId, referralId) => {
  try {
    // First, update all relationships for this referral to non-primary
    const { error: resetError } = await supabase
      .from('relationships')
      .update({
        is_primary_referrer: false,
        attribution_percentage: 0,
        updated_at: new Date().toISOString()
      })
      .eq('person_b_id', referralId)
      .eq('relationship_type', 'referral');
    
    if (resetError) {
      throw resetError;
    }
    
    // Then, update the specified relationship to primary
    return await exports.updateRelationship(relationshipId, {
      is_primary_referrer: true,
      attribution_percentage: 100
    });
  } catch (error) {
    console.error('Error in markAsPrimaryReferrer:', error);
    throw error;
  }
};

/**
 * Get relationships with statistics
 * @param {Object} filters - Optional query filters
 * @returns {Promise<Object>} Relationship statistics
 */
exports.getRelationshipStats = async (filters = {}) => {
  try {
    let query = supabase
      .from('relationships')
      .select('relationship_type, direction, status, relationship_strength');
    
    // Apply date filters if provided
    if (filters.startDate && filters.endDate) {
      query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Count by relationship type
    const countByType = data.reduce((acc, rel) => {
      const type = rel.relationship_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Count by direction
    const countByDirection = data.reduce((acc, rel) => {
      const direction = rel.direction || 'unknown';
      acc[direction] = (acc[direction] || 0) + 1;
      return acc;
    }, {});
    
    // Count by status
    const countByStatus = data.reduce((acc, rel) => {
      const status = rel.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Count by strength
    const countByStrength = data.reduce((acc, rel) => {
      const strength = rel.relationship_strength || 'unknown';
      acc[strength] = (acc[strength] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: data.length,
      byType: countByType,
      byDirection: countByDirection,
      byStatus: countByStatus,
      byStrength: countByStrength
    };
  } catch (error) {
    console.error('Error in getRelationshipStats:', error);
    throw error;
  }
};

module.exports = {
  relationshipFields,
  createRelationship,
  getRelationshipById,
  updateRelationship,
  deleteRelationship,
  getRelationshipsForPerson,
  getReferralRelationships,
  createReferralRelationship,
  markAsPrimaryReferrer,
  getRelationshipStats
}; 