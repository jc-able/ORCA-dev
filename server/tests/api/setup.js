/**
 * API Test Setup
 * 
 * This file provides the test setup for API endpoint tests, including:
 * - Supertest for making HTTP requests
 * - Jest mocks for Supabase and other dependencies
 * - Test utilities for authentication and request handling
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

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

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    // Simulated authenticated user
    req.user = {
      id: req.headers['x-test-user-id'] || uuidv4(),
      email: req.headers['x-test-user-email'] || 'test@example.com',
      role: req.headers['x-test-user-role'] || 'salesperson'
    };
    next();
  },
  isAdmin: (req, res, next) => {
    if (req.headers['x-test-user-role'] === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Access denied: Admin role required' });
    }
  }
}));

/**
 * Creates a test app with the specified routes
 * @param {Object} routes - Express router to include
 * @returns {Object} Express app for testing
 */
const createTestApp = (routes) => {
  const app = express();
  app.use(express.json());
  app.use(routes);
  return app;
};

/**
 * Helper to generate test headers for authentication
 * @param {Object} options - User options
 * @returns {Object} Headers for test requests
 */
const getTestHeaders = (options = {}) => {
  return {
    'x-test-user-id': options.userId || uuidv4(),
    'x-test-user-email': options.email || 'test@example.com',
    'x-test-user-role': options.role || 'salesperson'
  };
};

/**
 * Helper to generate an admin test user
 * @returns {Object} Admin test headers
 */
const getAdminTestHeaders = () => {
  return getTestHeaders({ role: 'admin' });
};

module.exports = {
  request,
  createTestApp,
  getTestHeaders,
  getAdminTestHeaders,
  uuidv4
}; 