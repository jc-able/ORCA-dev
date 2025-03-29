/**
 * Referral Model
 * Handles referral-specific database operations
 */
const supabase = require('../config/supabase');
const personModel = require('./personModel');

/**
 * Standard fields for the referral_extensions table, matching Supabase database structure
 * Used for validation and documentation purposes
 */
exports.referralExtensionFields = {
  // Core fields
  id: 'uuid',
  person_id: 'uuid', // NOT NULL constraint in SQL
  
  // Referral relationship
  relationship_to_referrer: 'text',
  relationship_strength: 'text', // Free-form text field in SQL
  permission_level: 'text', // Free-form text field in SQL
  
  // Referral journey
  referral_status: 'text', // DEFAULT 'submitted'::text in SQL
  status_history: 'jsonb[]', // Array of objects with status transitions
  time_in_stage_days: 'jsonb', // Key-value pairs of stages and durations
  
  // Appointment data
  appointment_date: 'timestamp',
  appointment_status: 'text',
  google_calendar_event_id: 'text',
  
  // Conversion data
  conversion_status: 'text',
  conversion_date: 'timestamp',
  conversion_probability: 'integer', // SQL CHECK constraint: conversion_probability >= 0 AND conversion_probability <= 100
  
  // Incentive tracking
  eligible_incentives: 'jsonb[]', // Array of available incentives
  incentives_awarded: 'jsonb[]', // Array of awarded incentives
  
  // Marketing engagement
  marketing_materials_sent: 'jsonb[]', // Array of materials with tracking info
  campaign_enrollments: 'text[]', // Array of campaign identifiers
  nurture_sequence_status: 'jsonb', // Status of nurture sequences
  
  // Meta
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp' // DEFAULT now() in SQL
};

/**
 * Get all referrals with filtering options
 * @param {Object} filters - Optional query filters
 * @param {String} filters.referralStatus - Filter by referral status
 * @param {String} filters.searchTerm - Search by name, email, or phone
 * @param {UUID} filters.assignedTo - Filter by assigned user
 * @param {UUID} filters.referrerId - Filter by referrer ID
 * @param {String} filters.appointmentStatus - Filter by appointment status
 * @param {String} filters.conversionStatus - Filter by conversion status
 * @param {String} filters.dateFrom - Filter by date range start
 * @param {String} filters.dateTo - Filter by date range end
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of referral records
 */
exports.getAllReferrals = async (filters = {}, pagination = { page: 0, pageSize: 10 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    // Query to get referrals with all extensions
    let query = supabase
      .from('persons')
      .select(`
        *,
        referral_extensions (*)
      `)
      .eq('is_referral', true)
      .range(from, to);
    
    // Apply person table filters
    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }
    
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    if (filters.dateFrom && filters.dateTo) {
      query = query.gte('created_at', filters.dateFrom).lte('created_at', filters.dateTo);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    let filteredReferrals = data;
    
    // Apply referral_extensions table filters
    if (filters.referralStatus) {
      filteredReferrals = filteredReferrals.filter(referral => 
        referral.referral_extensions && 
        referral.referral_extensions.length > 0 && 
        referral.referral_extensions[0].referral_status === filters.referralStatus
      );
    }
    
    if (filters.appointmentStatus) {
      filteredReferrals = filteredReferrals.filter(referral => 
        referral.referral_extensions && 
        referral.referral_extensions.length > 0 && 
        referral.referral_extensions[0].appointment_status === filters.appointmentStatus
      );
    }
    
    if (filters.conversionStatus) {
      filteredReferrals = filteredReferrals.filter(referral => 
        referral.referral_extensions && 
        referral.referral_extensions.length > 0 && 
        referral.referral_extensions[0].conversion_status === filters.conversionStatus
      );
    }
    
    // If referrerId is provided, filter by relationships
    if (filters.referrerId) {
      // Get all relationships where the referrer is person_a
      const { data: relationships, error: relError } = await supabase
        .from('relationships')
        .select('person_b_id')
        .eq('person_a_id', filters.referrerId)
        .eq('relationship_type', 'referral');
      
      if (relError) {
        throw relError;
      }
      
      // Filter referrals to only include those referred by the specified referrer
      if (relationships && relationships.length > 0) {
        const referredIds = relationships.map(rel => rel.person_b_id);
        filteredReferrals = filteredReferrals.filter(referral => 
          referredIds.includes(referral.id)
        );
      } else {
        // If no relationships found, return empty array
        return [];
      }
    }
    
    return filteredReferrals;
  } catch (error) {
    console.error('Error in getAllReferrals:', error);
    throw error;
  }
};

/**
 * Get referral by ID
 * @param {UUID} id - Referral ID (person_id)
 * @returns {Promise<Object>} Referral record
 */
exports.getReferralById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('persons')
      .select(`
        *,
        referral_extensions (*),
        relationships!relationships_person_b_id_fkey (
          *,
          referrer:person_a_id (id, first_name, last_name, email, phone)
        )
      `)
      .eq('id', id)
      .eq('is_referral', true)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getReferralById:', error);
    throw error;
  }
};

/**
 * Create a new referral
 * @param {Object} personData - Core person data
 * @param {Object} referralExtensionData - Referral-specific data
 * @param {UUID} referrerId - ID of person who made the referral
 * @param {Object} relationshipData - Additional data about the relationship
 * @returns {Promise<Object>} Created referral
 */
exports.createReferral = async (personData, referralExtensionData = {}, referrerId = null, relationshipData = {}) => {
  try {
    // Ensure referral flag is set
    const referralPersonData = {
      ...personData,
      is_referral: true
    };
    
    // Set default referral status if not provided
    const referralExtData = {
      ...referralExtensionData,
      referral_status: referralExtensionData.referral_status || 'submitted'
    };
    
    // Add status history entry if it's a new referral
    if (!referralExtData.status_history || !referralExtData.status_history.length) {
      const now = new Date().toISOString();
      referralExtData.status_history = [{
        status: referralExtData.referral_status,
        timestamp: now,
        notes: 'Referral created'
      }];
    }
    
    // Create person with referral extension
    const referral = await personModel.createPerson(referralPersonData, { referralExtension: referralExtData });
    
    // If referrer is provided, create relationship
    if (referrerId && referral) {
      await exports.createReferralRelationship(referrerId, referral.id, relationshipData);
    }
    
    return referral;
  } catch (error) {
    console.error('Error in createReferral:', error);
    throw error;
  }
};

/**
 * Create a referral relationship between referrer and referral
 * @param {UUID} referrerId - Person who made the referral
 * @param {UUID} referralId - Person who was referred
 * @param {Object} relationshipData - Additional relationship data
 * @returns {Promise<Object>} Created relationship record
 */
exports.createReferralRelationship = async (referrerId, referralId, relationshipData = {}) => {
  try {
    const now = new Date().toISOString();
    
    const relationship = {
      person_a_id: referrerId,
      person_b_id: referralId,
      relationship_type: 'referral',
      direction: 'a_to_b',
      referral_date: relationshipData.referral_date || now,
      referral_channel: relationshipData.referral_channel || 'app',
      referral_campaign: relationshipData.referral_campaign,
      referral_link_id: relationshipData.referral_link_id,
      is_primary_referrer: relationshipData.is_primary_referrer !== undefined ? relationshipData.is_primary_referrer : true,
      attribution_percentage: relationshipData.attribution_percentage || 100,
      status: 'active',
      relationship_level: 1,
      relationship_strength: relationshipData.relationship_strength || 'medium',
      created_at: now,
      updated_at: now,
      notes: relationshipData.notes
    };
    
    const { data, error } = await supabase
      .from('relationships')
      .insert(relationship)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createReferralRelationship:', error);
    throw error;
  }
};

/**
 * Update a referral
 * @param {UUID} id - Referral ID (person_id)
 * @param {Object} personData - Core person data to update
 * @param {Object} referralExtensionData - Referral-specific data to update
 * @returns {Promise<Object>} Updated referral
 */
exports.updateReferral = async (id, personData = {}, referralExtensionData = {}) => {
  try {
    // If updating referral_status, add entry to status_history
    if (referralExtensionData.referral_status) {
      // First get current referral to access current status_history
      const currentReferral = await exports.getReferralById(id);
      
      if (currentReferral && currentReferral.referral_extensions && currentReferral.referral_extensions.length > 0) {
        const currentExtension = currentReferral.referral_extensions[0];
        const currentStatus = currentExtension.referral_status;
        
        // Only update if status is actually changing
        if (currentStatus !== referralExtensionData.referral_status) {
          const now = new Date().toISOString();
          const currentHistory = currentExtension.status_history || [];
          
          referralExtensionData.status_history = [
            ...currentHistory,
            {
              status: referralExtensionData.referral_status,
              timestamp: now,
              notes: referralExtensionData.statusChangeNotes || `Status changed from ${currentStatus} to ${referralExtensionData.referral_status}`
            }
          ];
          
          // Remove temporary field used only for note creation
          delete referralExtensionData.statusChangeNotes;
        }
      }
    }
    
    // Update appointment data if provided
    if (referralExtensionData.appointment_date || referralExtensionData.appointment_status) {
      // If appointment status is changing, update the status
      if (referralExtensionData.appointment_status) {
        // Update referral status based on appointment status if not explicitly set
        if (!referralExtensionData.referral_status) {
          const statusMap = {
            'scheduled': 'appointment_scheduled',
            'confirmed': 'appointment_confirmed',
            'completed': 'appointment_completed',
            'no_show': 'no_show',
            'cancelled': 'appointment_cancelled',
            'rescheduled': 'appointment_rescheduled'
          };
          
          if (statusMap[referralExtensionData.appointment_status]) {
            referralExtensionData.referral_status = statusMap[referralExtensionData.appointment_status];
            
            // Add to status history (recursive call will handle the status history update)
            return await exports.updateReferral(id, personData, referralExtensionData);
          }
        }
      }
    }
    
    // Update the referral
    return await personModel.updatePerson(id, personData, { referralExtension: referralExtensionData });
  } catch (error) {
    console.error('Error in updateReferral:', error);
    throw error;
  }
};

/**
 * Update a referral's appointment information
 * @param {UUID} id - Referral ID (person_id)
 * @param {Object} appointmentData - Appointment data
 * @param {Date} appointmentData.appointment_date - Appointment date
 * @param {String} appointmentData.appointment_status - Appointment status
 * @param {String} appointmentData.google_calendar_event_id - Google Calendar event ID
 * @returns {Promise<Object>} Updated referral
 */
exports.updateReferralAppointment = async (id, appointmentData) => {
  try {
    return await exports.updateReferral(id, {}, appointmentData);
  } catch (error) {
    console.error('Error in updateReferralAppointment:', error);
    throw error;
  }
};

/**
 * Update a referral's conversion status
 * @param {UUID} id - Referral ID (person_id)
 * @param {String} conversionStatus - New conversion status
 * @param {Date} conversionDate - Date of conversion
 * @returns {Promise<Object>} Updated referral
 */
exports.updateReferralConversion = async (id, conversionStatus, conversionDate = new Date().toISOString()) => {
  try {
    const referralExtensionData = {
      conversion_status: conversionStatus,
      conversion_date: conversionDate,
      // Update referral status if converted
      referral_status: conversionStatus === 'converted' ? 'converted' : undefined,
      statusChangeNotes: `Conversion status updated to ${conversionStatus}`
    };
    
    return await exports.updateReferral(id, {}, referralExtensionData);
  } catch (error) {
    console.error('Error in updateReferralConversion:', error);
    throw error;
  }
};

/**
 * Delete a referral
 * @param {UUID} id - Referral ID (person_id)
 * @returns {Promise<Boolean>} True if successful
 */
exports.deleteReferral = async (id) => {
  try {
    return await personModel.deletePerson(id);
  } catch (error) {
    console.error('Error in deleteReferral:', error);
    throw error;
  }
};

/**
 * Get referrals by referrer ID
 * @param {UUID} referrerId - Person ID who made referrals
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of referred persons
 */
exports.getReferralsByReferrerId = async (referrerId, pagination = { page: 0, pageSize: 10 }) => {
  try {
    // First get all relationships where the referrer is person_a
    const { data: relationships, error: relError } = await supabase
      .from('relationships')
      .select('person_b_id')
      .eq('person_a_id', referrerId)
      .eq('relationship_type', 'referral');
    
    if (relError) {
      throw relError;
    }
    
    if (!relationships || relationships.length === 0) {
      return [];
    }
    
    // Get all the referral person records
    const referralIds = relationships.map(rel => rel.person_b_id);
    
    // Use IN clause to get all referrals at once
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from('persons')
      .select(`
        *,
        referral_extensions (*)
      `)
      .in('id', referralIds)
      .range(from, to);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getReferralsByReferrerId:', error);
    throw error;
  }
};

/**
 * Get referrer for a referral
 * @param {UUID} referralId - Person ID who was referred
 * @returns {Promise<Object>} Referrer person record
 */
exports.getReferrerForReferral = async (referralId) => {
  try {
    // Get the relationship where referral is person_b
    const { data: relationship, error: relError } = await supabase
      .from('relationships')
      .select(`
        *,
        referrer:person_a_id (*)
      `)
      .eq('person_b_id', referralId)
      .eq('relationship_type', 'referral')
      .order('is_primary_referrer', { ascending: false })
      .limit(1)
      .single();
    
    if (relError) {
      throw relError;
    }
    
    if (!relationship) {
      return null;
    }
    
    return relationship.referrer;
  } catch (error) {
    console.error('Error in getReferrerForReferral:', error);
    throw error;
  }
};

/**
 * Get referral network
 * @param {UUID} rootPersonId - Starting point for network
 * @param {Number} maxDepth - Maximum depth to traverse
 * @param {Boolean} includeMembers - Whether to include members 
 * @returns {Promise<Object>} Network structure with nodes and links
 */
exports.getReferralNetwork = async (rootPersonId, maxDepth = 2, includeMembers = true) => {
  try {
    // Set to track visited nodes to avoid cycles
    const visited = new Set();
    // Maps to store nodes and links
    const nodes = new Map();
    const links = [];
    
    // Recursive function to fetch referrals
    const fetchReferrals = async (currentPersonId, currentDepth) => {
      // Stop if we've reached max depth or already visited this node
      if (currentDepth > maxDepth || visited.has(currentPersonId)) {
        return;
      }
      
      // Mark as visited
      visited.add(currentPersonId);
      
      // Get the current person
      const { data: person, error: personError } = await supabase
        .from('persons')
        .select('*, lead_extensions(*), referral_extensions(*), member_extensions(*)')
        .eq('id', currentPersonId)
        .single();
      
      if (personError) {
        console.error('Error fetching person:', personError);
        return;
      }
      
      // Skip if we're not including members and this is a member (except for root)
      if (!includeMembers && person.is_member && currentPersonId !== rootPersonId) {
        return;
      }
      
      // Add to nodes if not already present
      if (!nodes.has(person.id)) {
        nodes.set(person.id, {
          id: person.id,
          name: `${person.first_name} ${person.last_name}`,
          email: person.email,
          phone: person.phone,
          isLead: person.is_lead,
          isReferral: person.is_referral,
          isMember: person.is_member,
          depth: currentDepth
        });
      }
      
      // Get all relationships where this person is the referrer (person_a)
      const { data: relationships, error: relError } = await supabase
        .from('relationships')
        .select('*, person_b:person_b_id (*)')
        .eq('person_a_id', currentPersonId)
        .eq('relationship_type', 'referral');
      
      if (relError) {
        console.error('Error fetching relationships:', relError);
        return;
      }
      
      // Process each relationship
      for (const rel of relationships) {
        const referralPerson = rel.person_b;
        
        // Skip if we're not including members and this is a member
        if (!includeMembers && referralPerson.is_member) {
          continue;
        }
        
        // Add referral to nodes if not already present
        if (!nodes.has(referralPerson.id)) {
          nodes.set(referralPerson.id, {
            id: referralPerson.id,
            name: `${referralPerson.first_name} ${referralPerson.last_name}`,
            email: referralPerson.email,
            phone: referralPerson.phone,
            isLead: referralPerson.is_lead,
            isReferral: referralPerson.is_referral,
            isMember: referralPerson.is_member,
            depth: currentDepth + 1
          });
        }
        
        // Add link
        links.push({
          source: currentPersonId,
          target: referralPerson.id,
          relationshipId: rel.id,
          relationshipType: rel.relationship_type,
          relationshipStrength: rel.relationship_strength,
          isPrimary: rel.is_primary_referrer
        });
        
        // Recursively fetch referrals from this person
        await fetchReferrals(referralPerson.id, currentDepth + 1);
      }
    };
    
    // Start the recursive traversal
    await fetchReferrals(rootPersonId, 0);
    
    // Convert nodes map to array
    const nodesArray = Array.from(nodes.values());
    
    return {
      nodes: nodesArray,
      links: links
    };
  } catch (error) {
    console.error('Error in getReferralNetwork:', error);
    throw error;
  }
};

/**
 * Get referral statistics
 * @param {Object} filters - Optional filters like date range
 * @returns {Promise<Object>} Referral statistics
 */
exports.getReferralStats = async (filters = {}) => {
  try {
    let query = supabase
      .from('referral_extensions')
      .select('referral_status, conversion_status, appointment_status');
    
    // Apply date filters if provided
    if (filters.startDate && filters.endDate) {
      query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Count by referral status
    const countByStatus = data.reduce((acc, ref) => {
      const status = ref.referral_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Count by conversion status
    const countByConversion = data.reduce((acc, ref) => {
      const status = ref.conversion_status || 'not_converted';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Count by appointment status
    const countByAppointment = data.reduce((acc, ref) => {
      const status = ref.appointment_status || 'none';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate conversion rate
    const conversionRate = data.length > 0 ? 
      (countByConversion.converted || 0) / data.length * 100 : 0;
    
    // Calculate appointment rate
    const scheduledAppointments = Object.keys(countByAppointment)
      .filter(k => k !== 'none' && k !== 'cancelled')
      .reduce((sum, k) => sum + countByAppointment[k], 0);
    
    const appointmentRate = data.length > 0 ?
      scheduledAppointments / data.length * 100 : 0;
    
    return {
      total: data.length,
      byStatus: countByStatus,
      byConversion: countByConversion,
      byAppointment: countByAppointment,
      conversionRate: conversionRate.toFixed(2),
      appointmentRate: appointmentRate.toFixed(2)
    };
  } catch (error) {
    console.error('Error in getReferralStats:', error);
    throw error;
  }
}; 