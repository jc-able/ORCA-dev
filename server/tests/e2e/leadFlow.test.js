/**
 * Lead Management End-to-End Test
 * 
 * This test covers the complete lead management flow:
 * 1. Login as a user
 * 2. Create a new lead
 * 3. Retrieve lead details
 * 4. Update lead status
 * 5. Add an interaction with the lead
 * 6. Delete the lead
 */

const { request, app, loginTestUser, getAuthHeaders, uuidv4 } = require('./setup');
const leadModel = require('../../models/leadModel');
const interactionModel = require('../../models/interactionModel');
const { generatePerson, generateLeadExtension } = require('../../utils/testDataGenerator');

// Mock the models
jest.mock('../../models/leadModel');
jest.mock('../../models/interactionModel');

describe('Lead Management Flow', () => {
  let authToken;
  let userId;
  let createdLead;
  
  beforeAll(async () => {
    // Login to get auth token
    const authData = await loginTestUser('salesperson@example.com');
    authToken = authData.token;
    userId = authData.user.id;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('1. Create a new lead', async () => {
    // Mock data
    const leadData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '(123) 456-7890',
      lead_status: 'new',
      acquisition_source: 'Website'
    };
    
    const mockCreatedLead = {
      id: uuidv4(),
      ...leadData,
      is_lead: true,
      assigned_to: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lead_extensions: {
        id: uuidv4(),
        lead_status: leadData.lead_status,
        created_at: new Date().toISOString()
      }
    };
    
    // Setup mock implementation
    leadModel.createLead.mockResolvedValue(mockCreatedLead);
    
    // Make the request
    const response = await request(app)
      .post('/api/leads')
      .send(leadData)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('lead');
    expect(leadModel.createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        assigned_to: expect.any(String)
      })
    );
    
    // Save the created lead for later tests
    createdLead = response.body.lead;
  });
  
  test('2. Retrieve lead details', async () => {
    // Mock data
    const mockLead = { ...createdLead };
    
    // Setup mock implementation
    leadModel.getLeadById.mockResolvedValue(mockLead);
    
    // Make the request
    const response = await request(app)
      .get(`/api/leads/${mockLead.id}`)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead');
    expect(response.body.lead).toEqual(mockLead);
    expect(leadModel.getLeadById).toHaveBeenCalledWith(mockLead.id);
  });
  
  test('3. Update lead status', async () => {
    // Mock data
    const updateData = {
      lead_extensions: {
        lead_status: 'qualified'
      },
      notes: 'Lead shows high interest in our premium offering'
    };
    
    const updatedLead = {
      ...createdLead,
      notes: updateData.notes,
      lead_extensions: {
        ...createdLead.lead_extensions,
        lead_status: updateData.lead_extensions.lead_status
      },
      updated_at: new Date().toISOString()
    };
    
    // Setup mock implementation
    leadModel.updateLead.mockResolvedValue(updatedLead);
    
    // Make the request
    const response = await request(app)
      .put(`/api/leads/${createdLead.id}`)
      .send(updateData)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead');
    expect(response.body.lead.lead_extensions.lead_status).toBe('qualified');
    expect(leadModel.updateLead).toHaveBeenCalledWith(
      createdLead.id,
      updateData
    );
    
    // Update the lead reference
    createdLead = updatedLead;
  });
  
  test('4. Add an interaction with the lead', async () => {
    // Mock data
    const interactionData = {
      person_id: createdLead.id,
      interaction_type: 'call',
      subject: 'Follow-up call',
      content: 'Discussed premium membership options and pricing',
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_minutes: 15
    };
    
    const createdInteraction = {
      id: uuidv4(),
      ...interactionData,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Setup mock implementation
    interactionModel.createInteraction.mockResolvedValue(createdInteraction);
    
    // Make the request
    const response = await request(app)
      .post('/api/interactions')
      .send(interactionData)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('interaction');
    expect(interactionModel.createInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        person_id: createdLead.id,
        user_id: userId,
        interaction_type: interactionData.interaction_type
      })
    );
  });
  
  test('5. Delete the lead', async () => {
    // Setup mock implementation
    leadModel.deleteLead.mockResolvedValue(true);
    
    // Make the request
    const response = await request(app)
      .delete(`/api/leads/${createdLead.id}`)
      .set(getAuthHeaders(authToken));
    
    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(leadModel.deleteLead).toHaveBeenCalledWith(createdLead.id);
  });
}); 