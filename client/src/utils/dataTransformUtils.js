/**
 * Data Transformation Utilities
 * 
 * Utility functions for consistent handling of data types between 
 * the Supabase database and the React frontend.
 * These functions ensure proper handling of array types, JSONB fields,
 * timestamp formatting, and NULL values based on schema constraints.
 */

/**
 * Process array data type for database operations
 * Handles arrays like text[], jsonb[] correctly for Supabase
 * 
 * @param {Array|null} array - The array to process
 * @param {string} fieldType - The type of array ('text', 'jsonb', etc)
 * @returns {Array|null} - Properly formatted array for database
 */
export const processArrayField = (array, fieldType = 'text') => {
  // Return null if array is null or undefined
  if (array == null) return null;
  
  // Convert non-arrays to empty arrays
  if (!Array.isArray(array)) return [];
  
  // For jsonb arrays, ensure all items are valid JSON
  if (fieldType === 'jsonb') {
    return array.map(item => {
      if (typeof item === 'string') {
        try {
          // If it's a string, try to parse it as JSON
          return JSON.parse(item);
        } catch (e) {
          // If it can't be parsed, wrap it in an object
          return { value: item };
        }
      } else if (item && typeof item === 'object') {
        // If it's already an object, use it as is
        return item;
      } else if (item == null) {
        // If it's null or undefined, use an empty object
        return {};
      } else {
        // For primitive values, wrap in an object
        return { value: item };
      }
    });
  }
  
  // For text arrays, ensure all items are strings
  return array.map(item => {
    if (item == null) return '';
    return String(item);
  });
};

/**
 * Process JSONB data type for database operations
 * Ensures data is a valid JSON object for Supabase
 * 
 * @param {Object|string|null} jsonData - The JSON data to process
 * @param {Object} defaultValue - Default value if jsonData is null/invalid
 * @returns {Object} - Properly formatted JSON object for database
 */
export const processJsonField = (jsonData, defaultValue = {}) => {
  // Return default if data is null or undefined
  if (jsonData == null) return defaultValue;
  
  try {
    // If it's a string, try to parse it
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData);
    }
    
    // If it's already an object, use it as is
    if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      return jsonData;
    }
    
    // For anything else, wrap in an object
    return { value: jsonData };
  } catch (e) {
    console.warn('Invalid JSON data, using default value:', e);
    return defaultValue;
  }
};

/**
 * Format timestamp for consistent display
 * 
 * @param {string|Date|null} timestamp - Timestamp to format
 * @param {string} format - Format type ('iso', 'display', 'date', 'time')
 * @returns {string|null} - Formatted timestamp string
 */
export const formatTimestamp = (timestamp, format = 'display') => {
  // Return null if timestamp is null or undefined
  if (timestamp == null) return null;
  
  // Create a Date object from the timestamp
  let date;
  try {
    date = new Date(timestamp);
    // Check if date is valid
    if (isNaN(date.getTime())) return null;
  } catch (e) {
    console.warn('Invalid timestamp:', timestamp);
    return null;
  }
  
  // Format based on requested format
  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'date':
      return date.toISOString().split('T')[0];
    case 'time':
      return date.toISOString().split('T')[1].substring(0, 5);
    case 'display':
    default:
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
  }
};

/**
 * Process numeric field with range constraints
 * 
 * @param {number|string|null} value - The number to process
 * @param {number|null} min - Minimum allowed value
 * @param {number|null} max - Maximum allowed value
 * @param {number|null} defaultValue - Default value if null/invalid
 * @returns {number|null} - Processed numeric value
 */
export const processNumericField = (value, min = null, max = null, defaultValue = null) => {
  // Return default if value is null or undefined
  if (value == null) return defaultValue;
  
  // Convert to number if it's a string
  let numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if value is a valid number
  if (isNaN(numValue)) return defaultValue;
  
  // Apply min/max constraints if provided
  if (min !== null && numValue < min) numValue = min;
  if (max !== null && numValue > max) numValue = max;
  
  return numValue;
};

/**
 * Handle NULL values based on field constraints
 * 
 * @param {any} value - The value to process
 * @param {boolean} isRequired - Whether the field is required (NOT NULL)
 * @param {any} defaultValue - Default value if null/undefined
 * @returns {any} - Processed value
 */
export const handleNullable = (value, isRequired, defaultValue) => {
  // If field is required and value is null/undefined, use default
  if (isRequired && value == null) {
    return defaultValue;
  }
  
  // Otherwise, allow null values
  return value;
};

/**
 * Process a complete record against schema constraints
 * 
 * @param {Object} record - The record to process
 * @param {Object} schema - Schema definition with constraints
 * @returns {Object} - Processed record with all constraints applied
 */
export const processRecord = (record, schema) => {
  if (!record || typeof record !== 'object') return {};
  if (!schema || typeof schema !== 'object') return record;
  
  const processed = {};
  
  // Process each field according to its schema definition
  Object.keys(schema).forEach(field => {
    const fieldDef = schema[field];
    const value = record[field];
    
    // Skip if no field definition
    if (!fieldDef) {
      processed[field] = value;
      return;
    }
    
    // Process based on field type
    switch (fieldDef.type) {
      case 'text[]':
        processed[field] = processArrayField(value, 'text');
        break;
      case 'jsonb[]':
        processed[field] = processArrayField(value, 'jsonb');
        break;
      case 'jsonb':
        processed[field] = processJsonField(value, fieldDef.default);
        break;
      case 'timestamp':
        processed[field] = value ? formatTimestamp(value, 'iso') : null;
        break;
      case 'integer':
      case 'numeric':
        processed[field] = processNumericField(
          value, 
          fieldDef.min, 
          fieldDef.max, 
          fieldDef.default
        );
        break;
      default:
        // Handle NULL constraints for other types
        processed[field] = handleNullable(
          value, 
          fieldDef.notNull, 
          fieldDef.default
        );
    }
  });
  
  return processed;
};

/**
 * Schema definitions for common database tables
 * Used for consistent data processing
 */
export const tableSchemas = {
  persons: {
    first_name: { type: 'text', notNull: true },
    last_name: { type: 'text', notNull: true },
    email: { type: 'text' },
    phone: { type: 'text' },
    address: { type: 'jsonb', default: {} },
    preferred_contact_times: { type: 'jsonb', default: {} },
    social_profiles: { type: 'jsonb', default: {} },
    interested_services: { type: 'text[]' },
    preferred_schedule: { type: 'jsonb', default: {} },
    tags: { type: 'text[]' },
    custom_fields: { type: 'jsonb', default: {} },
    created_at: { type: 'timestamp' },
    updated_at: { type: 'timestamp' },
    last_contacted: { type: 'timestamp' },
    next_scheduled_contact: { type: 'timestamp' },
  },
  lead_extensions: {
    competitor_considerations: { type: 'text[]' },
    pain_points: { type: 'text[]' },
    motivations: { type: 'text[]' },
    objections: { type: 'jsonb[]' },
    readiness_score: { type: 'integer', min: 1, max: 10 },
    status_history: { type: 'jsonb[]' },
    stage_duration_days: { type: 'jsonb' },
    forms_completed: { type: 'jsonb' },
    documents_shared: { type: 'jsonb[]' },
    conversion_probability: { type: 'integer', min: 0, max: 100 },
    conversion_blockers: { type: 'text[]' },
    created_at: { type: 'timestamp' },
    updated_at: { type: 'timestamp' },
  },
  interactions: {
    attachments: { type: 'jsonb[]' },
    custom_fields: { type: 'jsonb', default: {} },
    created_at: { type: 'timestamp' },
    updated_at: { type: 'timestamp' },
    scheduled_at: { type: 'timestamp' },
    completed_at: { type: 'timestamp' },
    response_date: { type: 'timestamp' },
  },
  messages: {
    message_type: { type: 'text', notNull: true },
    content: { type: 'text', notNull: true },
    personalization_data: { type: 'jsonb' },
    metadata: { type: 'jsonb', default: {} },
    created_at: { type: 'timestamp' },
    updated_at: { type: 'timestamp' },
    sent_at: { type: 'timestamp' },
    delivered_at: { type: 'timestamp' },
    read_at: { type: 'timestamp' },
  }
}; 