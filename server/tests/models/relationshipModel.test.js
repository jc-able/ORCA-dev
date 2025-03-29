/**
 * Relationship Model Tests
 */
const relationshipModel = require('../../models/relationshipModel');
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
  or: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis()
}));

// Helper function to generate a relationship
const generateRelationship = (personAId, personBId, overrides = {}) => {
  return {
    id: uuidv4(),
    person_a_id: personAId,
    person_b_id: personBId,
    relationship_type: overrides.relationship_type || 'referral',
    direction: overrides.direction || 'outgoing',
    referral_date: overrides.referral_date || new Date().toISOString(),
    referral_channel: overrides.referral_channel || 'direct',
    referral_campaign: overrides.referral_campaign || null,
    referral_link_id: overrides.referral_link_id || null,
    is_primary_referrer: overrides.is_primary_referrer !== undefined ? overrides.is_primary_referrer : true,
    attribution_percentage: overrides.attribution_percentage || 100,
    status: overrides.status || 'active',
    relationship_level: overrides.relationship_level || 1,
    relationship_strength: overrides.relationship_strength || 'strong',
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    notes: overrides.notes || null
  };
};

describe('Relationship Model', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });
  
  describe('getAllRelationships', () => {
    it('should retrieve all relationships without filters', async () => {
      // Mock data
      const mockRelationships = [
        generateRelationship(uuidv4(), uuidv4()),
        generateRelationship(uuidv4(), uuidv4())
      ];
      
      // Setup the mock return value
      supabase.range.mockImplementation(() => ({
        data: mockRelationships,
        error: null
      }));
      
      // Call the function
      const result = await relationshipModel.getAllRelationships();
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('relationships');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.order).toHaveBeenCalled();
      expect(supabase.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockRelationships);
    });
    
    it('should apply filters correctly', async () => {
      // Mock data
      const personAId = uuidv4();
      const personBId = uuidv4();
      const mockRelationships = [
        generateRelationship(personAId, personBId, { relationship_type: 'referral' })
      ];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockRelationships,
        error: null
      }));
      
      // Call with filters
      const filters = {
        personId: personAId,
        relationshipType: 'referral',
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };
      
      await relationshipModel.getAllRelationships(filters);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('relationships');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.or).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('relationship_type', 'referral');
      expect(supabase.gte).toHaveBeenCalledWith('created_at', filters.startDate);
      expect(supabase.lte).toHaveBeenCalledWith('created_at', filters.endDate);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.range.mockImplementation(() => ({
        data: null,
        error: new Error('Database error')
      }));
      
      // Call and expect rejection
      await expect(relationshipModel.getAllRelationships()).rejects.toThrow('Database error');
    });
  });
  
  describe('getRelationshipById', () => {
    it('should retrieve a relationship by ID', async () => {
      // Mock data
      const mockRelationship = generateRelationship(uuidv4(), uuidv4());
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: mockRelationship,
        error: null
      }));
      
      // Call the function
      const result = await relationshipModel.getRelationshipById(mockRelationship.id);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('relationships');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', mockRelationship.id);
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockRelationship);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.single.mockImplementation(() => ({
        data: null,
        error: new Error('Relationship not found')
      }));
      
      // Call and expect rejection
      await expect(relationshipModel.getRelationshipById('invalid-id')).rejects.toThrow('Relationship not found');
    });
  });
  
  describe('getRelationshipsByPerson', () => {
    it('should retrieve relationships for a specific person', async () => {
      // Mock data
      const personId = uuidv4();
      const mockRelationships = [
        generateRelationship(personId, uuidv4()),
        generateRelationship(uuidv4(), personId)
      ];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockRelationships,
        error: null
      }));
      
      // Call the function
      const result = await relationshipModel.getRelationshipsByPerson(personId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('relationships');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.or).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('person_a_id', personId);
      expect(supabase.eq).toHaveBeenCalledWith('person_b_id', personId);
      expect(result).toEqual(mockRelationships);
    });
  });
  
  describe('createRelationship', () => {
    it('should create a new relationship', async () => {
      // Mock data
      const relationshipData = {
        person_a_id: uuidv4(),
        person_b_id: uuidv4(),
        relationship_type: 'referral',
        direction: 'outgoing',
        is_primary_referrer: true
      };
      
      const createdRelationship = {
        id: uuidv4(),
        ...relationshipData,
        referral_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: createdRelationship,
        error: null
      }));
      
      // Call the function
      const result = await relationshipModel.createRelationship(relationshipData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('relationships');
      expect(supabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        person_a_id: relationshipData.person_a_id,
        person_b_id: relationshipData.person_b_id,
        relationship_type: relationshipData.relationship_type
      }));
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(createdRelationship);
    });
    
    it('should reject if required fields are missing', async () => {
      // Call with missing required fields
      const relationshipData = {
        person_a_id: uuidv4(),
        // Missing person_b_id and relationship_type
      };
      
      // Call and expect rejection
      await expect(relationshipModel.createRelationship(relationshipData))
        .rejects.toThrow('person_a_id, person_b_id, and relationship_type are required');
    });
  });
  
  describe('updateRelationship', () => {
    it('should update an existing relationship', async () => {
      // Mock data
      const relationshipId = uuidv4();
      const updateData = {
        status: 'inactive',
        relationship_strength: 'medium',
        notes: 'Updated relationship'
      };
      
      const updatedRelationship = {
        id: relationshipId,
        person_a_id: uuidv4(),
        person_b_id: uuidv4(),
        relationship_type: 'referral',
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: updatedRelationship,
        error: null
      }));
      
      // Call the function
      const result = await relationshipModel.updateRelationship(relationshipId, updateData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('relationships');
      expect(supabase.update).toHaveBeenCalledWith(updateData);
      expect(supabase.eq).toHaveBeenCalledWith('id', relationshipId);
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(updatedRelationship);
    });
  });
  
  describe('deleteRelationship', () => {
    it('should delete a relationship', async () => {
      // Mock data
      const relationshipId = uuidv4();
      
      // Setup the mock
      supabase.delete.mockImplementation(() => ({
        error: null
      }));
      
      // Call the function
      const result = await relationshipModel.deleteRelationship(relationshipId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('relationships');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', relationshipId);
      expect(result).toBe(true);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.delete.mockImplementation(() => ({
        error: new Error('Delete failed')
      }));
      
      // Call and expect rejection
      await expect(relationshipModel.deleteRelationship('invalid-id')).rejects.toThrow('Delete failed');
    });
  });
  
  describe('getRelationshipsByType', () => {
    it('should retrieve relationships by type', async () => {
      // Mock data
      const type = 'referral';
      const mockRelationships = [
        generateRelationship(uuidv4(), uuidv4(), { relationship_type: type }),
        generateRelationship(uuidv4(), uuidv4(), { relationship_type: type })
      ];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockRelationships,
        error: null
      }));
      
      // Call the function
      const result = await relationshipModel.getRelationshipsByType(type);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('relationships');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('relationship_type', type);
      expect(result).toEqual(mockRelationships);
    });
  });
}); 