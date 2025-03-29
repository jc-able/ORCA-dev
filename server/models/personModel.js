/**
 * Person Model
 * Handles database interactions for the unified person model
 */
const supabase = require('../config/supabase');

/**
 * Standard fields for the person model, matching Supabase database structure
 * Used for validation and documentation purposes
 */
exports.personFields = {
  // Basic information
  id: 'uuid',
  first_name: 'text', // NOT NULL constraint in SQL
  last_name: 'text', // NOT NULL constraint in SQL
  email: 'text',
  phone: 'text',
  secondary_phone: 'text',
  address: 'jsonb',
  dob: 'date',
  gender: 'text',
  
  // Contact preferences
  preferred_contact_method: 'text',
  preferred_contact_times: 'jsonb',
  contact_frequency_preference: 'text',
  do_not_contact_until: 'timestamp',
  email_opt_in: 'boolean',
  sms_opt_in: 'boolean',
  social_profiles: 'jsonb',
  
  // Roles and status
  is_lead: 'boolean',
  is_referral: 'boolean',
  is_member: 'boolean',
  active_status: 'boolean',
  
  // Source information
  acquisition_source: 'text',
  acquisition_campaign: 'text',
  acquisition_date: 'timestamp',
  utm_parameters: 'jsonb',
  referral_source: 'text',
  
  // Qualification data
  interest_level: 'text',
  goals: 'text',
  preferred_membership: 'text',
  interested_services: 'text[]',
  preferred_schedule: 'jsonb',
  special_requirements: 'text',
  
  // Financial information
  budget_range: 'text',
  payment_preferences: 'text',
  price_sensitivity: 'text',
  
  // Common fields
  profile_completeness: 'integer',
  tags: 'text[]',
  custom_fields: 'jsonb',
  
  // Meta
  assigned_to: 'uuid',
  created_at: 'timestamp',
  updated_at: 'timestamp',
  last_contacted: 'timestamp',
  next_scheduled_contact: 'timestamp',
  notes: 'text'
};

/**
 * Get all persons with optional filtering
 * @param {Object} filters - Optional query filters
 * @param {Boolean} filters.isLead - Filter for leads
 * @param {Boolean} filters.isReferral - Filter for referrals
 * @param {Boolean} filters.isMember - Filter for members
 * @param {String} filters.searchTerm - Search by name, email, or phone
 * @param {UUID} filters.assignedTo - Filter by assigned user
 * @param {String} filters.acquisitionSource - Filter by acquisition source
 * @param {String} filters.interestLevel - Filter by interest level
 * @param {String} filters.tag - Filter by tag
 * @param {Boolean} filters.activeStatus - Filter by active status
 * @param {Object} pagination - Pagination options
 * @param {Number} pagination.page - Page number (0-indexed)
 * @param {Number} pagination.pageSize - Items per page
 * @returns {Promise<Array>} Array of person records
 */
exports.getAllPersons = async (filters = {}, pagination = { page: 0, pageSize: 10 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('persons')
      .select('*, lead_extensions(*), referral_extensions(*), member_extensions(*)')
      .range(from, to);
    
    // Apply filters
    if (filters.isLead !== undefined) {
      query = query.eq('is_lead', filters.isLead);
    }
    
    if (filters.isReferral !== undefined) {
      query = query.eq('is_referral', filters.isReferral);
    }
    
    if (filters.isMember !== undefined) {
      query = query.eq('is_member', filters.isMember);
    }
    
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    if (filters.acquisitionSource) {
      query = query.eq('acquisition_source', filters.acquisitionSource);
    }
    
    if (filters.interestLevel) {
      query = query.eq('interest_level', filters.interestLevel);
    }
    
    if (filters.tag) {
      query = query.contains('tags', [filters.tag]);
    }
    
    if (filters.activeStatus !== undefined) {
      query = query.eq('active_status', filters.activeStatus);
    }
    
    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getAllPersons:', error);
    throw error;
  }
};

/**
 * Get a person by ID
 * @param {UUID} id - Person ID
 * @returns {Promise<Object>} Person record
 */
exports.getPersonById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('persons')
      .select('*, lead_extensions(*), referral_extensions(*), member_extensions(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getPersonById:', error);
    throw error;
  }
};

/**
 * Create a new person
 * @param {Object} personData - Person data (see personFields for structure)
 * @param {String} personData.first_name - First name (required)
 * @param {String} personData.last_name - Last name (required)
 * @param {String} personData.email - Email address
 * @param {String} personData.phone - Phone number
 * @param {Boolean} personData.is_lead - Is this person a lead
 * @param {Boolean} personData.is_referral - Is this person a referral
 * @param {Boolean} personData.is_member - Is this person a member
 * @param {Object} extensionData - Optional extension data based on person type
 * @returns {Promise<Object>} Created person record
 */
exports.createPerson = async (personData, extensionData = {}) => {
  try {
    // Validate required fields
    if (!personData.first_name || !personData.last_name) {
      throw new Error('first_name and last_name are required fields');
    }
    
    // Add timestamps if not provided
    const now = new Date().toISOString();
    const dataWithTimestamps = {
      ...personData,
      created_at: personData.created_at || now,
      updated_at: personData.updated_at || now
    };
    
    // Start a transaction
    const { data: person, error: personError } = await supabase
      .from('persons')
      .insert(dataWithTimestamps)
      .select()
      .single();
    
    if (personError) {
      throw personError;
    }
    
    // Create extensions if needed
    if (personData.is_lead && extensionData.leadExtension) {
      const leadExtensionData = {
        ...extensionData.leadExtension,
        person_id: person.id,
        created_at: now,
        updated_at: now
      };
      
      // Validate readiness_score constraint if present
      if (leadExtensionData.readiness_score !== undefined && 
          (leadExtensionData.readiness_score < 1 || leadExtensionData.readiness_score > 10)) {
        throw new Error('readiness_score must be between 1 and 10');
      }
      
      // Validate conversion_probability constraint if present
      if (leadExtensionData.conversion_probability !== undefined && 
          (leadExtensionData.conversion_probability < 0 || leadExtensionData.conversion_probability > 100)) {
        throw new Error('conversion_probability must be between 0 and 100');
      }
      
      const { error: leadError } = await supabase
        .from('lead_extensions')
        .insert(leadExtensionData);
      
      if (leadError) {
        throw leadError;
      }
    }
    
    if (personData.is_referral && extensionData.referralExtension) {
      const referralExtensionData = {
        ...extensionData.referralExtension,
        person_id: person.id,
        created_at: now,
        updated_at: now
      };
      
      // Validate conversion_probability constraint if present
      if (referralExtensionData.conversion_probability !== undefined && 
          (referralExtensionData.conversion_probability < 0 || referralExtensionData.conversion_probability > 100)) {
        throw new Error('conversion_probability must be between 0 and 100');
      }
      
      const { error: referralError } = await supabase
        .from('referral_extensions')
        .insert(referralExtensionData);
      
      if (referralError) {
        throw referralError;
      }
    }
    
    if (personData.is_member && extensionData.memberExtension) {
      const memberExtensionData = {
        ...extensionData.memberExtension,
        person_id: person.id,
        created_at: now,
        updated_at: now
      };
      
      // Validate billing_day constraint if present
      if (memberExtensionData.billing_day !== undefined && 
          (memberExtensionData.billing_day < 1 || memberExtensionData.billing_day > 31)) {
        throw new Error('billing_day must be between 1 and 31');
      }
      
      // Validate satisfaction_score constraint if present
      if (memberExtensionData.satisfaction_score !== undefined && 
          (memberExtensionData.satisfaction_score < 1 || memberExtensionData.satisfaction_score > 10)) {
        throw new Error('satisfaction_score must be between 1 and 10');
      }
      
      const { error: memberError } = await supabase
        .from('member_extensions')
        .insert(memberExtensionData);
      
      if (memberError) {
        throw memberError;
      }
    }
    
    // Return the created person with extensions
    return await exports.getPersonById(person.id);
  } catch (error) {
    console.error('Error in createPerson:', error);
    throw error;
  }
};

/**
 * Update a person
 * @param {UUID} id - Person ID
 * @param {Object} personData - Person data to update
 * @param {Object} extensionData - Optional extension data to update
 * @returns {Promise<Object>} Updated person record
 */
exports.updatePerson = async (id, personData, extensionData = {}) => {
  try {
    // Add updated timestamp
    const now = new Date().toISOString();
    const dataWithTimestamp = {
      ...personData,
      updated_at: now
    };
    
    // Update person
    const { error: personError } = await supabase
      .from('persons')
      .update(dataWithTimestamp)
      .eq('id', id);
    
    if (personError) {
      throw personError;
    }
    
    // Update extensions if provided
    if (extensionData.leadExtension) {
      // Validate constraints
      if (extensionData.leadExtension.readiness_score !== undefined && 
          (extensionData.leadExtension.readiness_score < 1 || extensionData.leadExtension.readiness_score > 10)) {
        throw new Error('readiness_score must be between 1 and 10');
      }
      
      if (extensionData.leadExtension.conversion_probability !== undefined && 
          (extensionData.leadExtension.conversion_probability < 0 || extensionData.leadExtension.conversion_probability > 100)) {
        throw new Error('conversion_probability must be between 0 and 100');
      }
      
      const { error: leadError } = await supabase
        .from('lead_extensions')
        .update({
          ...extensionData.leadExtension,
          updated_at: now
        })
        .eq('person_id', id);
      
      if (leadError) {
        throw leadError;
      }
    }
    
    if (extensionData.referralExtension) {
      // Validate conversion_probability constraint
      if (extensionData.referralExtension.conversion_probability !== undefined && 
          (extensionData.referralExtension.conversion_probability < 0 || extensionData.referralExtension.conversion_probability > 100)) {
        throw new Error('conversion_probability must be between 0 and 100');
      }
      
      const { error: referralError } = await supabase
        .from('referral_extensions')
        .update({
          ...extensionData.referralExtension,
          updated_at: now
        })
        .eq('person_id', id);
      
      if (referralError) {
        throw referralError;
      }
    }
    
    if (extensionData.memberExtension) {
      // Validate constraints
      if (extensionData.memberExtension.billing_day !== undefined && 
          (extensionData.memberExtension.billing_day < 1 || extensionData.memberExtension.billing_day > 31)) {
        throw new Error('billing_day must be between 1 and 31');
      }
      
      if (extensionData.memberExtension.satisfaction_score !== undefined && 
          (extensionData.memberExtension.satisfaction_score < 1 || extensionData.memberExtension.satisfaction_score > 10)) {
        throw new Error('satisfaction_score must be between 1 and 10');
      }
      
      const { error: memberError } = await supabase
        .from('member_extensions')
        .update({
          ...extensionData.memberExtension,
          updated_at: now
        })
        .eq('person_id', id);
      
      if (memberError) {
        throw memberError;
      }
    }
    
    // Return the updated person with extensions
    return await exports.getPersonById(id);
  } catch (error) {
    console.error('Error in updatePerson:', error);
    throw error;
  }
};

/**
 * Delete a person
 * @param {UUID} id - Person ID
 * @returns {Promise<Boolean>} True if successful
 */
exports.deletePerson = async (id) => {
  try {
    // Extensions will be cascaded due to ON DELETE CASCADE
    const { error } = await supabase
      .from('persons')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deletePerson:', error);
    throw error;
  }
};

/**
 * Count persons with optional filtering
 * @param {Object} filters - Optional query filters (same as getAllPersons)
 * @returns {Promise<Number>} Total count of matching persons
 */
exports.countPersons = async (filters = {}) => {
  try {
    let query = supabase
      .from('persons')
      .select('id', { count: 'exact' });
    
    // Apply the same filters as getAllPersons
    if (filters.isLead !== undefined) {
      query = query.eq('is_lead', filters.isLead);
    }
    
    if (filters.isReferral !== undefined) {
      query = query.eq('is_referral', filters.isReferral);
    }
    
    if (filters.isMember !== undefined) {
      query = query.eq('is_member', filters.isMember);
    }
    
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    if (filters.acquisitionSource) {
      query = query.eq('acquisition_source', filters.acquisitionSource);
    }
    
    if (filters.interestLevel) {
      query = query.eq('interest_level', filters.interestLevel);
    }
    
    if (filters.tag) {
      query = query.contains('tags', [filters.tag]);
    }
    
    if (filters.activeStatus !== undefined) {
      query = query.eq('active_status', filters.activeStatus);
    }
    
    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }
    
    const { count, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return count;
  } catch (error) {
    console.error('Error in countPersons:', error);
    throw error;
  }
};

/**
 * Get distinct values for a specific field
 * @param {String} field - The field to get distinct values for
 * @returns {Promise<Array>} Array of distinct values
 */
exports.getDistinctValues = async (field) => {
  try {
    // Use the personFields map to validate the field exists
    if (!exports.personFields[field]) {
      throw new Error(`Invalid field: ${field}`);
    }
    
    // For array or jsonb types, we can't directly get distinct values
    if (['array', 'jsonb', 'text[]'].includes(exports.personFields[field])) {
      throw new Error(`Cannot get distinct values for ${exports.personFields[field]} type field: ${field}`);
    }
    
    const { data, error } = await supabase
      .from('persons')
      .select(field)
      .not(field, 'is', null);
    
    if (error) {
      throw error;
    }
    
    // Extract unique values
    const values = [...new Set(data.map(item => item[field]))];
    return values.sort();
  } catch (error) {
    console.error(`Error in getDistinctValues for field ${field}:`, error);
    throw error;
  }
}; 