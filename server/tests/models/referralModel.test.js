/**
 * Referral Model Tests
 */
const referralModel = require('../../models/referralModel');
const { generatePerson, generateReferralExtension } = require('../../utils/testDataGenerator');
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

describe('Referral Model', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });
  
  describe('getAllReferrals', () => {
    it('should retrieve all referrals without filters', async () => {
      // Mock data
      const mockReferralPerson = generatePerson({ is_referral: true });
      const mockReferralExtension = generateReferralExtension(mockReferralPerson.id);
      const mockReferrals = [{
        ...mockReferralPerson,
        referral_extensions: mockReferralExtension
      }];
      
      // Setup the mock return value
      supabase.range.mockImplementation(() => ({
        data: mockReferrals,
        error: null
      }));
      
      // Call the function
      const result = await referralModel.getAllReferrals();
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, referral_extensions(*)');
      expect(supabase.match).toHaveBeenCalledWith({ is_referral: true });
      expect(supabase.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockReferrals);
    });
    
    it('should apply filters correctly', async () => {
      // Mock data
      const assignedTo = uuidv4();
      const mockReferralPerson = generatePerson({ is_referral: true, assigned_to: assignedTo });
      const mockReferralExtension = generateReferralExtension(mockReferralPerson.id, { referral_status: 'contacted' });
      const mockReferrals = [{
        ...mockReferralPerson,
        referral_extensions: mockReferralExtension
      }];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockReferrals,
        error: null
      }));
      
      // Call with filters
      const filters = {
        assignedTo,
        status: 'contacted',
        searchTerm: 'Smith'
      };
      
      await referralModel.getAllReferrals(filters);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, referral_extensions(*)');
      expect(supabase.match).toHaveBeenCalledWith({ is_referral: true });
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
      await expect(referralModel.getAllReferrals()).rejects.toThrow('Database error');
    });
  });
  
  describe('getReferralById', () => {
    it('should retrieve a referral by ID', async () => {
      // Mock data
      const mockReferralPerson = generatePerson({ is_referral: true });
      const mockReferralExtension = generateReferralExtension(mockReferralPerson.id);
      const mockReferral = {
        ...mockReferralPerson,
        referral_extensions: mockReferralExtension
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: mockReferral,
        error: null
      }));
      
      // Call the function
      const result = await referralModel.getReferralById(mockReferralPerson.id);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, referral_extensions(*)');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockReferralPerson.id);
      expect(supabase.eq).toHaveBeenCalledWith('is_referral', true);
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockReferral);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.single.mockImplementation(() => ({
        data: null,
        error: new Error('Referral not found')
      }));
      
      // Call and expect rejection
      await expect(referralModel.getReferralById('invalid-id')).rejects.toThrow('Referral not found');
    });
  });
  
  describe('createReferral', () => {
    it('should create a new referral', async () => {
      // Mock data
      const referrerId = uuidv4();
      const referralData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '(123) 456-7890',
        referral_status: 'submitted',
        referrer_id: referrerId,
        relationship_to_referrer: 'Friend',
        assigned_to: uuidv4()
      };
      
      const createdPerson = {
        id: uuidv4(),
        first_name: referralData.first_name,
        last_name: referralData.last_name,
        email: referralData.email,
        phone: referralData.phone,
        is_referral: true,
        referral_source: 'Member Referral',
        assigned_to: referralData.assigned_to,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createdReferralExtension = {
        id: uuidv4(),
        person_id: createdPerson.id,
        referral_status: referralData.referral_status,
        relationship_to_referrer: referralData.relationship_to_referrer,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createdRelationship = {
        id: uuidv4(),
        person_a_id: referrerId,
        person_b_id: createdPerson.id,
        relationship_type: 'referral',
        direction: 'outgoing',
        referral_date: new Date().toISOString(),
        is_primary_referrer: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createdReferral = {
        ...createdPerson,
        referral_extensions: createdReferralExtension,
        relationships: [createdRelationship]
      };
      
      // Setup the mocks for the transaction steps
      supabase.single.mockImplementationOnce(() => ({
        data: createdPerson,
        error: null
      })).mockImplementationOnce(() => ({
        data: createdReferralExtension,
        error: null
      })).mockImplementationOnce(() => ({
        data: createdRelationship,
        error: null
      })).mockImplementationOnce(() => ({
        data: createdReferral,
        error: null
      }));
      
      // Call the function
      const result = await referralModel.createReferral(referralData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(createdReferral);
    });
    
    it('should reject if required fields are missing', async () => {
      // Call with missing required fields
      const referralData = {
        email: 'john.doe@example.com',
        // Missing first_name, last_name, and referrer_id
      };
      
      // Call and expect rejection
      await expect(referralModel.createReferral(referralData))
        .rejects.toThrow('first_name, last_name, and referrer_id are required');
    });
  });
  
  describe('updateReferral', () => {
    it('should update an existing referral', async () => {
      // Mock data
      const referralId = uuidv4();
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        referral_extensions: {
          referral_status: 'contacted',
          appointment_date: new Date().toISOString()
        }
      };
      
      const updatedPerson = {
        id: referralId,
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        is_referral: true,
        updated_at: new Date().toISOString()
      };
      
      const updatedReferralExtension = {
        id: uuidv4(),
        person_id: referralId,
        referral_status: updateData.referral_extensions.referral_status,
        appointment_date: updateData.referral_extensions.appointment_date,
        updated_at: new Date().toISOString()
      };
      
      const updatedReferral = {
        ...updatedPerson,
        referral_extensions: updatedReferralExtension
      };
      
      // Setup the mocks
      supabase.single.mockImplementationOnce(() => ({
        data: updatedPerson,
        error: null
      })).mockImplementationOnce(() => ({
        data: updatedReferralExtension,
        error: null
      })).mockImplementationOnce(() => ({
        data: updatedReferral,
        error: null
      }));
      
      // Call the function
      const result = await referralModel.updateReferral(referralId, updateData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.update).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', referralId);
      expect(result).toEqual(updatedReferral);
    });
  });
  
  describe('deleteReferral', () => {
    it('should delete a referral', async () => {
      // Mock data
      const referralId = uuidv4();
      
      // Setup the mock
      supabase.delete.mockImplementation(() => ({
        error: null
      }));
      
      // Call the function
      const result = await referralModel.deleteReferral(referralId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', referralId);
      expect(result).toBe(true);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.delete.mockImplementation(() => ({
        error: new Error('Delete failed')
      }));
      
      // Call and expect rejection
      await expect(referralModel.deleteReferral('invalid-id')).rejects.toThrow('Delete failed');
    });
  });
  
  describe('getReferralsByStatus', () => {
    it('should retrieve referrals by status', async () => {
      // Mock data
      const status = 'contacted';
      const mockReferralPerson = generatePerson({ is_referral: true });
      const mockReferralExtension = generateReferralExtension(mockReferralPerson.id, { referral_status: status });
      const mockReferrals = [{
        ...mockReferralPerson,
        referral_extensions: mockReferralExtension
      }];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockReferrals,
        error: null
      }));
      
      // Call the function
      const result = await referralModel.getReferralsByStatus(status);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, referral_extensions(*)');
      expect(supabase.match).toHaveBeenCalledWith({ is_referral: true });
      expect(result).toEqual(mockReferrals);
    });
  });
  
  describe('getReferralCountByStatus', () => {
    it('should get referral counts by status', async () => {
      // Mock data
      const mockCounts = {
        submitted: 5,
        contacted: 3,
        appointment_scheduled: 2,
        appointment_completed: 1,
        converted: 0,
        lost: 1
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
      const result = await referralModel.getReferralCountByStatus();
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.match).toHaveBeenCalledWith({ is_referral: true });
      expect(result).toEqual(mockCounts);
    });
  });
  
  describe('getReferralNetwork', () => {
    it('should get the referral network for a person', async () => {
      // Mock data
      const personId = uuidv4();
      const mockNetwork = {
        nodes: [
          { id: personId, type: 'member', name: 'Jane Smith' },
          { id: uuidv4(), type: 'referral', name: 'John Doe' },
          { id: uuidv4(), type: 'referral', name: 'Alice Brown' }
        ],
        links: [
          { source: personId, target: '2', type: 'referral', strength: 'strong' },
          { source: personId, target: '3', type: 'referral', strength: 'medium' }
        ]
      };
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockNetwork,
        error: null
      }));
      
      // Call the function
      const result = await referralModel.getReferralNetwork(personId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('relationships');
      expect(supabase.select).toHaveBeenCalled();
      expect(result).toEqual(mockNetwork);
    });
  });
}); 