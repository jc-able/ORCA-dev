/**
 * Interaction Model Tests
 */
const interactionModel = require('../../models/interactionModel');
const { generateInteraction } = require('../../utils/testDataGenerator');
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
  lte: jest.fn().mockReturnThis()
}));

describe('Interaction Model', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });
  
  describe('getAllInteractions', () => {
    it('should retrieve all interactions without filters', async () => {
      // Mock data
      const mockInteractions = [
        generateInteraction(uuidv4(), uuidv4()),
        generateInteraction(uuidv4(), uuidv4())
      ];
      
      // Setup the mock return value
      supabase.range.mockImplementation(() => ({
        data: mockInteractions,
        error: null
      }));
      
      // Call the function
      const result = await interactionModel.getAllInteractions();
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('interactions');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockInteractions);
    });
    
    it('should apply filters correctly', async () => {
      // Mock data
      const personId = uuidv4();
      const userId = uuidv4();
      const mockInteractions = [
        generateInteraction(personId, userId, { interaction_type: 'email' })
      ];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockInteractions,
        error: null
      }));
      
      // Call with filters
      const filters = {
        personId,
        userId,
        interactionType: 'email',
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };
      
      await interactionModel.getAllInteractions(filters);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('interactions');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('person_id', personId);
      expect(supabase.eq).toHaveBeenCalledWith('user_id', userId);
      expect(supabase.eq).toHaveBeenCalledWith('interaction_type', 'email');
      expect(supabase.gte).toHaveBeenCalledWith('scheduled_at', filters.startDate);
      expect(supabase.lte).toHaveBeenCalledWith('scheduled_at', filters.endDate);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.range.mockImplementation(() => ({
        data: null,
        error: new Error('Database error')
      }));
      
      // Call and expect rejection
      await expect(interactionModel.getAllInteractions()).rejects.toThrow('Database error');
    });
  });
  
  describe('getInteractionById', () => {
    it('should retrieve an interaction by ID', async () => {
      // Mock data
      const mockInteraction = generateInteraction(uuidv4(), uuidv4());
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: mockInteraction,
        error: null
      }));
      
      // Call the function
      const result = await interactionModel.getInteractionById(mockInteraction.id);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('interactions');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', mockInteraction.id);
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockInteraction);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.single.mockImplementation(() => ({
        data: null,
        error: new Error('Interaction not found')
      }));
      
      // Call and expect rejection
      await expect(interactionModel.getInteractionById('invalid-id')).rejects.toThrow('Interaction not found');
    });
  });
  
  describe('createInteraction', () => {
    it('should create a new interaction', async () => {
      // Mock data
      const interactionData = {
        person_id: uuidv4(),
        user_id: uuidv4(),
        interaction_type: 'email',
        subject: 'Follow-up',
        content: 'Thank you for your interest'
      };
      
      const createdInteraction = {
        ...interactionData,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: createdInteraction,
        error: null
      }));
      
      // Call the function
      const result = await interactionModel.createInteraction(interactionData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('interactions');
      expect(supabase.insert).toHaveBeenCalledWith(interactionData);
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(createdInteraction);
    });
    
    it('should reject if person_id is missing', async () => {
      // Call with missing required field
      const interactionData = {
        user_id: uuidv4(),
        interaction_type: 'email'
      };
      
      // Call and expect rejection
      await expect(interactionModel.createInteraction(interactionData))
        .rejects.toThrow('person_id is required');
    });
  });
  
  describe('updateInteraction', () => {
    it('should update an existing interaction', async () => {
      // Mock data
      const interactionId = uuidv4();
      const updateData = {
        subject: 'Updated subject',
        content: 'Updated content'
      };
      
      const updatedInteraction = {
        id: interactionId,
        person_id: uuidv4(),
        user_id: uuidv4(),
        interaction_type: 'email',
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: updatedInteraction,
        error: null
      }));
      
      // Call the function
      const result = await interactionModel.updateInteraction(interactionId, updateData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('interactions');
      expect(supabase.update).toHaveBeenCalledWith(updateData);
      expect(supabase.eq).toHaveBeenCalledWith('id', interactionId);
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(updatedInteraction);
    });
  });
  
  describe('deleteInteraction', () => {
    it('should delete an interaction', async () => {
      // Mock data
      const interactionId = uuidv4();
      
      // Setup the mock
      supabase.delete.mockImplementation(() => ({
        error: null
      }));
      
      // Call the function
      const result = await interactionModel.deleteInteraction(interactionId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('interactions');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', interactionId);
      expect(result).toBe(true);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.delete.mockImplementation(() => ({
        error: new Error('Delete failed')
      }));
      
      // Call and expect rejection
      await expect(interactionModel.deleteInteraction('invalid-id')).rejects.toThrow('Delete failed');
    });
  });
}); 