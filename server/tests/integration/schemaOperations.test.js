/**
 * Schema Operations Integration Tests
 * Tests complex data operations across multiple tables to ensure schema constraints are enforced
 */

const request = require('supertest');
const { app, server } = require('../../app'); // Import your Express app
const { supabase } = require('../../db/supabase');

// Mock authentication middleware to bypass auth checks
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'admin' };
    next();
  }
}));

// Mock data returned by Supabase queries
jest.mock('../../db/supabase', () => {
  const mockData = {
    personData: {
      id: 'test-person-id',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      is_lead: true
    },
    leadData: {
      id: 'test-lead-id',
      person_id: 'test-person-id',
      lead_status: 'new',
      readiness_score: 5
    },
    interactionData: {
      id: 'test-interaction-id',
      person_id: 'test-person-id',
      interaction_type: 'call',
      status: 'scheduled'
    }
  };
  
  const mockSupabase = {
    from: jest.fn(table => {
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn(data => {
          // Validate data here to simulate DB constraints
          if (table === 'lead_extensions' && data.readiness_score > 10) {
            return { error: { message: 'readiness_score must be between 1 and 10' } };
          }
          if (table === 'referral_extensions' && data.conversion_probability > 100) {
            return { error: { message: 'conversion_probability must be between 0 and 100' } };
          }
          return { data: { ...data, id: `test-${table}-id` } };
        }),
        update: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        data: mockData[`${table}Data`] || { id: `test-${table}-id` }
      };
    })
  };
  
  return { supabase: mockSupabase };
});

describe('Complex Data Operations Integration Tests', () => {
  // Close the server after all tests
  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });
  
  describe('Person with Lead Extension Creation', () => {
    test('should create person and lead extension with valid data', async () => {
      const validPersonWithLead = {
        // Person data
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        is_lead: true,
        
        // Lead extension data
        lead_extension: {
          readiness_score: 7,
          lead_temperature: 'warm',
          conversion_probability: 65
        }
      };
      
      const response = await request(app)
        .post('/api/persons/with-extension')
        .send(validPersonWithLead);
      
      expect(response.status).toBe(201);
      expect(response.body.person).toBeTruthy();
      expect(response.body.extension).toBeTruthy();
    });
    
    test('should reject creation when lead extension has invalid data', async () => {
      const invalidPersonWithLead = {
        // Person data (valid)
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        is_lead: true,
        
        // Lead extension data (invalid)
        lead_extension: {
          readiness_score: 12, // Invalid - outside of 1-10 range
          lead_temperature: 'warm',
          conversion_probability: 65
        }
      };
      
      const response = await request(app)
        .post('/api/persons/with-extension')
        .send(invalidPersonWithLead);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/readiness_score must be between/i);
    });
  });
  
  describe('Referral Relationship Creation', () => {
    test('should create a referral relationship with valid data', async () => {
      const validReferralRelationship = {
        // The person making the referral
        referrer: {
          first_name: 'Existing',
          last_name: 'Member',
          email: 'existing.member@example.com',
          is_member: true
        },
        
        // The person being referred
        referee: {
          first_name: 'New',
          last_name: 'Prospect',
          email: 'new.prospect@example.com',
          is_referral: true
        },
        
        // Relationship data
        relationship: {
          relationship_type: 'referral',
          is_primary_referrer: true,
          attribution_percentage: 100,
          relationship_level: 1,
          referral_date: new Date().toISOString()
        },
        
        // Referral extension data
        referral_extension: {
          relationship_to_referrer: 'friend',
          relationship_strength: 'strong',
          conversion_probability: 80
        }
      };
      
      const response = await request(app)
        .post('/api/referrals/create-relationship')
        .send(validReferralRelationship);
      
      expect(response.status).toBe(201);
      expect(response.body.referrer).toBeTruthy();
      expect(response.body.referee).toBeTruthy();
      expect(response.body.relationship).toBeTruthy();
      expect(response.body.referral_extension).toBeTruthy();
    });
    
    test('should reject when referral extension has invalid data', async () => {
      const invalidReferralRelationship = {
        // The person making the referral
        referrer: {
          first_name: 'Existing',
          last_name: 'Member',
          email: 'existing.member@example.com',
          is_member: true
        },
        
        // The person being referred
        referee: {
          first_name: 'New',
          last_name: 'Prospect',
          email: 'new.prospect@example.com',
          is_referral: true
        },
        
        // Relationship data
        relationship: {
          relationship_type: 'referral',
          is_primary_referrer: true,
          attribution_percentage: 100,
          relationship_level: 1
        },
        
        // Referral extension data (invalid)
        referral_extension: {
          relationship_to_referrer: 'friend',
          relationship_strength: 'strong',
          conversion_probability: 101 // Invalid - outside 0-100 range
        }
      };
      
      const response = await request(app)
        .post('/api/referrals/create-relationship')
        .send(invalidReferralRelationship);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/conversion_probability must be between/i);
    });
  });
  
  describe('Member Upgrade from Lead', () => {
    test('should upgrade a lead to a member with valid data', async () => {
      const validMemberUpgrade = {
        person_id: 'test-person-id',
        // Member extension data
        member_extension: {
          membership_type: 'premium',
          membership_status: 'active',
          join_date: new Date().toISOString(),
          billing_day: 15,
          satisfaction_score: 8
        }
      };
      
      const response = await request(app)
        .post('/api/leads/convert-to-member')
        .send(validMemberUpgrade);
      
      expect(response.status).toBe(200);
      expect(response.body.person).toBeTruthy();
      expect(response.body.person.is_member).toBe(true);
      expect(response.body.member_extension).toBeTruthy();
    });
    
    test('should reject when member extension has invalid data', async () => {
      const invalidMemberUpgrade = {
        person_id: 'test-person-id',
        // Member extension data (invalid)
        member_extension: {
          membership_type: 'premium',
          membership_status: 'active',
          join_date: new Date().toISOString(),
          billing_day: 32, // Invalid - outside 1-31 range
          satisfaction_score: 8
        }
      };
      
      const response = await request(app)
        .post('/api/leads/convert-to-member')
        .send(invalidMemberUpgrade);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/billing_day must be between/i);
    });
  });
  
  describe('Interaction and Message Creation', () => {
    test('should create an interaction and associated message with valid data', async () => {
      const validInteractionWithMessage = {
        // Interaction data
        person_id: 'test-person-id',
        user_id: 'test-user-id',
        interaction_type: 'email',
        subject: 'Follow-up Email',
        content: 'Thank you for your interest in our services.',
        scheduled_at: new Date().toISOString(),
        
        // Message data
        send_message: true,
        message: {
          message_type: 'email',
          subject: 'Follow-up Email',
          content: 'Thank you for your interest in our services.'
        }
      };
      
      const response = await request(app)
        .post('/api/interactions/with-message')
        .send(validInteractionWithMessage);
      
      expect(response.status).toBe(201);
      expect(response.body.interaction).toBeTruthy();
      expect(response.body.message).toBeTruthy();
    });
    
    test('should reject when message has invalid data', async () => {
      const invalidInteractionWithMessage = {
        // Interaction data (valid)
        person_id: 'test-person-id',
        user_id: 'test-user-id',
        interaction_type: 'email',
        subject: 'Follow-up Email',
        content: 'Thank you for your interest in our services.',
        
        // Message data (invalid)
        send_message: true,
        message: {
          message_type: 'email',
          // Missing required content field
          subject: 'Follow-up Email'
        }
      };
      
      const response = await request(app)
        .post('/api/interactions/with-message')
        .send(invalidInteractionWithMessage);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.message).toMatch(/content is required/i);
    });
  });
}); 