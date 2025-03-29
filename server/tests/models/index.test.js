/**
 * Model Tests Entry Point
 * 
 * This file serves as the entry point for all model tests,
 * importing and running all of the individual model test files.
 */

// Import all model tests
require('./userModel.test');
require('./personModel.test');
require('./interactionModel.test');
require('./leadModel.test');
require('./referralModel.test');
require('./messageModel.test');
require('./memberModel.test');
require('./relationshipModel.test');

// We would add more model tests here as they are developed:
// require('./leadModel.test');
// require('./referralModel.test');
// require('./messageModel.test');
// etc.

describe('Database Models', () => {
  test('All model tests should be imported and run', () => {
    // This is just a placeholder test to ensure the file runs
    // The actual tests are in the imported files
    expect(true).toBe(true);
  });
}); 