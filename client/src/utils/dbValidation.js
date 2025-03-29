/**
 * Database Validation Utilities
 * 
 * Functions to validate data against database schema constraints
 * before executing database operations.
 */

import { tableSchemas } from './dataTransformUtils';

/**
 * Validates if a string is a valid UUID
 * 
 * @param {string} str - String to check
 * @returns {boolean} - Whether the string is a valid UUID
 */
export const isValidUuid = (str) => {
  if (!str) return false;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
};

/**
 * Validates if a value falls within a numeric range
 * 
 * @param {number} value - Value to check
 * @param {number|null} min - Minimum allowed value (null for no min)
 * @param {number|null} max - Maximum allowed value (null for no max)
 * @returns {boolean} - Whether the value is within the range
 */
export const isInRange = (value, min = null, max = null) => {
  // If value is not a number, it can't be in range
  if (typeof value !== 'number' || isNaN(value)) return false;
  
  // Check minimum if provided
  if (min !== null && value < min) return false;
  
  // Check maximum if provided
  if (max !== null && value > max) return false;
  
  return true;
};

/**
 * Validates a field value against its schema definition
 * 
 * @param {string} table - Table name
 * @param {string} field - Field name
 * @param {any} value - Value to validate
 * @returns {Object} - Validation result with isValid and error properties
 */
export const validateField = (table, field, value) => {
  // Get the schema for the table and field
  const schema = tableSchemas[table];
  if (!schema) {
    return { isValid: true, error: null }; // No schema to validate against
  }
  
  const fieldSchema = schema[field];
  if (!fieldSchema) {
    return { isValid: true, error: null }; // No field schema to validate against
  }
  
  // Check if field is required (NOT NULL) and value is null/undefined
  if (fieldSchema.notNull && (value === null || value === undefined)) {
    return {
      isValid: false,
      error: `Field ${field} cannot be null`
    };
  }
  
  // Skip remaining validations if value is null/undefined and allowed to be
  if (value === null || value === undefined) {
    return { isValid: true, error: null };
  }
  
  // Validate based on field type
  switch (fieldSchema.type) {
    case 'integer':
    case 'numeric':
      // Check if value is a number
      if (typeof value !== 'number' || isNaN(value)) {
        return {
          isValid: false,
          error: `Field ${field} must be a number`
        };
      }
      
      // Check range constraints
      if (!isInRange(value, fieldSchema.min, fieldSchema.max)) {
        return {
          isValid: false,
          error: `Field ${field} must be between ${fieldSchema.min || 'MIN'} and ${fieldSchema.max || 'MAX'}`
        };
      }
      break;
      
    case 'text[]':
    case 'jsonb[]':
      // Check if value is an array
      if (!Array.isArray(value)) {
        return {
          isValid: false,
          error: `Field ${field} must be an array`
        };
      }
      break;
      
    case 'jsonb':
      // Check if value is an object or can be parsed as JSON
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          return {
            isValid: false,
            error: `Field ${field} must be valid JSON`
          };
        }
      } else if (typeof value !== 'object' || value === null) {
        return {
          isValid: false,
          error: `Field ${field} must be a JSON object`
        };
      }
      break;
  }
  
  return { isValid: true, error: null };
};

/**
 * Validates an entire record against table schema constraints
 * 
 * @param {string} table - Table name
 * @param {Object} record - Record to validate
 * @returns {Object} - Validation result with isValid and errors properties
 */
export const validateRecord = (table, record) => {
  if (!record || typeof record !== 'object') {
    return {
      isValid: false,
      errors: ['Record must be an object']
    };
  }
  
  const schema = tableSchemas[table];
  if (!schema) {
    return { isValid: true, errors: [] }; // No schema to validate against
  }
  
  const errors = [];
  
  // Validate each field in the schema that exists in the record
  Object.keys(record).forEach(field => {
    if (schema[field]) {
      const { isValid, error } = validateField(table, field, record[field]);
      if (!isValid) {
        errors.push(error);
      }
    }
  });
  
  // Check for required fields that are missing from the record
  Object.keys(schema).forEach(field => {
    const fieldSchema = schema[field];
    if (fieldSchema.notNull && 
        (record[field] === undefined || record[field] === null)) {
      errors.push(`Required field ${field} is missing`);
    }
  });
  
  // Perform table-specific validations
  if (table === 'relationships') {
    // Ensure person_a_id and person_b_id are different
    if (record.person_a_id && record.person_b_id && 
        record.person_a_id === record.person_b_id) {
      errors.push('person_a_id and person_b_id must be different');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Error class for database constraint violations
 */
export class DbConstraintError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'DbConstraintError';
    this.errors = errors;
  }
}

/**
 * Validates a record before database operation and throws if invalid
 * 
 * @param {string} table - Table name
 * @param {Object} record - Record to validate
 * @throws {DbConstraintError} - If record is invalid
 */
export const validateOrThrow = (table, record) => {
  const { isValid, errors } = validateRecord(table, record);
  if (!isValid) {
    throw new DbConstraintError(
      `Validation failed for ${table} record`, 
      errors
    );
  }
};

/**
 * Handles database constraint errors from Supabase
 * 
 * @param {Error} error - Supabase error object
 * @returns {Object} - Structured error information
 */
export const handleConstraintError = (error) => {
  if (!error) return null;
  
  // Initialize default error structure
  const result = {
    message: error.message || 'Database operation failed',
    type: 'unknown',
    field: null,
    details: error.details || null
  };
  
  // Parse Postgres error codes if available
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        result.type = 'unique_constraint';
        
        // Try to extract the field name from the error message
        const uniqueMatch = error.message.match(/unique constraint "(.+?)"/i);
        if (uniqueMatch && uniqueMatch[1]) {
          const constraintName = uniqueMatch[1];
          // Extract field name from constraint name
          const fieldMatch = constraintName.match(/(?:idx|key)_(.+?)_/i);
          if (fieldMatch && fieldMatch[1]) {
            result.field = fieldMatch[1];
          }
        }
        
        result.message = result.field 
          ? `Duplicate value for ${result.field}`
          : 'A record with this value already exists';
        break;
        
      case '23503': // foreign_key_violation
        result.type = 'foreign_key';
        
        // Try to extract the field name from the error message
        const fkMatch = error.message.match(/foreign key constraint "(.+?)"/i);
        if (fkMatch && fkMatch[1]) {
          const constraintName = fkMatch[1];
          // Extract field name from constraint name
          const fieldMatch = constraintName.match(/fk_(.+?)_/i);
          if (fieldMatch && fieldMatch[1]) {
            result.field = fieldMatch[1];
          }
        }
        
        result.message = result.field 
          ? `Invalid reference in ${result.field}`
          : 'Referenced record does not exist';
        break;
        
      case '23514': // check_violation
        result.type = 'check_constraint';
        
        // Try to extract the constraint name from the error message
        const checkMatch = error.message.match(/check constraint "(.+?)"/i);
        if (checkMatch && checkMatch[1]) {
          const constraintName = checkMatch[1];
          // Extract field name from constraint name
          const fieldMatch = constraintName.match(/ck_(.+?)_/i);
          if (fieldMatch && fieldMatch[1]) {
            result.field = fieldMatch[1];
          }
        }
        
        result.message = result.field 
          ? `Invalid value for ${result.field}`
          : 'Value does not meet constraints';
        break;
        
      case '23502': // not_null_violation
        result.type = 'not_null';
        
        // Extract field name from error message
        const nullMatch = error.message.match(/column "(.+?)"/i);
        if (nullMatch && nullMatch[1]) {
          result.field = nullMatch[1];
        }
        
        result.message = result.field 
          ? `${result.field} cannot be null`
          : 'Required field cannot be null';
        break;
        
      default:
        result.type = 'database';
    }
  }
  
  return result;
}; 