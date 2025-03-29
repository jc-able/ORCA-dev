/**
 * Referral Management End-to-End Test
 * 
 * This test covers the complete referral management flow:
 * 1. Login as a user
 * 2. Create a member (who will be the referrer)
 * 3. Create a referral from that member
 * 4. Retrieve referral details
 * 5. Update referral status
 * 6. Schedule an appointment for the referral
 * 7. Delete the referral
 */

const { request, app, loginTestUser, getAuthHeaders, uuidv4 } = require('./setup');
const memberModel = require('../../models/memberModel');
const referralModel = require('../../models/referralModel');
const relationshipModel = require('../../models/relationshipModel');
const { generatePerson } = require('../../utils/testDataGenerator');

// Mock the models
jest.mock('../../models/memberModel');
jest.mock('../../models/referralModel');
jest.mock('../../models/relationshipModel');

describe('Referral Management Flow', () => {
  let authToken;
  let userId;
  let createdMember;
  let createdReferral;
  
  beforeAll(async () => {
    // Login to get auth token
    const authData = await loginTestUser('salesperson@example.com');
    authToken = authData.token;
    userId = authData.user.id;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('1. Create a new member (referrer)', async () => {
    // Mock data
    const memberData = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '(123) 456-7890',
      membership_type: 'Premium',
      join_date: new Date().toISOString(),
      billing_day: 15
    };
    
    const mockCreatedMember = {
      id: uuidv4(),
      ...memberData,
      is_member: true,
      assigned_to: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_extensions: {
        id: uuidv4(),
        membership_type: memberData.membership_type,
        membership_status: 'active',
        join_date: memberData.join_date,
        billing_day: memberData.billing_day,
        created_at: new Date().toISOString()
      }
    };
    
    // Setup mock implementation
    memberModel.createMember.mockResolvedValue(mockCreatedMember);
    
    // Make the request
    const response = await request(app)
      .post('/api/members')
      .send(memberData)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('member');
    expect(memberModel.createMember).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: memberData.first_name,
        last_name: memberData.last_name,
        assigned_to: expect.any(String)
      })
    );
    
    // Save the created member for later tests
    createdMember = response.body.member;
  });
  
  test('2. Create a referral from the member', async () => {
    // Mock data
    const referralData = {
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob.johnson@example.com',
      phone: '(987) 654-3210',
      referrer_id: createdMember.id,
      relationship_to_referrer: 'Friend',
      referral_status: 'submitted'
    };
    
    const mockCreatedReferral = {
      id: uuidv4(),
      ...referralData,
      is_referral: true,
      referral_source: 'Member Referral',
      assigned_to: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      referral_extensions: {
        id: uuidv4(),
        person_id: uuidv4(), // Will be filled by the return value
        referral_status: referralData.referral_status,
        relationship_to_referrer: referralData.relationship_to_referrer,
        created_at: new Date().toISOString()
      },
      relationships: [
        {
          id: uuidv4(),
          person_a_id: createdMember.id,
          person_b_id: uuidv4(), // Will be filled by the return value
          relationship_type: 'referral',
          direction: 'outgoing',
          referral_date: new Date().toISOString(),
          is_primary_referrer: true,
          created_at: new Date().toISOString()
        }
      ]
    };
    
    // Update IDs to be consistent
    mockCreatedReferral.referral_extensions.person_id = mockCreatedReferral.id;
    mockCreatedReferral.relationships[0].person_b_id = mockCreatedReferral.id;
    
    // Setup mock implementation
    referralModel.createReferral.mockResolvedValue(mockCreatedReferral);
    
    // Make the request
    const response = await request(app)
      .post('/api/referrals')
      .send(referralData)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('referral');
    expect(referralModel.createReferral).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: referralData.first_name,
        last_name: referralData.last_name,
        referrer_id: createdMember.id,
        assigned_to: expect.any(String)
      })
    );
    
    // Save the created referral for later tests
    createdReferral = response.body.referral;
  });
  
  test('3. Retrieve referral details', async () => {
    // Mock data
    const mockReferral = { ...createdReferral };
    
    // Setup mock implementation
    referralModel.getReferralById.mockResolvedValue(mockReferral);
    
    // Make the request
    const response = await request(app)
      .get(`/api/referrals/${mockReferral.id}`)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('referral');
    expect(response.body.referral).toEqual(mockReferral);
    expect(referralModel.getReferralById).toHaveBeenCalledWith(mockReferral.id);
  });
  
  test('4. Update referral status', async () => {
    // Mock data
    const updateData = {
      referral_extensions: {
        referral_status: 'contacted'
      },
      notes: 'Made initial contact via phone'
    };
    
    const updatedReferral = {
      ...createdReferral,
      notes: updateData.notes,
      referral_extensions: {
        ...createdReferral.referral_extensions,
        referral_status: updateData.referral_extensions.referral_status
      },
      updated_at: new Date().toISOString()
    };
    
    // Setup mock implementation
    referralModel.updateReferral.mockResolvedValue(updatedReferral);
    
    // Make the request
    const response = await request(app)
      .put(`/api/referrals/${createdReferral.id}`)
      .send(updateData)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('referral');
    expect(response.body.referral.referral_extensions.referral_status).toBe('contacted');
    expect(referralModel.updateReferral).toHaveBeenCalledWith(
      createdReferral.id,
      updateData
    );
    
    // Update the referral reference
    createdReferral = updatedReferral;
  });
  
  test('5. Schedule an appointment for the referral', async () => {
    // Mock data
    const appointmentData = {
      appointment_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      appointment_status: 'scheduled'
    };
    
    const updateData = {
      referral_extensions: {
        ...appointmentData,
        referral_status: 'appointment_scheduled'
      }
    };
    
    const updatedReferral = {
      ...createdReferral,
      referral_extensions: {
        ...createdReferral.referral_extensions,
        ...appointmentData,
        referral_status: 'appointment_scheduled'
      },
      updated_at: new Date().toISOString()
    };
    
    // Setup mock implementation
    referralModel.updateReferral.mockResolvedValue(updatedReferral);
    
    // Make the request
    const response = await request(app)
      .put(`/api/referrals/${createdReferral.id}/appointment`)
      .send(appointmentData)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('referral');
    expect(response.body.referral.referral_extensions.appointment_date).toBe(appointmentData.appointment_date);
    expect(response.body.referral.referral_extensions.referral_status).toBe('appointment_scheduled');
    expect(referralModel.updateReferral).toHaveBeenCalledWith(
      createdReferral.id,
      expect.objectContaining(updateData)
    );
    
    // Update the referral reference
    createdReferral = updatedReferral;
  });
  
  test('6. Get referral network for the member', async () => {
    // Mock data
    const mockNetwork = {
      nodes: [
        { id: createdMember.id, type: 'member', name: `${createdMember.first_name} ${createdMember.last_name}` },
        { id: createdReferral.id, type: 'referral', name: `${createdReferral.first_name} ${createdReferral.last_name}` }
      ],
      links: [
        { 
          source: createdMember.id, 
          target: createdReferral.id, 
          type: 'referral',
          strength: 'strong' 
        }
      ]
    };
    
    // Setup mock implementation
    relationshipModel.getReferralNetwork.mockResolvedValue(mockNetwork);
    
    // Make the request
    const response = await request(app)
      .get(`/api/relationships/network/${createdMember.id}`)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('network');
    expect(response.body.network).toEqual(mockNetwork);
    expect(relationshipModel.getReferralNetwork).toHaveBeenCalledWith(createdMember.id);
  });
  
  test('7. Delete the referral', async () => {
    // Setup mock implementation
    referralModel.deleteReferral.mockResolvedValue(true);
    
    // Make the request
    const response = await request(app)
      .delete(`/api/referrals/${createdReferral.id}`)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(referralModel.deleteReferral).toHaveBeenCalledWith(createdReferral.id);
  });
  
  test('8. Delete the member (cleanup)', async () => {
    // Setup mock implementation
    memberModel.deleteMember.mockResolvedValue(true);
    
    // Make the request
    const response = await request(app)
      .delete(`/api/members/${createdMember.id}`)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(memberModel.deleteMember).toHaveBeenCalledWith(createdMember.id);
  });
}); 