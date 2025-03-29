/**
 * Lead Model Tests
 */
const leadModel = require('../../models/leadModel');
const { generatePerson, generateLeadExtension } = require('../../utils/testDataGenerator');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../../config/supabase');

// Mock Supabase
jest.mock('../../config/supabase', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis()
}));

describe('Lead Model', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });
  
  describe('getAllLeads', () => {
    it('should retrieve all leads without filters', async () => {
      // Mock data
      const mockLeadPerson = generatePerson({ is_lead: true });
      const mockLeadExtension = generateLeadExtension(mockLeadPerson.id);
      const mockLeads = [{
        ...mockLeadPerson,
        lead_extensions: mockLeadExtension
      }];
      
      // Setup the mock return value
      supabase.range.mockImplementation(() => ({
        data: mockLeads,
        error: null
      }));
      
      // Call the function
      const result = await leadModel.getAllLeads();
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, lead_extensions(*)');
      expect(supabase.match).toHaveBeenCalledWith({ is_lead: true });
      expect(supabase.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockLeads);
    });
    
    it('should apply filters correctly', async () => {
      // Mock data
      const assignedTo = uuidv4();
      const mockLeadPerson = generatePerson({ is_lead: true, assigned_to: assignedTo });
      const mockLeadExtension = generateLeadExtension(mockLeadPerson.id, { lead_status: 'qualified' });
      const mockLeads = [{
        ...mockLeadPerson,
        lead_extensions: mockLeadExtension
      }];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockLeads,
        error: null
      }));
      
      // Call with filters
      const filters = {
        assignedTo,
        status: 'qualified',
        searchTerm: 'Smith'
      };
      
      await leadModel.getAllLeads(filters);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, lead_extensions(*)');
      expect(supabase.match).toHaveBeenCalledWith({ is_lead: true });
      expect(supabase.eq).toHaveBeenCalledWith('assigned_to', assignedTo);
      // Additional assertions for other filters would go here
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.range.mockImplementation(() => ({
        data: null,
        error: new Error('Database error')
      }));
      
      // Call and expect rejection
      await expect(leadModel.getAllLeads()).rejects.toThrow('Database error');
    });
  });
  
  describe('getLeadById', () => {
    it('should retrieve a lead by ID', async () => {
      // Mock data
      const mockLeadPerson = generatePerson({ is_lead: true });
      const mockLeadExtension = generateLeadExtension(mockLeadPerson.id);
      const mockLead = {
        ...mockLeadPerson,
        lead_extensions: mockLeadExtension
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: mockLead,
        error: null
      }));
      
      // Call the function
      const result = await leadModel.getLeadById(mockLeadPerson.id);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, lead_extensions(*)');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockLeadPerson.id);
      expect(supabase.eq).toHaveBeenCalledWith('is_lead', true);
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockLead);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.single.mockImplementation(() => ({
        data: null,
        error: new Error('Lead not found')
      }));
      
      // Call and expect rejection
      await expect(leadModel.getLeadById('invalid-id')).rejects.toThrow('Lead not found');
    });
  });
  
  describe('createLead', () => {
    it('should create a new lead', async () => {
      // Mock data
      const leadData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '(123) 456-7890',
        lead_status: 'new',
        acquisition_source: 'Website',
        assigned_to: uuidv4()
      };
      
      const createdPerson = {
        id: uuidv4(),
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        email: leadData.email,
        phone: leadData.phone,
        is_lead: true,
        acquisition_source: leadData.acquisition_source,
        assigned_to: leadData.assigned_to,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createdLeadExtension = {
        id: uuidv4(),
        person_id: createdPerson.id,
        lead_status: leadData.lead_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createdLead = {
        ...createdPerson,
        lead_extensions: createdLeadExtension
      };
      
      // Setup the mocks for the transaction steps
      supabase.single.mockImplementationOnce(() => ({
        data: createdPerson,
        error: null
      })).mockImplementationOnce(() => ({
        data: createdLeadExtension,
        error: null
      })).mockImplementationOnce(() => ({
        data: createdLead,
        error: null
      }));
      
      // Call the function
      const result = await leadModel.createLead(leadData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(createdLead);
    });
    
    it('should reject if required fields are missing', async () => {
      // Call with missing required fields
      const leadData = {
        email: 'john.doe@example.com'
        // Missing first_name and last_name
      };
      
      // Call and expect rejection
      await expect(leadModel.createLead(leadData))
        .rejects.toThrow('first_name and last_name are required');
    });
  });
  
  describe('updateLead', () => {
    it('should update an existing lead', async () => {
      // Mock data
      const leadId = uuidv4();
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        lead_extensions: {
          lead_status: 'qualified'
        }
      };
      
      const updatedPerson = {
        id: leadId,
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        is_lead: true,
        updated_at: new Date().toISOString()
      };
      
      const updatedLeadExtension = {
        id: uuidv4(),
        person_id: leadId,
        lead_status: updateData.lead_extensions.lead_status,
        updated_at: new Date().toISOString()
      };
      
      const updatedLead = {
        ...updatedPerson,
        lead_extensions: updatedLeadExtension
      };
      
      // Setup the mocks
      supabase.single.mockImplementationOnce(() => ({
        data: updatedPerson,
        error: null
      })).mockImplementationOnce(() => ({
        data: updatedLeadExtension,
        error: null
      })).mockImplementationOnce(() => ({
        data: updatedLead,
        error: null
      }));
      
      // Call the function
      const result = await leadModel.updateLead(leadId, updateData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.update).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', leadId);
      expect(result).toEqual(updatedLead);
    });
  });
  
  describe('deleteLead', () => {
    it('should delete a lead', async () => {
      // Mock data
      const leadId = uuidv4();
      
      // Setup the mock
      supabase.delete.mockImplementation(() => ({
        error: null
      }));
      
      // Call the function
      const result = await leadModel.deleteLead(leadId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', leadId);
      expect(result).toBe(true);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.delete.mockImplementation(() => ({
        error: new Error('Delete failed')
      }));
      
      // Call and expect rejection
      await expect(leadModel.deleteLead('invalid-id')).rejects.toThrow('Delete failed');
    });
  });
  
  describe('getLeadsByStatus', () => {
    it('should retrieve leads by status', async () => {
      // Mock data
      const status = 'qualified';
      const mockLeadPerson = generatePerson({ is_lead: true });
      const mockLeadExtension = generateLeadExtension(mockLeadPerson.id, { lead_status: status });
      const mockLeads = [{
        ...mockLeadPerson,
        lead_extensions: mockLeadExtension
      }];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockLeads,
        error: null
      }));
      
      // Call the function
      const result = await leadModel.getLeadsByStatus(status);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, lead_extensions(*)');
      expect(supabase.match).toHaveBeenCalledWith({ is_lead: true });
      expect(result).toEqual(mockLeads);
    });
  });
  
  describe('getLeadCountByStatus', () => {
    it('should get lead counts by status', async () => {
      // Mock data
      const mockCounts = {
        new: 5,
        contacted: 3,
        qualified: 2,
        proposal: 1,
        closed_won: 0,
        closed_lost: 1
      };
      
      // Setup mock implementations for each status query
      Object.keys(mockCounts).forEach(status => {
        supabase.range.mockImplementationOnce(() => ({
          data: Array(mockCounts[status]).fill({}),
          error: null,
          count: mockCounts[status]
        }));
      });
      
      // Call the function
      const result = await leadModel.getLeadCountByStatus();
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.match).toHaveBeenCalledWith({ is_lead: true });
      expect(result).toEqual(mockCounts);
    });
  });
}); 