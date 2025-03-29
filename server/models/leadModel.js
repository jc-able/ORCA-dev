/**
 * Lead Model
 * Handles lead-specific database operations
 */
const supabase = require('../config/supabase');
const personModel = require('./personModel');
const { SchemaConstraints } = require('../db/schema/types');

/**
 * Standard fields for the lead_extensions table, matching Supabase database structure
 * Used for validation and documentation purposes
 */
exports.leadExtensionFields = {
  // Core fields
  id: 'uuid',
  person_id: 'uuid', // NOT NULL constraint in SQL
  
  // Qualification data
  decision_authority: 'text',
  decision_timeline: 'text',
  previous_experience: 'text',
  competitor_considerations: 'text[]',
  pain_points: 'text[]',
  motivations: 'text[]',
  objections: 'jsonb[]', // Array of objects
  readiness_score: 'integer', // SQL CHECK constraint: readiness_score >= 1 AND readiness_score <= 10
  lead_temperature: 'text', // Free-form text field in SQL
  
  // Pipeline data
  lead_status: 'text', // DEFAULT 'new'::text in SQL
  status_history: 'jsonb[]', // Array of objects
  stage_duration_days: 'jsonb', // Key-value pairs
  
  // Activity data
  visit_completed: 'boolean', // DEFAULT false in SQL
  visit_date: 'timestamp',
  trial_status: 'text',
  trial_start_date: 'timestamp',
  trial_end_date: 'timestamp',
  forms_completed: 'jsonb',
  documents_shared: 'jsonb[]', // Array of objects
  payment_info_collected: 'boolean', // DEFAULT false in SQL
  
  // Conversion tracking
  conversion_probability: 'integer', // SQL CHECK constraint: conversion_probability >= 0 AND conversion_probability <= 100
  estimated_value: 'numeric',
  conversion_blockers: 'text[]',
  
  // Meta
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp' // DEFAULT now() in SQL
};

/**
 * Validates lead extension data against schema constraints
 * @param {Object} leadData - The lead extension data to validate
 * @returns {Object} Object with isValid and errors properties
 */
exports.validateLeadExtension = (leadData) => {
  const errors = [];
  
  // Check required fields
  if (!leadData.person_id) {
    errors.push('person_id is required');
  }
  
  // Validate readiness_score against constraints
  if (leadData.readiness_score !== undefined) {
    if (typeof leadData.readiness_score !== 'number') {
      errors.push('readiness_score must be a number');
    } else if (leadData.readiness_score < SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN || 
               leadData.readiness_score > SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX) {
      errors.push(`readiness_score must be between ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN} and ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX}`);
    }
  }
  
  // Validate conversion_probability against constraints
  if (leadData.conversion_probability !== undefined) {
    if (typeof leadData.conversion_probability !== 'number') {
      errors.push('conversion_probability must be a number');
    } else if (leadData.conversion_probability < SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN || 
               leadData.conversion_probability > SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX) {
      errors.push(`conversion_probability must be between ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN} and ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX}`);
    }
  }
  
  // Check arrays are properly formatted
  if (leadData.competitor_considerations && !Array.isArray(leadData.competitor_considerations)) {
    errors.push('competitor_considerations must be an array');
  }
  
  if (leadData.pain_points && !Array.isArray(leadData.pain_points)) {
    errors.push('pain_points must be an array');
  }
  
  if (leadData.motivations && !Array.isArray(leadData.motivations)) {
    errors.push('motivations must be an array');
  }
  
  if (leadData.objections && !Array.isArray(leadData.objections)) {
    errors.push('objections must be an array');
  }
  
  if (leadData.status_history && !Array.isArray(leadData.status_history)) {
    errors.push('status_history must be an array');
  }
  
  if (leadData.documents_shared && !Array.isArray(leadData.documents_shared)) {
    errors.push('documents_shared must be an array');
  }
  
  if (leadData.conversion_blockers && !Array.isArray(leadData.conversion_blockers)) {
    errors.push('conversion_blockers must be an array');
  }
  
  // Set default values if not provided
  if (leadData.lead_status === undefined) {
    leadData.lead_status = SchemaConstraints.DEFAULT_VALUES.LEAD_STATUS;
  }
  
  if (leadData.visit_completed === undefined) {
    leadData.visit_completed = SchemaConstraints.DEFAULT_VALUES.VISIT_COMPLETED;
  }
  
  if (leadData.payment_info_collected === undefined) {
    leadData.payment_info_collected = SchemaConstraints.DEFAULT_VALUES.PAYMENT_INFO_COLLECTED;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: leadData
  };
};

/**
 * Get all leads with filtering options
 * @param {Object} filters - Optional query filters
 * @param {String} filters.leadStatus - Filter by lead status
 * @param {String} filters.leadTemperature - Filter by lead temperature (hot, warm, cold)
 * @param {Number} filters.minReadinessScore - Filter by minimum readiness score
 * @param {Boolean} filters.visitCompleted - Filter by visit completion status
 * @param {String} filters.trialStatus - Filter by trial status
 * @param {String} filters.searchTerm - Search by name, email, or phone
 * @param {UUID} filters.assignedTo - Filter by assigned user
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of lead records
 */
exports.getAllLeads = async (filters = {}, pagination = { page: 0, pageSize: 10 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    // Query to get leads with all extensions
    let query = supabase
      .from('persons')
      .select(`
        *,
        lead_extensions (*)
      `)
      .eq('is_lead', true)
      .range(from, to);
    
    // Apply person table filters
    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }
    
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    let filteredLeads = data;
    
    // Apply lead_extensions table filters
    if (filters.leadStatus) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.lead_extensions && 
        lead.lead_extensions.length > 0 && 
        lead.lead_extensions[0].lead_status === filters.leadStatus
      );
    }
    
    if (filters.leadTemperature) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.lead_extensions && 
        lead.lead_extensions.length > 0 && 
        lead.lead_extensions[0].lead_temperature === filters.leadTemperature
      );
    }
    
    if (filters.minReadinessScore !== undefined) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.lead_extensions && 
        lead.lead_extensions.length > 0 && 
        lead.lead_extensions[0].readiness_score >= filters.minReadinessScore
      );
    }
    
    if (filters.visitCompleted !== undefined) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.lead_extensions && 
        lead.lead_extensions.length > 0 && 
        lead.lead_extensions[0].visit_completed === filters.visitCompleted
      );
    }
    
    if (filters.trialStatus) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.lead_extensions && 
        lead.lead_extensions.length > 0 && 
        lead.lead_extensions[0].trial_status === filters.trialStatus
      );
    }
    
    return filteredLeads;
  } catch (error) {
    console.error('Error in getAllLeads:', error);
    throw error;
  }
};

/**
 * Get lead by ID
 * @param {UUID} id - Lead ID (person_id)
 * @returns {Promise<Object>} Lead record
 */
exports.getLeadById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('persons')
      .select(`
        *,
        lead_extensions (*),
        relationships (
          *,
          related_person:person_b_id (id, first_name, last_name, email, phone)
        )
      `)
      .eq('id', id)
      .eq('is_lead', true)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getLeadById:', error);
    throw error;
  }
};

/**
 * Create a new lead
 * @param {Object} personData - Core person data
 * @param {Object} leadExtensionData - Lead-specific data
 * @returns {Promise<Object>} Created lead
 */
exports.createLead = async (personData, leadExtensionData = {}) => {
  try {
    // Validate lead extension data if provided
    if (leadExtensionData.readiness_score !== undefined) {
      if (leadExtensionData.readiness_score < 1 || leadExtensionData.readiness_score > 10) {
        throw new Error('readiness_score must be between 1 and 10');
      }
    }
    
    if (leadExtensionData.conversion_probability !== undefined) {
      if (leadExtensionData.conversion_probability < 0 || leadExtensionData.conversion_probability > 100) {
        throw new Error('conversion_probability must be between 0 and 100');
      }
    }
    
    // Ensure lead flag is set
    const leadPersonData = {
      ...personData,
      is_lead: true
    };
    
    // Set default lead status if not provided
    const leadExtData = {
      ...leadExtensionData,
      lead_status: leadExtensionData.lead_status || 'new'
    };
    
    // Add status history entry if it's a new lead
    if (!leadExtData.status_history || !leadExtData.status_history.length) {
      const now = new Date().toISOString();
      leadExtData.status_history = [{
        status: leadExtData.lead_status,
        timestamp: now,
        notes: 'Lead created'
      }];
    }
    
    // Create person with lead extension
    return await personModel.createPerson(leadPersonData, { leadExtension: leadExtData });
  } catch (error) {
    console.error('Error in createLead:', error);
    throw error;
  }
};

/**
 * Update a lead
 * @param {UUID} id - Lead ID (person_id)
 * @param {Object} personData - Core person data to update
 * @param {Object} leadExtensionData - Lead-specific data to update
 * @returns {Promise<Object>} Updated lead
 */
exports.updateLead = async (id, personData = {}, leadExtensionData = {}) => {
  try {
    // Validate lead extension data if provided
    if (leadExtensionData.readiness_score !== undefined) {
      if (leadExtensionData.readiness_score < 1 || leadExtensionData.readiness_score > 10) {
        throw new Error('readiness_score must be between 1 and 10');
      }
    }
    
    if (leadExtensionData.conversion_probability !== undefined) {
      if (leadExtensionData.conversion_probability < 0 || leadExtensionData.conversion_probability > 100) {
        throw new Error('conversion_probability must be between 0 and 100');
      }
    }
    
    // If updating lead_status, add entry to status_history
    if (leadExtensionData.lead_status) {
      // First get current lead to access current status_history
      const currentLead = await exports.getLeadById(id);
      
      if (currentLead && currentLead.lead_extensions && currentLead.lead_extensions.length > 0) {
        const currentExtension = currentLead.lead_extensions[0];
        const currentStatus = currentExtension.lead_status;
        
        // Only update if status is actually changing
        if (currentStatus !== leadExtensionData.lead_status) {
          const now = new Date().toISOString();
          const currentHistory = currentExtension.status_history || [];
          
          leadExtensionData.status_history = [
            ...currentHistory,
            {
              status: leadExtensionData.lead_status,
              timestamp: now,
              notes: leadExtensionData.statusChangeNotes || `Status changed from ${currentStatus} to ${leadExtensionData.lead_status}`
            }
          ];
          
          // Remove temporary field used only for note creation
          delete leadExtensionData.statusChangeNotes;
        }
      }
    }
    
    // Update the lead (person with lead_extension)
    return await personModel.updatePerson(id, personData, { leadExtension: leadExtensionData });
  } catch (error) {
    console.error('Error in updateLead:', error);
    throw error;
  }
};

/**
 * Delete a lead
 * @param {UUID} id - Lead ID (person_id)
 * @returns {Promise<Boolean>} True if successful
 */
exports.deleteLead = async (id) => {
  try {
    return await personModel.deletePerson(id);
  } catch (error) {
    console.error('Error in deleteLead:', error);
    throw error;
  }
};

/**
 * Get lead counts by status
 * @returns {Promise<Object>} Count of leads by status
 */
exports.getLeadCountsByStatus = async () => {
  try {
    const { data, error } = await supabase
      .from('persons')
      .select(`
        lead_extensions (lead_status)
      `)
      .eq('is_lead', true);
    
    if (error) {
      throw error;
    }
    
    // Count leads by status
    const counts = {};
    data.forEach(person => {
      if (person.lead_extensions && person.lead_extensions.length > 0) {
        const status = person.lead_extensions[0].lead_status;
        counts[status] = (counts[status] || 0) + 1;
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Error in getLeadCountsByStatus:', error);
    throw error;
  }
};

/**
 * Get lead conversion rate
 * @param {Object} filters - Optional query filters
 * @returns {Promise<Object>} Conversion rate statistics
 */
exports.getLeadConversionRate = async (filters = {}) => {
  try {
    let query = supabase
      .from('persons')
      .select(`
        id,
        lead_extensions (conversion_probability)
      `)
      .eq('is_lead', true);
    
    // Apply filters
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    // Apply date range filter if provided
    if (filters.startDate && filters.endDate) {
      query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Calculate conversion metrics
    const total = data.length;
    let highProbabilityCount = 0;
    let avgProbability = 0;
    
    data.forEach(person => {
      if (person.lead_extensions && person.lead_extensions.length > 0) {
        const prob = person.lead_extensions[0].conversion_probability;
        if (prob !== null && prob !== undefined) {
          avgProbability += prob;
          if (prob >= 75) {
            highProbabilityCount++;
          }
        }
      }
    });
    
    return {
      total,
      highProbabilityCount,
      highProbabilityRate: total > 0 ? (highProbabilityCount / total) : 0,
      averageProbability: total > 0 ? (avgProbability / total) : 0
    };
  } catch (error) {
    console.error('Error in getLeadConversionRate:', error);
    throw error;
  }
};

/**
 * Create lead extension
 * @param {Object} leadData - Lead extension data
 * @returns {Promise<Object>} Created lead extension record
 */
exports.createLeadExtension = async (leadData) => {
  try {
    // Validate data
    const validation = exports.validateLeadExtension(leadData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Add timestamps if not provided
    const now = new Date().toISOString();
    const dataWithTimestamps = {
      ...validation.data,
      created_at: leadData.created_at || now,
      updated_at: leadData.updated_at || now
    };
    
    // Add initial status history entry if status is set but history isn't
    if (dataWithTimestamps.lead_status && (!dataWithTimestamps.status_history || dataWithTimestamps.status_history.length === 0)) {
      dataWithTimestamps.status_history = [{
        status: dataWithTimestamps.lead_status,
        timestamp: now,
        notes: 'Initial status'
      }];
    }
    
    const { data, error } = await supabase
      .from('lead_extensions')
      .insert(dataWithTimestamps)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Also update the is_lead flag on the person record
    await supabase
      .from('persons')
      .update({ is_lead: true, updated_at: now })
      .eq('id', leadData.person_id);
    
    return data;
  } catch (error) {
    console.error('Error in createLeadExtension:', error);
    throw error;
  }
};

/**
 * Update lead extension
 * @param {UUID} id - Lead extension ID
 * @param {Object} leadData - Lead extension data to update
 * @returns {Promise<Object>} Updated lead extension record
 */
exports.updateLeadExtension = async (id, leadData) => {
  try {
    // First fetch the current record to merge with updates
    const { data: currentLead, error: fetchError } = await supabase
      .from('lead_extensions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    // Prepare update data by merging with current record
    const updateData = {
      ...currentLead,
      ...leadData
    };
    
    // Validate data
    const validation = exports.validateLeadExtension(updateData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Add updated timestamp
    const now = new Date().toISOString();
    updateData.updated_at = now;
    
    // If lead status has changed, add to status history
    if (leadData.lead_status && leadData.lead_status !== currentLead.lead_status) {
      const statusHistory = updateData.status_history || [];
      statusHistory.push({
        status: leadData.lead_status,
        timestamp: now,
        notes: leadData.status_notes || 'Status updated'
      });
      updateData.status_history = statusHistory;
    }
    
    const { data, error } = await supabase
      .from('lead_extensions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateLeadExtension:', error);
    throw error;
  }
}; 