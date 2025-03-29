/**
 * Test Entry Point
 * 
 * This file serves as the main entry point for all tests,
 * importing and running model tests, API endpoint tests,
 * and end-to-end tests.
 */

// Import test suites
require('./models/index.test');
require('./api/index.test');
require('./e2e/index.test');

describe('Test Suite', () => {
  test('All test suites should be imported and run', () => {
    // This is just a placeholder test to ensure the file runs
    // The actual tests are in the imported files
    expect(true).toBe(true);
  });
}); 