/**
 * Schema Validation API Tests
 * Tests to ensure API endpoints validate data according to database schema constraints
 */

const request = require('supertest');
const { app, server } = require('../../app'); // Import your Express app
const { SchemaConstraints } = require('../../utils/schemaValidation');

// Mock authentication middleware to bypass auth checks
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'admin' };
    next();
  }
}));

// Mock database to avoid real DB operations
jest.mock('../../db/supabase', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    data: null
  };
  
  return { supabase: mockSupabase };
});

describe('API Schema Validation Tests', () => {
  // Close the server after all tests
  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });
  
  describe('Person API Validation', () => {
    test('should reject person creation with missing required fields', async () => {
      const invalidPerson = {
        email: 'test@example.com',
        // Missing required first_name and last_name
      };
      
      const response = await request(app)
        .post('/api/persons')
        .send(invalidPerson);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/first_name is required/i);
    });
    
    test('should reject person creation with invalid email format', async () => {
      const invalidPerson = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'not-an-email'
      };
      
      const response = await request(app)
        .post('/api/persons')
        .send(invalidPerson);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/invalid email format/i);
    });
  });
  
  describe('Lead Extension API Validation', () => {
    test('should reject lead extension with readiness_score outside valid range', async () => {
      const invalidLeadExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        readiness_score: 11 // Outside valid range of 1-10
      };
      
      const response = await request(app)
        .post('/api/leads')
        .send(invalidLeadExt);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/readiness_score must be between/i);
    });
    
    test('should reject lead extension with conversion_probability outside valid range', async () => {
      const invalidLeadExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        conversion_probability: 101 // Outside valid range of 0-100
      };
      
      const response = await request(app)
        .post('/api/leads')
        .send(invalidLeadExt);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/conversion_probability must be between/i);
    });
  });
  
  describe('Member Extension API Validation', () => {
    test('should reject member extension with billing_day outside valid range', async () => {
      const invalidMemberExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        billing_day: 32 // Outside valid range of 1-31
      };
      
      const response = await request(app)
        .post('/api/members')
        .send(invalidMemberExt);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/billing_day must be between/i);
    });
    
    test('should reject member extension with satisfaction_score outside valid range', async () => {
      const invalidMemberExt = {
        person_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        satisfaction_score: 0 // Outside valid range of 1-10
      };
      
      const response = await request(app)
        .post('/api/members')
        .send(invalidMemberExt);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/satisfaction_score must be between/i);
    });
  });
  
  describe('Relationship API Validation', () => {
    test('should reject relationship with missing required fields', async () => {
      const invalidRelationship = {
        person_a_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606'
        // Missing person_b_id and relationship_type
      };
      
      const response = await request(app)
        .post('/api/relationships')
        .send(invalidRelationship);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/person_b_id is required|relationship_type is required/i);
    });
    
    test('should reject relationship with attribution_percentage outside valid range', async () => {
      const invalidRelationship = {
        person_a_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        person_b_id: 'a6c3d438-5e31-4099-b05f-a4e8d1f59606',
        relationship_type: 'referral',
        attribution_percentage: 101 // Outside valid range of 0-100
      };
      
      const response = await request(app)
        .post('/api/relationships')
        .send(invalidRelationship);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/attribution_percentage must be between/i);
    });
  });
  
  describe('Message API Validation', () => {
    test('should reject message with missing required fields', async () => {
      const invalidMessage = {
        sender_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606'
        // Missing recipient_id, message_type, and content
      };
      
      const response = await request(app)
        .post('/api/messages')
        .send(invalidMessage);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/recipient_id is required|message_type is required|content is required/i);
    });
    
    test('should reject message with invalid UUID format', async () => {
      const invalidMessage = {
        sender_id: 'not-a-uuid',
        recipient_id: 'd6c3d438-5e31-4099-b05f-a4e8d1f59606',
        message_type: 'email',
        content: 'Test content'
      };
      
      const response = await request(app)
        .post('/api/messages')
        .send(invalidMessage);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/sender_id must be a valid UUID/i);
    });
  });
}); 