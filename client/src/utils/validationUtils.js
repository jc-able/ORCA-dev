/**
 * Validation Utilities
 * 
 * This file contains validation utilities for form inputs based on the database schema constraints.
 * These functions are used across the application to ensure data integrity.
 */
import { SchemaConstraints } from '../types/schema';

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  // Phone validation regex - accepts formats like (123) 456-7890, 123-456-7890, etc.
  PHONE: /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
  
  // Email validation regex
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  
  // UUID validation regex
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  
  // Date validation regex (YYYY-MM-DD)
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  
  // URL validation regex
  URL: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/,
  
  // ZIP code validation regex
  ZIP_CODE: /^\d{5}(-\d{4})?$/
};

/**
 * Default values based on SQL schema constraints
 */
export const DefaultValues = {
  // Default values for fields with DEFAULT constraints in SQL
  LEAD_STATUS: SchemaConstraints.DEFAULT_VALUES.LEAD_STATUS,
  REFERRAL_STATUS: SchemaConstraints.DEFAULT_VALUES.REFERRAL_STATUS,
  RELATIONSHIP_STATUS: SchemaConstraints.DEFAULT_VALUES.RELATIONSHIP_STATUS,
  RELATIONSHIP_LEVEL: SchemaConstraints.DEFAULT_VALUES.RELATIONSHIP_LEVEL,
  ATTRIBUTION_PERCENTAGE: SchemaConstraints.DEFAULT_VALUES.ATTRIBUTION_PERCENTAGE,
  INTERACTION_STATUS: SchemaConstraints.DEFAULT_VALUES.INTERACTION_STATUS,
  MESSAGE_STATUS: SchemaConstraints.DEFAULT_VALUES.MESSAGE_STATUS,
  
  // Person defaults
  EMAIL_OPT_IN: true,
  SMS_OPT_IN: true,
  ACTIVE_STATUS: true,
  IS_LEAD: false,
  IS_REFERRAL: false,
  IS_MEMBER: false,
  PROFILE_COMPLETENESS: 0,
  
  // Lead defaults
  VISIT_COMPLETED: SchemaConstraints.DEFAULT_VALUES.VISIT_COMPLETED,
  PAYMENT_INFO_COLLECTED: SchemaConstraints.DEFAULT_VALUES.PAYMENT_INFO_COLLECTED,
  READINESS_SCORE: 5,
  LEAD_TEMPERATURE: 'warm',
  CONVERSION_PROBABILITY: 50,
  
  // Member defaults
  CHECK_IN_COUNT: SchemaConstraints.DEFAULT_VALUES.CHECK_IN_COUNT,
  ATTENDANCE_STREAK: SchemaConstraints.DEFAULT_VALUES.ATTENDANCE_STREAK,
  REFERRAL_COUNT: SchemaConstraints.DEFAULT_VALUES.REFERRAL_COUNT,
  SUCCESSFUL_REFERRALS: SchemaConstraints.DEFAULT_VALUES.SUCCESSFUL_REFERRALS,
  REFERRAL_REWARDS_EARNED: SchemaConstraints.DEFAULT_VALUES.REFERRAL_REWARDS_EARNED
};

/**
 * Required field validation
 * @param {any} value - The field value to validate
 * @param {string} fieldName - The name of the field for the error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Email validation
 * @param {string} email - Email address to validate
 * @param {boolean} isRequired - Whether the field is required
 * @returns {string|null} - Error message or null if valid
 */
export const validateEmail = (email, isRequired = true) => {
  if (isRequired && (!email || email.trim() === '')) {
    return 'Email is required';
  }
  
  if (email && !ValidationPatterns.EMAIL.test(email)) {
    return 'Invalid email format';
  }
  
  return null;
};

/**
 * Phone number validation
 * @param {string} phone - Phone number to validate
 * @param {boolean} isRequired - Whether the field is required
 * @returns {string|null} - Error message or null if valid
 */
export const validatePhone = (phone, isRequired = true) => {
  if (isRequired && (!phone || phone.trim() === '')) {
    return 'Phone number is required';
  }
  
  if (phone && !ValidationPatterns.PHONE.test(phone)) {
    return 'Invalid phone number format';
  }
  
  return null;
};

/**
 * Number range validation
 * @param {number} value - Number to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - The name of the field for the error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateNumberRange = (value, min, max, fieldName) => {
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return `${fieldName} must be a number`;
  }
  
  if (numValue < min || numValue > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  
  return null;
};

/**
 * URL validation
 * @param {string} url - URL to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateUrl = (url) => {
  if (!url) return null; // URLs are typically optional
  if (!ValidationPatterns.URL.test(url)) return 'Invalid URL format';
  return null;
};

/**
 * Lead extension field validations
 */
export const LeadValidation = {
  /**
   * Validate readiness score (1-10)
   * @param {number} score - Readiness score to validate
   * @returns {string|null} - Error message or null if valid
   */
  readinessScore: (score) => {
    return validateNumberRange(
      score, 
      SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN,
      SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX,
      'Readiness score'
    );
  },
  
  /**
   * Validate conversion probability (0-100)
   * @param {number} probability - Conversion probability to validate
   * @returns {string|null} - Error message or null if valid
   */
  conversionProbability: (probability) => {
    return validateNumberRange(
      probability,
      SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN,
      SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX,
      'Conversion probability'
    );
  },
  
  /**
   * Get default values for lead extension fields
   * @returns {Object} Default values for lead extension fields
   */
  getDefaultValues: () => {
    return {
      lead_status: DefaultValues.LEAD_STATUS,
      visit_completed: SchemaConstraints.DEFAULT_VALUES.VISIT_COMPLETED,
      payment_info_collected: SchemaConstraints.DEFAULT_VALUES.PAYMENT_INFO_COLLECTED,
      readiness_score: 5, // Reasonable default within the constraint range
      conversion_probability: 50 // Reasonable default within the constraint range
    };
  }
};

/**
 * Member extension field validations
 */
export const MemberValidation = {
  /**
   * Validate billing day (1-31)
   * @param {number} day - Billing day to validate
   * @returns {string|null} - Error message or null if valid
   */
  billingDay: (day) => {
    return validateNumberRange(
      day,
      SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MIN,
      SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MAX,
      'Billing day'
    );
  },
  
  /**
   * Validate satisfaction score (1-10)
   * @param {number} score - Satisfaction score to validate
   * @returns {string|null} - Error message or null if valid
   */
  satisfactionScore: (score) => {
    return validateNumberRange(
      score,
      SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MIN,
      SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MAX,
      'Satisfaction score'
    );
  },
  
  /**
   * Get default values for member extension fields
   * @returns {Object} Default values for member extension fields
   */
  getDefaultValues: () => {
    return {
      check_in_count: SchemaConstraints.DEFAULT_VALUES.CHECK_IN_COUNT,
      attendance_streak: SchemaConstraints.DEFAULT_VALUES.ATTENDANCE_STREAK,
      referral_count: SchemaConstraints.DEFAULT_VALUES.REFERRAL_COUNT,
      successful_referrals: SchemaConstraints.DEFAULT_VALUES.SUCCESSFUL_REFERRALS,
      referral_rewards_earned: SchemaConstraints.DEFAULT_VALUES.REFERRAL_REWARDS_EARNED,
      satisfaction_score: 5 // Reasonable default within the constraint range
    };
  }
};

/**
 * Referral extension field validations
 */
export const ReferralValidation = {
  /**
   * Validate conversion probability (0-100)
   * @param {number} probability - Conversion probability to validate
   * @returns {string|null} - Error message or null if valid
   */
  conversionProbability: (probability) => {
    return validateNumberRange(
      probability,
      SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MIN,
      SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MAX,
      'Conversion probability'
    );
  },
  
  /**
   * Get default values for referral extension fields
   * @returns {Object} Default values for referral extension fields
   */
  getDefaultValues: () => {
    return {
      referral_status: DefaultValues.REFERRAL_STATUS,
      conversion_probability: 50 // Reasonable default within the constraint range
    };
  }
};

/**
 * Relationship field validations
 */
export const RelationshipValidation = {
  /**
   * Validate attribution percentage (0-100)
   * @param {number} percentage - Attribution percentage to validate
   * @returns {string|null} - Error message or null if valid
   */
  attributionPercentage: (percentage) => {
    return validateNumberRange(
      percentage,
      SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MIN,
      SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MAX,
      'Attribution percentage'
    );
  },
  
  /**
   * Validate relationship level (>= 1)
   * @param {number} level - Relationship level to validate
   * @returns {string|null} - Error message or null if valid
   */
  relationshipLevel: (level) => {
    const numLevel = Number(level);
    
    if (isNaN(numLevel)) {
      return 'Relationship level must be a number';
    }
    
    if (numLevel < SchemaConstraints.RELATIONSHIP.RELATIONSHIP_LEVEL_MIN) {
      return `Relationship level must be at least ${SchemaConstraints.RELATIONSHIP.RELATIONSHIP_LEVEL_MIN}`;
    }
    
    return null;
  },
  
  /**
   * Get default values for relationship fields
   * @returns {Object} Default values for relationship fields
   */
  getDefaultValues: () => {
    return {
      status: DefaultValues.RELATIONSHIP_STATUS,
      relationship_level: DefaultValues.RELATIONSHIP_LEVEL,
      attribution_percentage: DefaultValues.ATTRIBUTION_PERCENTAGE,
      is_primary_referrer: SchemaConstraints.DEFAULT_VALUES.IS_PRIMARY_REFERRER
    };
  }
};

/**
 * Person field validations
 */
export const PersonValidation = {
  /**
   * Validate core person fields
   * @param {Object} person - Person object to validate
   * @returns {Object} - Object with field errors
   */
  validatePerson: (person) => {
    const errors = {};
    
    // Required fields
    const firstNameError = validateRequired(person.first_name, 'First name');
    if (firstNameError) errors.first_name = firstNameError;
    
    const lastNameError = validateRequired(person.last_name, 'Last name');
    if (lastNameError) errors.last_name = lastNameError;
    
    // Optional fields with format validation
    if (person.email) {
      const emailError = validateEmail(person.email, false);
      if (emailError) errors.email = emailError;
    }
    
    if (person.phone) {
      const phoneError = validatePhone(person.phone, false);
      if (phoneError) errors.phone = phoneError;
    }
    
    return errors;
  }
};

/**
 * Validation Utilities
 * 
 * Client-side validation functions to enforce database schema constraints
 */
// Keep only one import of SchemaConstraints
// import { SchemaConstraints } from '../types/interfaces.js';

/**
 * Validates lead extension data against schema constraints
 * @param {Object} leadData - The lead extension data to validate
 * @returns {Object} Object with isValid and errors properties
 */
export const validateLeadExtension = (leadData) => {
  const errors = [];
  
  // Validate readiness_score against constraints
  if (leadData.readiness_score !== undefined) {
    if (typeof leadData.readiness_score !== 'number') {
      errors.push('Readiness score must be a number');
    } else if (leadData.readiness_score < SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN || 
               leadData.readiness_score > SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX) {
      errors.push(`Readiness score must be between ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN} and ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX}`);
    }
  }
  
  // Validate conversion_probability against constraints
  if (leadData.conversion_probability !== undefined) {
    if (typeof leadData.conversion_probability !== 'number') {
      errors.push('Conversion probability must be a number');
    } else if (leadData.conversion_probability < SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN || 
               leadData.conversion_probability > SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX) {
      errors.push(`Conversion probability must be between ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN} and ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX}`);
    }
  }
  
  // Set default values if not provided
  const validatedData = { ...leadData };
  
  if (validatedData.lead_status === undefined) {
    validatedData.lead_status = SchemaConstraints.DEFAULT_VALUES.LEAD_STATUS;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData
  };
};

/**
 * Validates referral extension data against schema constraints
 * @param {Object} referralData - The referral extension data to validate
 * @returns {Object} Object with isValid and errors properties
 */
export const validateReferralExtension = (referralData) => {
  const errors = [];
  
  // Validate conversion_probability against constraints
  if (referralData.conversion_probability !== undefined) {
    if (typeof referralData.conversion_probability !== 'number') {
      errors.push('Conversion probability must be a number');
    } else if (referralData.conversion_probability < SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MIN || 
               referralData.conversion_probability > SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MAX) {
      errors.push(`Conversion probability must be between ${SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MIN} and ${SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MAX}`);
    }
  }
  
  // Set default values if not provided
  const validatedData = { ...referralData };
  
  if (validatedData.referral_status === undefined) {
    validatedData.referral_status = SchemaConstraints.DEFAULT_VALUES.REFERRAL_STATUS;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData
  };
};

/**
 * Validates member extension data against schema constraints
 * @param {Object} memberData - The member extension data to validate
 * @returns {Object} Object with isValid and errors properties
 */
export const validateMemberExtension = (memberData) => {
  const errors = [];
  
  // Validate billing_day against constraints
  if (memberData.billing_day !== undefined) {
    if (typeof memberData.billing_day !== 'number') {
      errors.push('Billing day must be a number');
    } else if (memberData.billing_day < SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MIN || 
               memberData.billing_day > SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MAX) {
      errors.push(`Billing day must be between ${SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MIN} and ${SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MAX}`);
    }
  }
  
  // Validate satisfaction_score against constraints
  if (memberData.satisfaction_score !== undefined) {
    if (typeof memberData.satisfaction_score !== 'number') {
      errors.push('Satisfaction score must be a number');
    } else if (memberData.satisfaction_score < SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MIN || 
               memberData.satisfaction_score > SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MAX) {
      errors.push(`Satisfaction score must be between ${SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MIN} and ${SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MAX}`);
    }
  }
  
  // Set default values if not provided
  const validatedData = { ...memberData };
  
  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData
  };
};

/**
 * Validates relationship data against schema constraints
 * @param {Object} relationshipData - The relationship data to validate
 * @returns {Object} Object with isValid and errors properties
 */
export const validateRelationship = (relationshipData) => {
  const errors = [];
  
  // Check required fields
  if (!relationshipData.person_a_id) {
    errors.push('Person A ID is required');
  }
  
  if (!relationshipData.person_b_id) {
    errors.push('Person B ID is required');
  }
  
  if (!relationshipData.relationship_type) {
    errors.push('Relationship type is required');
  }
  
  // Validate attribution_percentage against constraints
  if (relationshipData.attribution_percentage !== undefined) {
    if (typeof relationshipData.attribution_percentage !== 'number') {
      errors.push('Attribution percentage must be a number');
    } else if (relationshipData.attribution_percentage < SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MIN || 
               relationshipData.attribution_percentage > SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MAX) {
      errors.push(`Attribution percentage must be between ${SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MIN} and ${SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MAX}`);
    }
  }
  
  // Validate relationship_level against constraints
  if (relationshipData.relationship_level !== undefined) {
    if (typeof relationshipData.relationship_level !== 'number') {
      errors.push('Relationship level must be a number');
    } else if (relationshipData.relationship_level < SchemaConstraints.RELATIONSHIP.RELATIONSHIP_LEVEL_MIN) {
      errors.push(`Relationship level must be at least ${SchemaConstraints.RELATIONSHIP.RELATIONSHIP_LEVEL_MIN}`);
    }
  }
  
  // Set default values if not provided
  const validatedData = { ...relationshipData };
  
  if (validatedData.status === undefined) {
    validatedData.status = SchemaConstraints.DEFAULT_VALUES.RELATIONSHIP_STATUS;
  }
  
  if (validatedData.relationship_level === undefined) {
    validatedData.relationship_level = SchemaConstraints.DEFAULT_VALUES.RELATIONSHIP_LEVEL;
  }
  
  if (validatedData.attribution_percentage === undefined) {
    validatedData.attribution_percentage = SchemaConstraints.DEFAULT_VALUES.ATTRIBUTION_PERCENTAGE;
  }
  
  if (validatedData.is_primary_referrer === undefined) {
    validatedData.is_primary_referrer = SchemaConstraints.DEFAULT_VALUES.IS_PRIMARY_REFERRER;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData
  };
};

/**
 * Validates interaction data against schema constraints
 * @param {Object} interactionData - The interaction data to validate
 * @returns {Object} Object with isValid and errors properties
 */
export const validateInteraction = (interactionData) => {
  const errors = [];
  
  // Check required fields
  if (!interactionData.person_id) {
    errors.push('Person ID is required');
  }
  
  // Ensure attachments is properly formatted as an array
  if (interactionData.attachments && !Array.isArray(interactionData.attachments)) {
    errors.push('Attachments must be an array');
  }
  
  // Set default values if not provided
  const validatedData = { ...interactionData };
  
  if (validatedData.status === undefined) {
    validatedData.status = SchemaConstraints.DEFAULT_VALUES.INTERACTION_STATUS;
  }
  
  if (validatedData.response_received === undefined) {
    validatedData.response_received = SchemaConstraints.DEFAULT_VALUES.RESPONSE_RECEIVED;
  }
  
  // Apply default values to custom_fields if not provided
  if (validatedData.custom_fields === undefined) {
    validatedData.custom_fields = {};
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData
  };
};

/**
 * Validates message data against schema constraints
 * @param {Object} messageData - The message data to validate
 * @returns {Object} Object with isValid and errors properties
 */
export const validateMessage = (messageData) => {
  const errors = [];
  
  // Check required fields
  if (!messageData.sender_id) {
    errors.push('Sender ID is required');
  }
  
  if (!messageData.recipient_id) {
    errors.push('Recipient ID is required');
  }
  
  if (!messageData.message_type) {
    errors.push('Message type is required');
  }
  
  if (!messageData.content) {
    errors.push('Content is required');
  }
  
  // Set default values if not provided
  const validatedData = { ...messageData };
  
  if (validatedData.status === undefined) {
    validatedData.status = SchemaConstraints.DEFAULT_VALUES.MESSAGE_STATUS;
  }
  
  if (validatedData.is_blast === undefined) {
    validatedData.is_blast = SchemaConstraints.DEFAULT_VALUES.IS_BLAST;
  }
  
  if (validatedData.has_response === undefined) {
    validatedData.has_response = SchemaConstraints.DEFAULT_VALUES.HAS_RESPONSE;
  }
  
  // Apply default values to metadata if not provided
  if (validatedData.metadata === undefined) {
    validatedData.metadata = {};
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData
  };
};

/**
 * Validates person data against schema constraints
 * @param {Object} personData - The person data to validate
 * @returns {Object} Object with isValid and errors properties
 */
export const validatePerson = (personData) => {
  const errors = [];
  
  // Check required fields
  if (!personData.first_name) {
    errors.push('First name is required');
  }
  
  if (!personData.last_name) {
    errors.push('Last name is required');
  }
  
  // Set default values if not provided
  const validatedData = { ...personData };
  
  if (validatedData.email_opt_in === undefined) {
    validatedData.email_opt_in = DefaultValues.EMAIL_OPT_IN;
  }
  
  if (validatedData.sms_opt_in === undefined) {
    validatedData.sms_opt_in = DefaultValues.SMS_OPT_IN;
  }
  
  if (validatedData.active_status === undefined) {
    validatedData.active_status = DefaultValues.ACTIVE_STATUS;
  }
  
  if (validatedData.is_lead === undefined) {
    validatedData.is_lead = DefaultValues.IS_LEAD;
  }
  
  if (validatedData.is_referral === undefined) {
    validatedData.is_referral = DefaultValues.IS_REFERRAL;
  }
  
  if (validatedData.is_member === undefined) {
    validatedData.is_member = DefaultValues.IS_MEMBER;
  }
  
  if (validatedData.profile_completeness === undefined) {
    validatedData.profile_completeness = DefaultValues.PROFILE_COMPLETENESS;
  }
  
  // Apply default values to custom_fields if not provided
  if (validatedData.custom_fields === undefined) {
    validatedData.custom_fields = {};
  }
  
  // Apply default values to social_profiles if not provided
  if (validatedData.social_profiles === undefined) {
    validatedData.social_profiles = {};
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData
  };
};

export default {
  ValidationPatterns,
  DefaultValues,
  validateRequired,
  validateEmail,
  validatePhone,
  validateNumberRange,
  LeadValidation,
  MemberValidation,
  ReferralValidation,
  RelationshipValidation,
  PersonValidation,
  validateLeadExtension,
  validateReferralExtension,
  validateMemberExtension,
  validateRelationship,
  validateInteraction,
  validateMessage,
  validatePerson,
  validateUrl
}; 