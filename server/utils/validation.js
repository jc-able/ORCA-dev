/**
 * Validation Utilities
 * Functions for validating data inputs across the application
 */

/**
 * Validate a user object
 * @param {Object} userData - User data to validate
 * @param {Boolean} isUpdate - Whether this is an update (some fields optional)
 * @returns {Object} Validation result with isValid flag and errors
 */
exports.validateUser = (userData, isUpdate = false) => {
  const errors = [];
  
  // Email validation (required unless update)
  if (!isUpdate || userData.email !== undefined) {
    if (!userData.email) {
      errors.push('Email is required');
    } else if (!isValidEmail(userData.email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Password validation (required unless update)
  if (!isUpdate || userData.password !== undefined) {
    if (!userData.password) {
      errors.push('Password is required');
    } else if (userData.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
  }
  
  // Role validation (if provided)
  if (userData.role && !['admin', 'salesperson'].includes(userData.role)) {
    errors.push('Role must be either "admin" or "salesperson"');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate a person object
 * @param {Object} personData - Person data to validate
 * @param {Boolean} isUpdate - Whether this is an update (some fields optional)
 * @returns {Object} Validation result with isValid flag and errors
 */
exports.validatePerson = (personData, isUpdate = false) => {
  const errors = [];
  
  // First name validation (required unless update)
  if (!isUpdate || personData.first_name !== undefined) {
    if (!personData.first_name) {
      errors.push('First name is required');
    }
  }
  
  // Last name validation (required unless update)
  if (!isUpdate || personData.last_name !== undefined) {
    if (!personData.last_name) {
      errors.push('Last name is required');
    }
  }
  
  // Email validation (optional but must be valid if provided)
  if (personData.email && !isValidEmail(personData.email)) {
    errors.push('Invalid email format');
  }
  
  // Phone validation (optional but must be valid if provided)
  if (personData.phone && !isValidPhone(personData.phone)) {
    errors.push('Invalid phone format');
  }
  
  // Role flags validation (at least one should be true)
  if (
    personData.is_lead !== undefined && 
    personData.is_referral !== undefined && 
    personData.is_member !== undefined
  ) {
    if (!personData.is_lead && !personData.is_referral && !personData.is_member) {
      errors.push('Person must be at least one of: lead, referral, or member');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate an interaction object
 * @param {Object} interactionData - Interaction data to validate
 * @param {Boolean} isUpdate - Whether this is an update (some fields optional)
 * @returns {Object} Validation result with isValid flag and errors
 */
exports.validateInteraction = (interactionData, isUpdate = false) => {
  const errors = [];
  
  // Person ID validation (required unless update)
  if (!isUpdate || interactionData.person_id !== undefined) {
    if (!interactionData.person_id) {
      errors.push('Person ID is required');
    } else if (!isValidUUID(interactionData.person_id)) {
      errors.push('Invalid Person ID format');
    }
  }
  
  // User ID validation (optional but must be valid if provided)
  if (interactionData.user_id && !isValidUUID(interactionData.user_id)) {
    errors.push('Invalid User ID format');
  }
  
  // Interaction type validation (required unless update)
  if (!isUpdate || interactionData.interaction_type !== undefined) {
    if (!interactionData.interaction_type) {
      errors.push('Interaction type is required');
    } else if (!isValidInteractionType(interactionData.interaction_type)) {
      errors.push('Invalid interaction type');
    }
  }
  
  // Status validation (if provided)
  if (
    interactionData.status && 
    !['scheduled', 'completed', 'cancelled', 'pending'].includes(interactionData.status)
  ) {
    errors.push('Invalid status value');
  }
  
  // Date validations
  if (interactionData.scheduled_at && !isValidDate(interactionData.scheduled_at)) {
    errors.push('Invalid scheduled date format');
  }
  
  if (interactionData.completed_at && !isValidDate(interactionData.completed_at)) {
    errors.push('Invalid completed date format');
  }
  
  // Duration validation
  if (
    interactionData.duration_minutes !== undefined && 
    (isNaN(interactionData.duration_minutes) || interactionData.duration_minutes < 0)
  ) {
    errors.push('Duration must be a positive number');
  }
  
  // Response received validation
  if (
    interactionData.response_received === true && 
    !interactionData.response_content
  ) {
    errors.push('Response content is required when response_received is true');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate a message object
 * @param {Object} messageData - Message data to validate
 * @param {Boolean} isUpdate - Whether this is an update (some fields optional)
 * @returns {Object} Validation result with isValid flag and errors
 */
exports.validateMessage = (messageData, isUpdate = false) => {
  const errors = [];
  
  // Sender ID validation (required unless update)
  if (!isUpdate || messageData.sender_id !== undefined) {
    if (!messageData.sender_id) {
      errors.push('Sender ID is required');
    } else if (!isValidUUID(messageData.sender_id)) {
      errors.push('Invalid Sender ID format');
    }
  }
  
  // Recipient ID validation (required unless update)
  if (!isUpdate || messageData.recipient_id !== undefined) {
    if (!messageData.recipient_id) {
      errors.push('Recipient ID is required');
    } else if (!isValidUUID(messageData.recipient_id)) {
      errors.push('Invalid Recipient ID format');
    }
  }
  
  // Message type validation (required unless update)
  if (!isUpdate || messageData.message_type !== undefined) {
    if (!messageData.message_type) {
      errors.push('Message type is required');
    } else if (!['email', 'sms', 'blast'].includes(messageData.message_type)) {
      errors.push('Invalid message type');
    }
  }
  
  // Content validation (required unless update)
  if (!isUpdate || messageData.content !== undefined) {
    if (!messageData.content) {
      errors.push('Message content is required');
    }
  }
  
  // Subject validation (required for email)
  if (messageData.message_type === 'email' && !messageData.subject) {
    errors.push('Subject is required for email messages');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate a relationship object
 * @param {Object} relationshipData - Relationship data to validate
 * @param {Boolean} isUpdate - Whether this is an update (some fields optional)
 * @returns {Object} Validation result with isValid flag and errors
 */
exports.validateRelationship = (relationshipData, isUpdate = false) => {
  const errors = [];
  
  // Person A validation (required unless update)
  if (!isUpdate || relationshipData.person_a_id !== undefined) {
    if (!relationshipData.person_a_id) {
      errors.push('Person A ID is required');
    } else if (!isValidUUID(relationshipData.person_a_id)) {
      errors.push('Invalid Person A ID format');
    }
  }
  
  // Person B validation (required unless update)
  if (!isUpdate || relationshipData.person_b_id !== undefined) {
    if (!relationshipData.person_b_id) {
      errors.push('Person B ID is required');
    } else if (!isValidUUID(relationshipData.person_b_id)) {
      errors.push('Invalid Person B ID format');
    }
  }
  
  // Relationship type validation (required unless update)
  if (!isUpdate || relationshipData.relationship_type !== undefined) {
    if (!relationshipData.relationship_type) {
      errors.push('Relationship type is required');
    }
  }
  
  // Direction validation (if provided)
  if (
    relationshipData.direction && 
    !['a_to_b', 'b_to_a', 'bidirectional'].includes(relationshipData.direction)
  ) {
    errors.push('Invalid direction value');
  }
  
  // Same person check
  if (
    relationshipData.person_a_id && 
    relationshipData.person_b_id && 
    relationshipData.person_a_id === relationshipData.person_b_id
  ) {
    errors.push('Person A and Person B cannot be the same');
  }
  
  // Attribution percentage validation
  if (
    relationshipData.attribution_percentage !== undefined && 
    (isNaN(relationshipData.attribution_percentage) || 
     relationshipData.attribution_percentage < 0 || 
     relationshipData.attribution_percentage > 100)
  ) {
    errors.push('Attribution percentage must be between 0 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper functions

/**
 * Check if a string is a valid email format
 * @param {String} email - Email to validate
 * @returns {Boolean} True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid phone format
 * @param {String} phone - Phone to validate
 * @returns {Boolean} True if valid phone format
 */
function isValidPhone(phone) {
  // Simple validation for now - can be enhanced for specific formats
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
}

/**
 * Check if a string is a valid UUID format
 * @param {String} uuid - UUID to validate
 * @returns {Boolean} True if valid UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if a value is a valid date format
 * @param {String|Date} date - Date to validate
 * @returns {Boolean} True if valid date
 */
function isValidDate(date) {
  if (!date) return false;
  
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Check if an interaction type is valid
 * @param {String} type - Interaction type to validate
 * @returns {Boolean} True if valid interaction type
 */
function isValidInteractionType(type) {
  const validTypes = [
    'email', 
    'sms', 
    'call', 
    'meeting', 
    'note', 
    'visit', 
    'form', 
    'payment', 
    'other'
  ];
  
  return validTypes.includes(type);
} 