/**
 * Schema Validation Utility Tests
 * Tests for the comprehensive schema validation utility
 */

const {
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
} = require('../../utils/schemaValidation');

describe('Schema Validation Helper Functions', () => {
  describe('isValidUUID', () => {
    test('should return true for valid UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('d6c3d438-5e31-4099-b05f-a4e8d1f59606')).toBe(true);
    });
    
    test('should return false for invalid UUIDs', () => {
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID(undefined)).toBe(false);
    });
  });
  
  describe('isInRange', () => {
    test('should return true for numbers within range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true); // Min boundary
      expect(isInRange(10, 1, 10)).toBe(true); // Max boundary
    });
    
    test('should return false for numbers outside range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });
    
    test('should return true for undefined or null values', () => {
      expect(isInRange(undefined, 1, 10)).toBe(true);
      expect(isInRange(null, 1, 10)).toBe(true);
    });
    
    test('should return false for NaN values', () => {
      expect(isInRange('not a number', 1, 10)).toBe(false);
    });
  });
  
  describe('isValidJSON', () => {
    test('should return true for valid JSON objects', () => {
      expect(isValidJSON({ key: 'value' })).toBe(true);
      expect(isValidJSON('{"key": "value"}')).toBe(true);
    });
    
    test('should return false for invalid JSON strings', () => {
      expect(isValidJSON('not json')).toBe(false);
      expect(isValidJSON('{invalid: json}')).toBe(false);
    });
    
    test('should return true for undefined, null, or empty values', () => {
      expect(isValidJSON(undefined)).toBe(true);
      expect(isValidJSON(null)).toBe(true);
      expect(isValidJSON('')).toBe(true);
    });
  });
  
  describe('isValidArray', () => {
    test('should return true for valid arrays', () => {
      expect(isValidArray([])).toBe(true);
      expect(isValidArray([1, 2, 3])).toBe(true);
    });
    
    test('should return false for non-arrays', () => {
      expect(isValidArray('not an array')).toBe(false);
      expect(isValidArray(123)).toBe(false);
      expect(isValidArray({ key: 'value' })).toBe(false);
    });
    
    test('should return true for undefined or null values', () => {
      expect(isValidArray(undefined)).toBe(true);
      expect(isValidArray(null)).toBe(true);
    });
  });
  
  describe('isValidDate', () => {
    test('should return true for valid date strings', () => {
      expect(isValidDate('2023-01-01')).toBe(true);
      expect(isValidDate('2023-01-01T12:00:00Z')).toBe(true);
    });
    
    test('should return false for invalid date strings', () => {
      expect(isValidDate('not a date')).toBe(false);
      expect(isValidDate('2023-13-01')).toBe(false); // Invalid month
    });
    
    test('should return true for undefined, null, or empty values', () => {
      expect(isValidDate(undefined)).toBe(true);
      expect(isValidDate(null)).toBe(true);
      expect(isValidDate('')).toBe(true);
    });
  });
  
  describe('isValidEmail', () => {
    test('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('name.surname@domain.co.uk')).toBe(true);
    });
    
    test('should return false for invalid email addresses', () => {
      expect(isValidEmail('not an email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
    
    test('should return true for undefined, null, or empty values', () => {
      expect(isValidEmail(undefined)).toBe(true);
      expect(isValidEmail(null)).toBe(true);
      expect(isValidEmail('')).toBe(true);
    });
  });
});

describe('Schema Validation Functions', () => {
  describe('validatePersonSchema', () => {
    test('should validate a valid person object', () => {
      const validPerson = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        assigned_to: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606'
      };
      
      const result = validatePersonSchema(validPerson);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject if required fields are missing', () => {
      const invalidPerson = {
        email: 'john.doe@example.com'
      };
      
      const result = validatePersonSchema(invalidPerson);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('first_name is required');
      expect(result.errors).toContain('last_name is required');
    });
    
    test('should validate email format', () => {
      const invalidPerson = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'not-an-email'
      };
      
      const result = validatePersonSchema(invalidPerson);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
    
    test('should validate UUID format for assigned_to', () => {
      const invalidPerson = {
        first_name: 'John',
        last_name: 'Doe',
        assigned_to: 'not-a-uuid'
      };
      
      const result = validatePersonSchema(invalidPerson);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('assigned_to must be a valid UUID');
    });
    
    test('should validate JSON fields', () => {
      const invalidPerson = {
        first_name: 'John',
        last_name: 'Doe',
        custom_fields: 'not-valid-json'
      };
      
      const result = validatePersonSchema(invalidPerson);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('custom_fields must be valid JSON');
    });
    
    test('should validate array fields', () => {
      const invalidPerson = {
        first_name: 'John',
        last_name: 'Doe',
        tags: 'not-an-array'
      };
      
      const result = validatePersonSchema(invalidPerson);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('tags must be an array');
    });
  });
  
  describe('validateLeadExtensionSchema', () => {
    test('should validate a valid lead extension object', () => {
      const validLeadExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        readiness_score: 5,
        conversion_probability: 75
      };
      
      const result = validateLeadExtensionSchema(validLeadExt);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject if person_id is missing', () => {
      const invalidLeadExt = {
        readiness_score: 5
      };
      
      const result = validateLeadExtensionSchema(invalidLeadExt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('person_id is required');
    });
    
    test('should validate readiness_score range', () => {
      const invalidLeadExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        readiness_score: 11 // Outside valid range of 1-10
      };
      
      const result = validateLeadExtensionSchema(invalidLeadExt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`readiness_score must be between ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN} and ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX}`);
    });
    
    test('should validate conversion_probability range', () => {
      const invalidLeadExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        conversion_probability: 101 // Outside valid range of 0-100
      };
      
      const result = validateLeadExtensionSchema(invalidLeadExt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`conversion_probability must be between ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN} and ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX}`);
    });
  });
  
  describe('validateReferralExtensionSchema', () => {
    test('should validate a valid referral extension object', () => {
      const validReferralExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        conversion_probability: 50
      };
      
      const result = validateReferralExtensionSchema(validReferralExt);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject if person_id is missing', () => {
      const invalidReferralExt = {
        conversion_probability: 50
      };
      
      const result = validateReferralExtensionSchema(invalidReferralExt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('person_id is required');
    });
    
    test('should validate conversion_probability range', () => {
      const invalidReferralExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        conversion_probability: 101 // Outside valid range of 0-100
      };
      
      const result = validateReferralExtensionSchema(invalidReferralExt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`conversion_probability must be between ${SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MIN} and ${SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MAX}`);
    });
  });
  
  describe('validateMemberExtensionSchema', () => {
    test('should validate a valid member extension object', () => {
      const validMemberExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        billing_day: 15,
        satisfaction_score: 8
      };
      
      const result = validateMemberExtensionSchema(validMemberExt);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject if person_id is missing', () => {
      const invalidMemberExt = {
        billing_day: 15
      };
      
      const result = validateMemberExtensionSchema(invalidMemberExt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('person_id is required');
    });
    
    test('should validate billing_day range', () => {
      const invalidMemberExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        billing_day: 32 // Outside valid range of 1-31
      };
      
      const result = validateMemberExtensionSchema(invalidMemberExt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`billing_day must be between ${SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MIN} and ${SchemaConstraints.MEMBER_EXTENSION.BILLING_DAY_MAX}`);
    });
    
    test('should validate satisfaction_score range', () => {
      const invalidMemberExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        satisfaction_score: 11 // Outside valid range of 1-10
      };
      
      const result = validateMemberExtensionSchema(invalidMemberExt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`satisfaction_score must be between ${SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MIN} and ${SchemaConstraints.MEMBER_EXTENSION.SATISFACTION_SCORE_MAX}`);
    });
  });
  
  describe('validateRelationshipSchema', () => {
    test('should validate a valid relationship object', () => {
      const validRelationship = {
        person_a_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        person_b_id: 'a6c3d438-5e31-4099-b05f-a4e8d1f59606',
        relationship_type: 'referral',
        attribution_percentage: 50,
        relationship_level: 2
      };
      
      const result = validateRelationshipSchema(validRelationship);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject if required fields are missing', () => {
      const invalidRelationship = {
        person_a_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606'
      };
      
      const result = validateRelationshipSchema(invalidRelationship);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('person_b_id is required');
      expect(result.errors).toContain('relationship_type is required');
    });
    
    test('should validate attribution_percentage range', () => {
      const invalidRelationship = {
        person_a_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        person_b_id: 'a6c3d438-5e31-4099-b05f-a4e8d1f59606',
        relationship_type: 'referral',
        attribution_percentage: 101 // Outside valid range of 0-100
      };
      
      const result = validateRelationshipSchema(invalidRelationship);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`attribution_percentage must be between ${SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MIN} and ${SchemaConstraints.RELATIONSHIP.ATTRIBUTION_PERCENTAGE_MAX}`);
    });
    
    test('should validate relationship_level minimum', () => {
      const invalidRelationship = {
        person_a_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        person_b_id: 'a6c3d438-5e31-4099-b05f-a4e8d1f59606',
        relationship_type: 'referral',
        relationship_level: 0 // Below the valid minimum of 1
      };
      
      const result = validateRelationshipSchema(invalidRelationship);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`relationship_level must be at least ${SchemaConstraints.RELATIONSHIP.RELATIONSHIP_LEVEL_MIN}`);
    });
  });
  
  describe('validateInteractionSchema', () => {
    test('should validate a valid interaction object', () => {
      const validInteraction = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        user_id: 'a6c3d438-5e31-4099-b05f-a4e8d1f59606',
        interaction_type: 'call',
        subject: 'Follow-up call',
        scheduled_at: '2023-01-15T10:00:00Z'
      };
      
      const result = validateInteractionSchema(validInteraction);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject if person_id is missing', () => {
      const invalidInteraction = {
        user_id: 'a6c3d438-5e31-4099-b05f-a4e8d1f59606',
        interaction_type: 'call'
      };
      
      const result = validateInteractionSchema(invalidInteraction);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('person_id is required');
    });
    
    test('should validate UUID formats', () => {
      const invalidInteraction = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        user_id: 'not-a-uuid'
      };
      
      const result = validateInteractionSchema(invalidInteraction);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('user_id must be a valid UUID');
    });
  });
  
  describe('validateMessageSchema', () => {
    test('should validate a valid message object', () => {
      const validMessage = {
        sender_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        recipient_id: 'a6c3d438-5e31-4099-b05f-a4e8d1f59606',
        message_type: 'email',
        subject: 'Follow up',
        content: 'This is the message content'
      };
      
      const result = validateMessageSchema(validMessage);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject if required fields are missing', () => {
      const invalidMessage = {
        sender_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606'
      };
      
      const result = validateMessageSchema(invalidMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('recipient_id is required');
      expect(result.errors).toContain('message_type is required');
      expect(result.errors).toContain('content is required');
    });
    
    test('should validate UUID formats', () => {
      const invalidMessage = {
        sender_id: 'not-a-uuid',
        recipient_id: 'a6c3d438-5e31-4099-b05f-a4e8d1f59606',
        message_type: 'email',
        content: 'Content'
      };
      
      const result = validateMessageSchema(invalidMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('sender_id must be a valid UUID');
    });
  });
  
  describe('validateUserSchema', () => {
    test('should validate a valid user object', () => {
      const validUser = {
        email: 'user@example.com',
        password: 'password123',
        role: 'salesperson'
      };
      
      const result = validateUserSchema(validUser);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject if email is missing', () => {
      const invalidUser = {
        password: 'password123'
      };
      
      const result = validateUserSchema(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email is required');
    });
    
    test('should validate email format', () => {
      const invalidUser = {
        email: 'not-an-email',
        password: 'password123'
      };
      
      const result = validateUserSchema(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
    
    test('should validate role values', () => {
      const invalidUser = {
        email: 'user@example.com',
        password: 'password123',
        role: 'not-a-valid-role'
      };
      
      const result = validateUserSchema(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('role must be either "admin" or "salesperson"');
    });
    
    test('should require password for new users', () => {
      const invalidUser = {
        email: 'user@example.com'
      };
      
      const result = validateUserSchema(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('password is required for new users');
    });
    
    test('should not require password for existing users', () => {
      const existingUser = {
        id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        email: 'user@example.com'
      };
      
      const result = validateUserSchema(existingUser);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
}); 