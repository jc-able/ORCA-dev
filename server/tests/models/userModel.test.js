/**
 * Tests for the User Model
 * 
 * These tests verify that the User model correctly interacts with the Supabase database
 * and implements all required business logic.
 */

const userModel = require('../../models/userModel');
const supabase = require('../../config/supabase');

// Mock Supabase client
jest.mock('../../config/supabase', () => {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
  };
});

// Sample user data
const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  password: 'hashedpassword',
  first_name: 'Test',
  last_name: 'User',
  phone: '1234567890',
  role: 'salesperson',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: null,
  settings: { theme: 'dark' }
};

describe('User Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    test('should retrieve a user by ID successfully', async () => {
      // Mock Supabase response
      supabase.select.mockImplementation(() => ({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: mockUser, 
          error: null 
        })
      }));

      const user = await userModel.getUserById(mockUser.id);
      
      // Verify result
      expect(user).toEqual(mockUser);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.select().eq).toHaveBeenCalledWith('id', mockUser.id);
      expect(supabase.select().eq().single).toHaveBeenCalled();
    });

    test('should throw an error when user not found', async () => {
      // Mock Supabase error response
      supabase.select.mockImplementation(() => ({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'User not found' } 
        })
      }));

      // Expect the function to throw an error
      await expect(userModel.getUserById('nonexistent-id'))
        .rejects.toThrow();
    });
  });

  describe('getUserByEmail', () => {
    test('should retrieve a user by email successfully', async () => {
      // Mock Supabase response
      supabase.select.mockImplementation(() => ({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: mockUser, 
          error: null 
        })
      }));

      const user = await userModel.getUserByEmail(mockUser.email);
      
      // Verify result
      expect(user).toEqual(mockUser);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.select().eq).toHaveBeenCalledWith('email', mockUser.email);
      expect(supabase.select().eq().single).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    test('should create a user successfully', async () => {
      // Mock Supabase response
      supabase.insert.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: mockUser, 
          error: null 
        })
      }));

      const newUserData = {
        email: mockUser.email,
        password: mockUser.password,
        first_name: mockUser.first_name,
        last_name: mockUser.last_name,
        phone: mockUser.phone,
        role: mockUser.role
      };

      const user = await userModel.createUser(newUserData);
      
      // Verify result
      expect(user).toEqual(mockUser);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.insert).toHaveBeenCalledWith(expect.objectContaining(newUserData));
      expect(supabase.insert().select).toHaveBeenCalled();
      expect(supabase.insert().select().single).toHaveBeenCalled();
    });

    test('should throw an error on duplicate email', async () => {
      // Mock Supabase error response for duplicate email
      supabase.insert.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'duplicate key value violates unique constraint', code: '23505' } 
        })
      }));

      const newUserData = {
        email: mockUser.email,
        password: mockUser.password,
        first_name: mockUser.first_name,
        last_name: mockUser.last_name
      };

      // Expect the function to throw an error
      await expect(userModel.createUser(newUserData))
        .rejects.toThrow(/duplicate key/);
    });
  });

  describe('updateUser', () => {
    test('should update a user successfully', async () => {
      // Mock Supabase response
      supabase.update.mockImplementation(() => ({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { ...mockUser, first_name: 'Updated' }, 
          error: null 
        })
      }));

      const updatedData = { first_name: 'Updated' };
      const result = await userModel.updateUser(mockUser.id, updatedData);
      
      // Verify result
      expect(result).toEqual(expect.objectContaining(updatedData));
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.update).toHaveBeenCalledWith(updatedData);
      expect(supabase.update().eq).toHaveBeenCalledWith('id', mockUser.id);
    });
  });

  describe('deleteUser', () => {
    test('should delete a user successfully', async () => {
      // Mock Supabase response
      supabase.delete.mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({ 
          data: {}, 
          error: null 
        })
      }));

      const result = await userModel.deleteUser(mockUser.id);
      
      // Verify result
      expect(result).toBe(true);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.delete().eq).toHaveBeenCalledWith('id', mockUser.id);
    });
  });

  describe('updateLastLogin', () => {
    test('should update last login timestamp', async () => {
      // Mock Supabase response
      supabase.update.mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({ 
          data: { ...mockUser, last_login: new Date().toISOString() }, 
          error: null 
        })
      }));

      const result = await userModel.updateLastLogin(mockUser.id);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({
        last_login: expect.any(String)
      }));
      expect(supabase.update().eq).toHaveBeenCalledWith('id', mockUser.id);
    });
  });

  describe('getUsersByRole', () => {
    test('should retrieve users by role', async () => {
      // Mock Supabase response
      supabase.select.mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({ 
          data: [mockUser], 
          error: null 
        })
      }));

      const users = await userModel.getUsersByRole('salesperson');
      
      // Verify result
      expect(users).toEqual([mockUser]);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.select().eq).toHaveBeenCalledWith('role', 'salesperson');
    });
  });
}); 