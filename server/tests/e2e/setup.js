/**
 * End-to-End Test Setup
 * 
 * This file provides the setup for end-to-end tests, launching a test server
 * and providing tools for making authenticated requests against the full API.
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = require('../../server');

// Skip actual connections to Supabase in tests
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

// Mock the auth controller for login
jest.mock('../../controllers/authController', () => {
  const originalModule = jest.requireActual('../../controllers/authController');
  
  return {
    ...originalModule,
    loginUser: jest.fn().mockImplementation((email, password) => {
      // For testing, accept any credentials
      const user = {
        id: uuidv4(),
        email,
        role: email.includes('admin') ? 'admin' : 'salesperson',
        first_name: 'Test',
        last_name: 'User'
      };
      
      const token = 'test-jwt-token-' + uuidv4();
      
      return Promise.resolve({ user, token });
    }),
    registerUser: jest.fn().mockImplementation((userData) => {
      const user = {
        id: uuidv4(),
        ...userData,
        role: 'salesperson',
        created_at: new Date().toISOString()
      };
      
      const token = 'test-jwt-token-' + uuidv4();
      
      return Promise.resolve({ user, token });
    })
  };
});

/**
 * Logs in a test user and returns the auth token
 * @param {string} email - User email (include 'admin' for admin role)
 * @param {string} password - User password
 * @returns {Promise<Object>} Authentication data including token
 */
const loginTestUser = async (email = 'test@example.com', password = 'password123') => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.body;
};

/**
 * Registers a test user and returns the auth data
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Authentication data including token
 */
const registerTestUser = async (userData = {
  email: `test-${uuidv4()}@example.com`,
  password: 'password123',
  first_name: 'Test',
  last_name: 'User'
}) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);
  
  return response.body;
};

/**
 * Helper to get request headers with authentication
 * @param {string} token - Authentication token
 * @returns {Object} Headers for authenticated requests
 */
const getAuthHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`
  };
};

module.exports = {
  request,
  app,
  loginTestUser,
  registerTestUser,
  getAuthHeaders,
  uuidv4
}; 