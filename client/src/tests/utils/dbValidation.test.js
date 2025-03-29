/**
 * Database Validation Tests
 * 
 * This file contains tests for the database validation utilities
 * to ensure they correctly validate records against schema constraints
 */

import { 
  isValidUuid, 
  isInRange,
  validateField,
  validateRecord,
  DbConstraintError,
  validateOrThrow,
  handleConstraintError
} from '../../utils/dbValidation';

// Mock tableSchemas for testing
jest.mock('../../utils/dataTransformUtils', () => ({
  tableSchemas: {
    test_table: {
      required_field: { type: 'text', notNull: true },
      optional_field: { type: 'text' },
      numeric_field: { type: 'integer', min: 1, max: 10 },
      array_field: { type: 'text[]' },
      json_field: { type: 'jsonb', default: {} }
    },
    relationships: {
      person_a_id: { type: 'text', notNull: true },
      person_b_id: { type: 'text', notNull: true },
      relationship_type: { type: 'text', notNull: true }
    }
  }
}));

describe('Database Validation Utilities', () => {
  describe('isValidUuid', () => {
    test('should return true for valid UUIDs', () => {
      expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUuid('c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd')).toBe(true);
    });

    test('should return false for invalid UUIDs', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('')).toBe(false);
      expect(isValidUuid(null)).toBe(false);
      expect(isValidUuid(undefined)).toBe(false);
      expect(isValidUuid(123)).toBe(false);
    });
  });

  describe('isInRange', () => {
    test('should return true for numbers within range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true); // Min boundary
      expect(isInRange(10, 1, 10)).toBe(true); // Max boundary
      expect(isInRange(5, null, 10)).toBe(true); // No min
      expect(isInRange(5, 1, null)).toBe(true); // No max
      expect(isInRange(5, null, null)).toBe(true); // No bounds
    });

    test('should return false for numbers outside range', () => {
      expect(isInRange(0, 1, 10)).toBe(false); // Below min
      expect(isInRange(11, 1, 10)).toBe(false); // Above max
      expect(isInRange('5', 1, 10)).toBe(false); // Not a number
      expect(isInRange(NaN, 1, 10)).toBe(false); // NaN
      expect(isInRange(null, 1, 10)).toBe(false); // Null
      expect(isInRange(undefined, 1, 10)).toBe(false); // Undefined
    });
  });

  describe('validateField', () => {
    test('should validate required fields', () => {
      expect(validateField('test_table', 'required_field', 'value')).toEqual({
        isValid: true,
        error: null
      });
      
      expect(validateField('test_table', 'required_field', null)).toEqual({
        isValid: false,
        error: 'Field required_field cannot be null'
      });
    });

    test('should validate numeric fields', () => {
      expect(validateField('test_table', 'numeric_field', 5)).toEqual({
        isValid: true,
        error: null
      });
      
      expect(validateField('test_table', 'numeric_field', 0)).toEqual({
        isValid: false,
        error: 'Field numeric_field must be between 1 and 10'
      });
      
      expect(validateField('test_table', 'numeric_field', 'string')).toEqual({
        isValid: false,
        error: 'Field numeric_field must be a number'
      });
    });

    test('should validate array fields', () => {
      expect(validateField('test_table', 'array_field', ['item1', 'item2'])).toEqual({
        isValid: true,
        error: null
      });
      
      expect(validateField('test_table', 'array_field', 'not-an-array')).toEqual({
        isValid: false,
        error: 'Field array_field must be an array'
      });
    });

    test('should validate JSON fields', () => {
      expect(validateField('test_table', 'json_field', { key: 'value' })).toEqual({
        isValid: true,
        error: null
      });
      
      expect(validateField('test_table', 'json_field', '{"key":"value"}')).toEqual({
        isValid: true,
        error: null
      });
      
      expect(validateField('test_table', 'json_field', 'not-json')).toEqual({
        isValid: false,
        error: 'Field json_field must be valid JSON'
      });
    });
  });

  describe('validateRecord', () => {
    test('should validate a complete record', () => {
      const validRecord = {
        required_field: 'value',
        optional_field: 'optional',
        numeric_field: 5,
        array_field: ['item1', 'item2'],
        json_field: { key: 'value' }
      };
      
      expect(validateRecord('test_table', validRecord)).toEqual({
        isValid: true,
        errors: []
      });
    });

    test('should catch multiple validation errors', () => {
      const invalidRecord = {
        // missing required_field
        numeric_field: 20, // out of range
        array_field: 'not-an-array',
        json_field: 123 // not json
      };
      
      const result = validateRecord('test_table', invalidRecord);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Required field required_field is missing');
    });

    test('should validate table-specific rules', () => {
      const invalidRelationship = {
        person_a_id: '123e4567-e89b-12d3-a456-426614174000',
        person_b_id: '123e4567-e89b-12d3-a456-426614174000', // Same as person_a_id
        relationship_type: 'friend'
      };
      
      const result = validateRecord('relationships', invalidRelationship);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('person_a_id and person_b_id must be different');
    });
  });

  describe('validateOrThrow', () => {
    test('should not throw for valid records', () => {
      const validRecord = {
        required_field: 'value',
        numeric_field: 5
      };
      
      expect(() => validateOrThrow('test_table', validRecord)).not.toThrow();
    });

    test('should throw DbConstraintError for invalid records', () => {
      const invalidRecord = {
        // Missing required field
        numeric_field: 20 // Out of range
      };
      
      expect(() => validateOrThrow('test_table', invalidRecord)).toThrow(DbConstraintError);
    });
  });

  describe('handleConstraintError', () => {
    test('should format constraint errors', () => {
      const uniqueError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "idx_users_email"'
      };
      
      const result = handleConstraintError(uniqueError);
      expect(result.type).toBe('unique_constraint');
      expect(result.field).toBe('users');
      expect(result.message).toContain('Duplicate value');
    });

    test('should return basic error info if not a constraint error', () => {
      const genericError = {
        message: 'Generic error'
      };
      
      const result = handleConstraintError(genericError);
      expect(result.type).toBe('unknown');
      expect(result.message).toBe('Generic error');
    });

    test('should handle null/undefined errors', () => {
      expect(handleConstraintError(null)).toBeNull();
      expect(handleConstraintError(undefined)).toBeNull();
    });
  });
}); 