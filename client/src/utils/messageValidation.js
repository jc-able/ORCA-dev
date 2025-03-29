/**
 * Message Validation Utilities
 * 
 * This file contains validation utilities specific to messages and communication.
 * It enforces the database schema constraints for message-related operations.
 */
import { validateRequired, ValidationPatterns } from './validationUtils';
import { SchemaConstraints } from '../types/interfaces.js';

/**
 * Validate a message object against schema constraints
 * @param {Object} message - The message object to validate
 * @returns {Object} An object containing validation errors, if any
 */
export const validateMessage = (message) => {
  const errors = {};
  
  // Check required fields based on NOT NULL constraints in SQL schema
  const requiredFields = [
    { field: 'sender_id', label: 'Sender' },
    { field: 'recipient_id', label: 'Recipient' },
    { field: 'message_type', label: 'Message type' },
    { field: 'content', label: 'Message content' }
  ];
  
  requiredFields.forEach(({ field, label }) => {
    const error = validateRequired(message[field], label);
    if (error) {
      errors[field] = error;
    }
  });
  
  // Message type validation - ensure it's a valid type
  // In the SQL schema, message_type is a free-form text field, but we can enforce application-level restrictions
  if (message.message_type && !['email', 'sms', 'blast'].includes(message.message_type)) {
    errors.message_type = 'Invalid message type. Must be email, sms, or blast.';
  }
  
  // For email messages, subject should be provided
  if (message.message_type === 'email' && !message.subject) {
    errors.subject = 'Subject is required for email messages';
  }
  
  // Validate message content length based on message type
  if (message.content) {
    if (message.message_type === 'sms' && message.content.length > 160) {
      errors.content = 'SMS messages must be 160 characters or less';
    } else if (message.message_type === 'blast' && message.content.length > 160) {
      errors.content = 'Text blast messages must be 160 characters or less';
    }
  }
  
  return errors;
};

/**
 * Get default values for a new message based on schema constraints
 * @param {string} messageType - Type of message ('sms', 'email', 'blast')
 * @returns {Object} Default values for message fields
 */
export const getMessageDefaults = (messageType = 'sms') => {
  return {
    status: SchemaConstraints.DEFAULT_VALUES.MESSAGE_STATUS,
    is_blast: messageType === 'blast' ? true : SchemaConstraints.DEFAULT_VALUES.IS_BLAST,
    has_response: SchemaConstraints.DEFAULT_VALUES.HAS_RESPONSE,
    metadata: {},
    message_type: messageType,
    sent_at: new Date().toISOString()
  };
};

/**
 * Validate a text blast configuration
 * @param {Object} blastConfig - Configuration for a text blast
 * @returns {Object} An object containing validation errors, if any
 */
export const validateTextBlast = (blastConfig) => {
  const errors = {};
  
  // Required fields for text blast
  if (!blastConfig.recipientIds || blastConfig.recipientIds.length === 0) {
    errors.recipientIds = 'At least one recipient is required';
  }
  
  if (!blastConfig.message || blastConfig.message.trim() === '') {
    errors.message = 'Message content is required';
  } else if (blastConfig.message.length > 160) {
    errors.message = 'Text blast messages must be 160 characters or less';
  }
  
  // Validate personalization if provided
  if (blastConfig.personalization) {
    // Ensure all personalization variables are available in the template
    const variables = extractTemplateVariables(blastConfig.message);
    for (const variable of variables) {
      if (!blastConfig.personalization[variable]) {
        errors.personalization = errors.personalization || {};
        errors.personalization[variable] = `Missing value for personalization variable: ${variable}`;
      }
    }
  }
  
  return errors;
};

/**
 * Extract template variables from a message
 * @param {string} messageTemplate - Message template with variables in {{variable}} format
 * @returns {string[]} Array of variable names
 */
export const extractTemplateVariables = (messageTemplate) => {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables = [];
  let match;
  
  while ((match = variableRegex.exec(messageTemplate)) !== null) {
    variables.push(match[1].trim());
  }
  
  return variables;
};

/**
 * Apply personalization to a message template
 * @param {string} template - Message template with variables in {{variable}} format
 * @param {Object} data - Object containing personalization data
 * @returns {string} The personalized message
 */
export const applyPersonalization = (template, data) => {
  if (!template) return '';
  if (!data) return template;
  
  return template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const key = variable.trim();
    return data[key] !== undefined ? data[key] : match;
  });
};

/**
 * Validate an SMS message for sending
 * @param {Object} messageData - Message data to validate
 * @param {number} maxLength - Maximum message length
 * @returns {Object} Error object with field keys and error messages
 */
export const validateSmsMessage = (messageData, maxLength = 160) => {
  // First validate using the general message validator
  const errors = validateMessage(messageData);
  
  // Add SMS-specific validation
  if (messageData.content) {
    if (messageData.content.length > maxLength) {
      errors.content = `SMS messages must be ${maxLength} characters or less`;
    }
  }
  
  return errors;
};

/**
 * Validate an email message for sending
 * @param {Object} messageData - Message data to validate
 * @returns {Object} Error object with field keys and error messages
 */
export const validateEmailMessage = (messageData) => {
  // First validate using the general message validator
  const errors = validateMessage(messageData);
  
  // Add Email-specific validation
  if (!messageData.subject) {
    errors.subject = 'Subject is required for email';
  }
  
  // Validate email addresses
  if (messageData.to && !ValidationPatterns.EMAIL.test(messageData.to)) {
    errors.to = 'Invalid email address format';
  }
  
  return errors;
};

/**
 * Validate a message before sending
 * This is a generic wrapper that selects the appropriate validator
 * @param {Object} messageData - Message data to validate
 * @param {number} maxLength - Maximum message length for SMS
 * @returns {Object} Error object with field keys and error messages
 */
export const validateMessageBeforeSend = (messageData, maxLength = 160) => {
  if (messageData.message_type === 'sms') {
    return validateSmsMessage(messageData, maxLength);
  } else if (messageData.message_type === 'email') {
    return validateEmailMessage(messageData);
  } else {
    // Default to basic message validation for other types
    return validateMessage(messageData);
  }
};

export default {
  validateMessage,
  validateTextBlast,
  extractTemplateVariables,
  applyPersonalization,
  getMessageDefaults,
  validateSmsMessage,
  validateEmailMessage,
  validateMessageBeforeSend
}; 