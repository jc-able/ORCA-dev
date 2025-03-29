/**
 * Tests for the Person Model
 * 
 * These tests verify that the Person model correctly interacts with the Supabase database
 * and properly handles its relationships with extensions (lead, referral, member).
 */

const personModel = require('../../models/personModel');
const { generatePerson } = require('../../utils/testDataGenerator');
const supabase = require('../../config/supabase');

// Mock Supabase client
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
  contains: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis()
}));

// Sample person data
const mockPerson = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  phone: '1234567890',
  secondary_phone: null,
  address: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' },
  dob: '1990-01-01',
  gender: 'female',
  is_lead: true,
  is_referral: false,
  is_member: false,
  assigned_to: '123e4567-e89b-12d3-a456-426614174000',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Sample lead extension data
const mockLeadExtension = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  person_id: mockPerson.id,
  lead_status: 'new',
  lead_temperature: 'warm',
  decision_timeline: 'within_week',
  readiness_score: 7,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Full person with extension
const mockPersonWithExtension = {
  ...mockPerson,
  lead_extensions: mockLeadExtension
};

describe('Person Model', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  describe('getAllPersons', () => {
    it('should retrieve all persons without filters', async () => {
      // Mock data
      const mockPersons = [generatePerson(), generatePerson()];
      
      // Setup the mock return value
      supabase.range.mockImplementation(() => ({
        data: mockPersons,
        error: null
      }));
      
      // Call the function
      const result = await personModel.getAllPersons();
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockPersons);
    });
    
    it('should apply filters correctly', async () => {
      // Mock data
      const mockPersons = [generatePerson({ is_lead: true })];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockPersons,
        error: null
      }));
      
      // Call with filters
      const filters = {
        isLead: true,
        searchTerm: 'john'
      };
      
      await personModel.getAllPersons(filters);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('is_lead', true);
      expect(supabase.or).toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.range.mockImplementation(() => ({
        data: null,
        error: new Error('Database error')
      }));
      
      // Call and expect rejection
      await expect(personModel.getAllPersons()).rejects.toThrow('Database error');
    });
  });

  describe('getPersonById', () => {
    it('should retrieve a person by ID', async () => {
      // Mock data
      const mockPerson = generatePerson();
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: mockPerson,
        error: null
      }));
      
      // Call the function
      const result = await personModel.getPersonById(mockPerson.id);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', mockPerson.id);
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockPerson);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.single.mockImplementation(() => ({
        data: null,
        error: new Error('Person not found')
      }));
      
      // Call and expect rejection
      await expect(personModel.getPersonById('invalid-id')).rejects.toThrow('Person not found');
    });
  });

  describe('createPerson', () => {
    it('should create a new person', async () => {
      // Mock data
      const personData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '(123) 456-7890',
        is_lead: true
      };
      
      const createdPerson = {
        ...personData,
        id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: createdPerson,
        error: null
      }));
      
      // Call the function
      const result = await personModel.createPerson(personData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.insert).toHaveBeenCalled();
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(createdPerson);
    });
    
    it('should create a person with lead extension', async () => {
      // Mock data
      const personData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        is_lead: true
      };
      
      const extensionData = {
        leadExtension: {
          lead_status: 'new',
          lead_temperature: 'hot'
        }
      };
      
      const createdPerson = {
        ...personData,
        id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Setup the mocks
      supabase.single.mockImplementation(() => ({
        data: createdPerson,
        error: null
      }));
      
      supabase.insert.mockImplementationOnce(() => ({
        data: [createdPerson],
        error: null
      })).mockImplementationOnce(() => ({
        data: { id: 'ext-123', ...extensionData.leadExtension, person_id: createdPerson.id },
        error: null
      }));
      
      // Call the function
      await personModel.createPerson(personData, extensionData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.from).toHaveBeenCalledWith('lead_extensions');
      expect(supabase.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('updatePerson', () => {
    test('should update a person and its extension', async () => {
      // Mock the update operations
      supabase.update.mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      }));

      // Mock the final getPersonById call to return updated data
      supabase.from.mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      })).mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      })).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockPersonWithExtension, first_name: 'Updated' },
              error: null
            })
          })
        })
      }));

      const updateData = { first_name: 'Updated' };
      const extensionData = {
        leadExtension: { readiness_score: 8 }
      };

      const result = await personModel.updatePerson(
        mockPerson.id, 
        updateData, 
        extensionData
      );
      
      // The result should include the updated name
      expect(result.first_name).toBe('Updated');
    });
  });

  describe('deletePerson', () => {
    test('should delete a person successfully', async () => {
      // Mock Supabase response
      supabase.delete.mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      }));

      const result = await personModel.deletePerson(mockPerson.id);
      
      // Verify result
      expect(result).toBe(true);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.delete().eq).toHaveBeenCalledWith('id', mockPerson.id);
    });
  });
}); 