/**
 * Lead Routes API Tests
 */
const { request, createTestApp, getTestHeaders, uuidv4 } = require('./setup');
const leadRoutes = require('../../routes/leadRoutes');
const leadModel = require('../../models/leadModel');
const { generatePerson, generateLeadExtension } = require('../../utils/testDataGenerator');
const supabase = require('../../config/supabase');

// Mock the lead model
jest.mock('../../models/leadModel');

describe('Lead Routes API', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp(leadRoutes);
    jest.clearAllMocks();
  });
  
  describe('GET /leads', () => {
    it('should return a list of leads', async () => {
      // Mock data
      const mockLeadPerson = generatePerson({ is_lead: true });
      const mockLeadExtension = generateLeadExtension(mockLeadPerson.id);
      const mockLeads = [{
        ...mockLeadPerson,
        lead_extensions: mockLeadExtension
      }];
      
      // Setup mock implementation
      leadModel.getAllLeads.mockResolvedValue(mockLeads);
      
      // Make the request
      const response = await request(app)
        .get('/leads')
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ leads: mockLeads });
      expect(leadModel.getAllLeads).toHaveBeenCalled();
    });
    
    it('should handle filtering parameters', async () => {
      // Mock data
      const mockLeadPerson = generatePerson({ is_lead: true });
      const mockLeadExtension = generateLeadExtension(mockLeadPerson.id, { lead_status: 'qualified' });
      const mockLeads = [{
        ...mockLeadPerson,
        lead_extensions: mockLeadExtension
      }];
      
      // Setup mock implementation
      leadModel.getAllLeads.mockResolvedValue(mockLeads);
      
      // Make the request with filters
      const response = await request(app)
        .get('/leads')
        .query({ 
          status: 'qualified',
          search: 'Smith'
        })
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ leads: mockLeads });
      expect(leadModel.getAllLeads).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'qualified',
          searchTerm: 'Smith'
        })
      );
    });
    
    it('should handle errors', async () => {
      // Setup mock implementation
      leadModel.getAllLeads.mockRejectedValue(new Error('Database error'));
      
      // Make the request
      const response = await request(app)
        .get('/leads')
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /leads/:id', () => {
    it('should return a single lead by ID', async () => {
      // Mock data
      const leadId = uuidv4();
      const mockLeadPerson = generatePerson({ id: leadId, is_lead: true });
      const mockLeadExtension = generateLeadExtension(leadId);
      const mockLead = {
        ...mockLeadPerson,
        lead_extensions: mockLeadExtension
      };
      
      // Setup mock implementation
      leadModel.getLeadById.mockResolvedValue(mockLead);
      
      // Make the request
      const response = await request(app)
        .get(`/leads/${leadId}`)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ lead: mockLead });
      expect(leadModel.getLeadById).toHaveBeenCalledWith(leadId);
    });
    
    it('should handle not found errors', async () => {
      // Setup mock implementation
      leadModel.getLeadById.mockRejectedValue(new Error('Lead not found'));
      
      // Make the request
      const response = await request(app)
        .get(`/leads/${uuidv4()}`)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /leads', () => {
    it('should create a new lead', async () => {
      // Mock data
      const leadData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '(123) 456-7890',
        lead_status: 'new'
      };
      
      const createdLead = {
        id: uuidv4(),
        ...leadData,
        is_lead: true,
        created_at: new Date().toISOString(),
        lead_extensions: {
          id: uuidv4(),
          lead_status: leadData.lead_status
        }
      };
      
      // Setup mock implementation
      leadModel.createLead.mockResolvedValue(createdLead);
      
      // Make the request
      const response = await request(app)
        .post('/leads')
        .send(leadData)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ lead: createdLead });
      expect(leadModel.createLead).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          assigned_to: expect.any(String) // From the test headers
        })
      );
    });
    
    it('should handle validation errors', async () => {
      // Mock data with missing required fields
      const invalidLeadData = {
        email: 'john.doe@example.com'
        // Missing first_name and last_name
      };
      
      // Setup mock implementation
      leadModel.createLead.mockRejectedValue(new Error('first_name and last_name are required'));
      
      // Make the request
      const response = await request(app)
        .post('/leads')
        .send(invalidLeadData)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /leads/:id', () => {
    it('should update a lead', async () => {
      // Mock data
      const leadId = uuidv4();
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        lead_extensions: {
          lead_status: 'qualified'
        }
      };
      
      const updatedLead = {
        id: leadId,
        ...updateData,
        is_lead: true,
        updated_at: new Date().toISOString()
      };
      
      // Setup mock implementation
      leadModel.updateLead.mockResolvedValue(updatedLead);
      
      // Make the request
      const response = await request(app)
        .put(`/leads/${leadId}`)
        .send(updateData)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ lead: updatedLead });
      expect(leadModel.updateLead).toHaveBeenCalledWith(leadId, updateData);
    });
    
    it('should handle not found errors', async () => {
      // Setup mock implementation
      leadModel.updateLead.mockRejectedValue(new Error('Lead not found'));
      
      // Make the request
      const response = await request(app)
        .put(`/leads/${uuidv4()}`)
        .send({ first_name: 'Test' })
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('DELETE /leads/:id', () => {
    it('should delete a lead', async () => {
      // Mock data
      const leadId = uuidv4();
      
      // Setup mock implementation
      leadModel.deleteLead.mockResolvedValue(true);
      
      // Make the request
      const response = await request(app)
        .delete(`/leads/${leadId}`)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Lead deleted successfully' });
      expect(leadModel.deleteLead).toHaveBeenCalledWith(leadId);
    });
    
    it('should handle not found errors', async () => {
      // Setup mock implementation
      leadModel.deleteLead.mockRejectedValue(new Error('Lead not found'));
      
      // Make the request
      const response = await request(app)
        .delete(`/leads/${uuidv4()}`)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 