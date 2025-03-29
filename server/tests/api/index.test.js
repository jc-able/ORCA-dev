/**
 * API Tests Entry Point
 * 
 * This file serves as the entry point for all API endpoint tests,
 * importing and running all of the individual API test files.
 */

// Import all API test files
require('./authRoutes.test');
require('./leadRoutes.test');
require('./personRoutes.test');

// We would add more API tests here as they are developed:
// require('./referralRoutes.test');
// require('./memberRoutes.test');
// require('./interactionRoutes.test');
// require('./messagingRoutes.test');
// require('./relationshipRoutes.test');
// require('./databaseRoutes.test');
// require('./maintenanceRoutes.test');

describe('API Endpoints', () => {
  test('All API endpoint tests should be imported and run', () => {
    // This is just a placeholder test to ensure the file runs
    // The actual tests are in the imported files
    expect(true).toBe(true);
  });
}); 