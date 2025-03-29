/**
 * End-to-End Tests Entry Point
 * 
 * This file serves as the entry point for all end-to-end tests,
 * importing and running all the individual flow test files.
 */

// Import all E2E test files
require('./leadFlow.test');
require('./referralFlow.test');

// We would add more E2E tests here as they are developed:
// require('./messagingFlow.test');
// require('./memberFlow.test');

describe('End-to-End Flows', () => {
  test('All E2E flow tests should be imported and run', () => {
    // This is just a placeholder test to ensure the file runs
    // The actual tests are in the imported files
    expect(true).toBe(true);
  });
}); 