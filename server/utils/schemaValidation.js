/**
 * Schema Validation Utilities
 * Comprehensive validation utilities that enforce database schema constraints
 * This file provides validation functions that ensure data consistency with the database schema
 */

// Import the schema constraints from types.ts
// Note: We're importing constraints programmatically since we can't directly import TypeScript
// interfaces in JavaScript files
const SchemaConstraints = {
  LEAD_EXTENSION: {
    READINESS_SCORE_MIN: 1,
    READINESS_SCORE_MAX: 10,
    CONVERSION_PROBABILITY_MIN: 0,
    CONVERSION_PROBABILITY_MAX: 100
  },
  REFERRAL_EXTENSION: {
    CONVERSION_PROBABILITY_MIN: 0,
    CONVERSION_PROBABILITY_MAX: 100
  },
  MEMBER_EXTENSION: {
    BILLING_DAY_MIN: 1,
    BILLING_DAY_MAX: 31,
    SATISFACTION_SCORE_MIN: 1,
    SATISFACTION_SCORE_MAX: 10
  },
  RELATIONSHIP: {
    ATTRIBUTION_PERCENTAGE_MIN: 0,
    ATTRIBUTION_PERCENTAGE_MAX: 100,
    RELATIONSHIP_LEVEL_MIN: 1
  }
};

/**
 * UUID Validation
 * Validates if a string is a valid UUID
 * @param {string} uuid - The UUID to validate
 * @returns {boolean} Whether the string is a valid UUID
 */
function isValidUUID(uuid) {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Numeric Range Validation
 * Validates if a number is within a specified range
 * @param {number} value - The number to validate
 * @param {number} min - The minimum allowed value (inclusive)
 * @param {number} max - The maximum allowed value (inclusive)
 * @returns {boolean} Whether the number is within the specified range
 */
function isInRange(value, min, max) {
  if (value === undefined || value === null) return true;
  if (isNaN(value)) return false;
  return value >= min && value <= max;
}

/**
 * JSON validation
 * Validates if a string can be parsed as JSON or if an object is valid JSON
 * @param {string|object} value - The value to validate
 * @returns {boolean} Whether the value is valid JSON
 */
function isValidJSON(value) {
  if (!value) return true;
  if (typeof value === 'object') return true;
  if (typeof value !== 'string') return false;
  
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Array validation
 * Validates if a value is an array
 * @param {any} value - The value to validate
 * @returns {boolean} Whether the value is an array
 */
function isValidArray(value) {
  if (value === undefined || value === null) return true;
  return Array.isArray(value);
}

/**
 * Date validation
 * Validates if a string is a valid date
 * @param {string} date - The date string to validate
 * @returns {boolean} Whether the string is a valid date
 */
function isValidDate(date) {
  if (!date) return true;
  const timestamp = Date.parse(date);
  return !isNaN(timestamp);
}

/**
 * Email validation
 * Validates if a string is a valid email address
 * @param {string} email - The email to validate
 * @returns {boolean} Whether the string is a valid email
 */
function isValidEmail(email) {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============= Person Schema Validation =============

/**
 * Validates a person object against the database schema constraints
 * @param {Object} data - The person data to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
function validatePersonSchema(data) {
  const errors = [];
  
  // Required fields
  if (!data.first_name) {
    errors.push('first_name is required');
  }
  
  if (!data.last_name) {
    errors.push('last_name is required');
  }
  
  // Email validation
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  // UUID validation for assigned_to
  if (data.assigned_to && !isValidUUID(data.assigned_to)) {
    errors.push('assigned_to must be a valid UUID');
  }
  
  // JSON validation
  const jsonFields = ['address', 'preferred_contact_times', 'social_profiles', 'utm_parameters', 
                      'preferred_schedule', 'custom_fields'];
  
  jsonFields.forEach(field => {
    if (data[field] && !isValidJSON(data[field])) {
      errors.push(`${field} must be valid JSON`);
    }
  });
  
  // Array validation
  const arrayFields = ['interested_services', 'tags'];
  
  arrayFields.forEach(field => {
    if (data[field] && !isValidArray(data[field])) {
      errors.push(`${field} must be an array`);
    }
  });
  
  // Date validation
  const dateFields = ['dob', 'do_not_contact_until', 'acquisition_date', 
                      'created_at', 'updated_at', 'last_contacted', 'next_scheduled_contact'];
  
  dateFields.forEach(field => {
    if (data[field] && !isValidDate(data[field])) {
      errors.push(`${field} must be a valid date`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============= Lead Extension Schema Validation =============

/**
 * Validates a lead extension object against the database schema constraints
 * @param {Object} data - The lead extension data to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
function validateLeadExtensionSchema(data) {
  const errors = [];
  
  // Required fields
  if (!data.person_id) {
    errors.push('person_id is required');
  } else if (!isValidUUID(data.person_id)) {
    errors.push('person_id must be a valid UUID');
  }
  
  // Numeric range validations
  if (!isInRange(data.readiness_score, 
                SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN, 
                SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX)) {
    errors.push(`readiness_score must be between ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN} and ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX}`);
  }
  
  if (!isInRange(data.conversion_probability, 
                SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN, 
                SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX)) {
    errors.push(`conversion_probability must be between ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN} and ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX}`);
  }
  
  // Array validation
  const arrayFields = ['competitor_considerations', 'pain_points', 'motivations', 
                      'objections', 'status_history', 'documents_shared', 'conversion_blockers'];
  
  arrayFields.forEach(field => {
    if (data[field] && !isValidArray(data[field])) {
      errors.push(`${field} must be an array`);
    }
  });
  
  // JSON validation
  const jsonFields = ['stage_duration_days', 'forms_completed'];
  
  jsonFields.forEach(field => {
    if (data[field] && !isValidJSON(data[field])) {
      errors.push(`${field} must be valid JSON`);
    }
  });
  
  // Date validation
  const dateFields = ['visit_date', 'trial_start_date', 'trial_end_date', 'created_at', 'updated_at'];
  
  dateFields.forEach(field => {
    if (data[field] && !isValidDate(data[field])) {
      errors.push(`${field} must be a valid date`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============= Referral Extension Schema Validation =============

/**
 * Validates a referral extension object against the database schema constraints
 * @param {Object} data - The referral extension data to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
function validateReferralExtensionSchema(data) {
  const errors = [];
  
  // Required fields
  if (!data.person_id) {
    errors.push('person_id is required');
  } else if (!isValidUUID(data.person_id)) {
    errors.push('person_id must be a valid UUID');
  }
  
  // Numeric range validations
  if (!isInRange(data.conversion_probability, 
                SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MIN, 
                SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MAX)) {
    errors.push(`conversion_probability must be between ${SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MIN} and ${SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MAX}`);
  }
  
  // Array validation
  const arrayFields = ['status_history', 'eligible_incentives', 'incentives_awarded', 
                      'marketing_materials_sent', 'campaign_enrollments'];
  
  arrayFields.forEach(field => {
    if (data[field] && !isValidArray(data[field])) {
      errors.push(`${field} must be an array`);
    }
  });
  
  // JSON validation
  const jsonFields = ['time_in_stage_days', 'nurture_sequence_status'];
  
  jsonFields.forEach(field => {
    if (data[field] && !isValidJSON(data[field])) {
      errors.push(`${field} must be valid JSON`);
    }
  });
  
  // Date validation
  const dateFields = ['appointment_date', 'conversion_date', 'created_at', 'updated_at'];
  
  dateFields.forEach(field => {
    if (data[field] && !isValidDate(data[field])) {
      errors.push(`${field} must be a valid date`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============= Member Extension Schema Validation =============

/**
 * Validates a member extension object against the database schema constraints
 * @param {Object} data - The member extension data to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
function validateMemberExtensionSchema(data) {
  const errors = [];
  
  // Required fields
  if (!data.person_id) {
    errors.push('person_id is required');
  } else if (!isValidUUID(data.person_id)) {
    errors.push('person_id must be a valid UUID');
  }
  
  // Numeric range validations
  if (!isInRange(data.billing_day, 
                SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MIN, 
                SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MAX)) {
    errors.push(`billing_day must be between ${SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MIN} and ${SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MAX}`);
  }
  
  if (!isInRange(data.satisfaction_score, 
                SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MIN, 
                SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MAX)) {
    errors.push(`satisfaction_score must be between ${SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MIN} and ${SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MAX}`);
  }
  
  // Array validation
  const arrayFields = ['classes_attended', 'retention_actions'];
  
  arrayFields.forEach(field => {
    if (data[field] && !isValidArray(data[field])) {
      errors.push(`${field} must be an array`);
    }
  });
  
  // Date validation
  const dateFields = ['join_date', 'membership_end_date', 'last_check_in', 'created_at', 'updated_at'];
  
  dateFields.forEach(field => {
    if (data[field] && !isValidDate(data[field])) {
      errors.push(`${field} must be a valid date`);
    }
  });
  
  // Numeric validations for monetary values
  const monetaryFields = ['lifetime_value', 'current_monthly_spend', 'referral_rewards_earned'];
  
  monetaryFields.forEach(field => {
    if (data[field] !== undefined && isNaN(Number(data[field]))) {
      errors.push(`${field} must be a number`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============= Relationship Schema Validation =============

/**
 * Validates a relationship object against the database schema constraints
 * @param {Object} data - The relationship data to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
function validateRelationshipSchema(data) {
  const errors = [];
  
  // Required fields
  if (!data.person_a_id) {
    errors.push('person_a_id is required');
  } else if (!isValidUUID(data.person_a_id)) {
    errors.push('person_a_id must be a valid UUID');
  }
  
  if (!data.person_b_id) {
    errors.push('person_b_id is required');
  } else if (!isValidUUID(data.person_b_id)) {
    errors.push('person_b_id must be a valid UUID');
  }
  
  if (!data.relationship_type) {
    errors.push('relationship_type is required');
  }
  
  // Numeric range validations
  if (!isInRange(data.attribution_percentage, 
                SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MIN, 
                SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MAX)) {
    errors.push(`attribution_percentage must be between ${SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MIN} and ${SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MAX}`);
  }
  
  if (data.relationship_level && data.relationship_level < SchemaConstraints.RELATIONSHIP.RELATIONSHIP_LEVEL_MIN) {
    errors.push(`relationship_level must be at least ${SchemaConstraints.RELATIONSHIP.RELATIONSHIP_LEVEL_MIN}`);
  }
  
  // Date validation
  const dateFields = ['referral_date', 'created_at', 'updated_at'];
  
  dateFields.forEach(field => {
    if (data[field] && !isValidDate(data[field])) {
      errors.push(`${field} must be a valid date`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============= Interaction Schema Validation =============

/**
 * Validates an interaction object against the database schema constraints
 * @param {Object} data - The interaction data to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
function validateInteractionSchema(data) {
  const errors = [];
  
  // Required fields
  if (!data.person_id) {
    errors.push('person_id is required');
  } else if (!isValidUUID(data.person_id)) {
    errors.push('person_id must be a valid UUID');
  }
  
  // UUID validation
  if (data.user_id && !isValidUUID(data.user_id)) {
    errors.push('user_id must be a valid UUID');
  }
  
  // Array validation
  if (data.attachments && !isValidArray(data.attachments)) {
    errors.push('attachments must be an array');
  }
  
  // Date validation
  const dateFields = ['scheduled_at', 'completed_at', 'response_date', 'created_at', 'updated_at'];
  
  dateFields.forEach(field => {
    if (data[field] && !isValidDate(data[field])) {
      errors.push(`${field} must be a valid date`);
    }
  });
  
  // JSON validation
  if (data.custom_fields && !isValidJSON(data.custom_fields)) {
    errors.push('custom_fields must be valid JSON');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============= Message Schema Validation =============

/**
 * Validates a message object against the database schema constraints
 * @param {Object} data - The message data to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
function validateMessageSchema(data) {
  const errors = [];
  
  // Required fields
  if (!data.sender_id) {
    errors.push('sender_id is required');
  } else if (!isValidUUID(data.sender_id)) {
    errors.push('sender_id must be a valid UUID');
  }
  
  if (!data.recipient_id) {
    errors.push('recipient_id is required');
  } else if (!isValidUUID(data.recipient_id)) {
    errors.push('recipient_id must be a valid UUID');
  }
  
  if (!data.message_type) {
    errors.push('message_type is required');
  }
  
  if (!data.content) {
    errors.push('content is required');
  }
  
  // UUID validation
  if (data.blast_id && !isValidUUID(data.blast_id)) {
    errors.push('blast_id must be a valid UUID');
  }
  
  if (data.template_id && !isValidUUID(data.template_id)) {
    errors.push('template_id must be a valid UUID');
  }
  
  if (data.response_id && !isValidUUID(data.response_id)) {
    errors.push('response_id must be a valid UUID');
  }
  
  // JSON validation
  const jsonFields = ['personalization_data', 'metadata'];
  
  jsonFields.forEach(field => {
    if (data[field] && !isValidJSON(data[field])) {
      errors.push(`${field} must be valid JSON`);
    }
  });
  
  // Date validation
  const dateFields = ['sent_at', 'delivered_at', 'read_at', 'created_at', 'updated_at'];
  
  dateFields.forEach(field => {
    if (data[field] && !isValidDate(data[field])) {
      errors.push(`${field} must be a valid date`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============= User Schema Validation =============

/**
 * Validates a user object against the database schema constraints
 * @param {Object} data - The user data to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
function validateUserSchema(data) {
  const errors = [];
  
  // Required fields
  if (!data.email) {
    errors.push('email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!data.password && !data.id) {
    errors.push('password is required for new users');
  }
  
  // Role validation
  if (data.role && !['admin', 'salesperson'].includes(data.role)) {
    errors.push('role must be either "admin" or "salesperson"');
  }
  
  // JSON validation
  if (data.settings && !isValidJSON(data.settings)) {
    errors.push('settings must be valid JSON');
  }
  
  // Date validation
  const dateFields = ['last_login', 'created_at', 'updated_at'];
  
  dateFields.forEach(field => {
    if (data[field] && !isValidDate(data[field])) {
      errors.push(`${field} must be a valid date`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Export all validation functions
module.exports = {
  // Helper functions
  isValidUUID,
  isInRange,
  isValidJSON,
  isValidArray,
  isValidDate,
  isValidEmail,
  
  // Schema validation functions
  validatePersonSchema,
  validateLeadExtensionSchema,
  validateReferralExtensionSchema,
  validateMemberExtensionSchema,
  validateRelationshipSchema,
  validateInteractionSchema,
  validateMessageSchema,
  validateUserSchema,
  
  // Schema constraints
  SchemaConstraints
}; 