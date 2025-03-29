/**
 * Error Handler Utility
 * 
 * Provides consistent error handling throughout the application
 */

/**
 * Format and log errors in a consistent way
 * @param {string} source - Source of the error (e.g., 'PersonModel.getPersonById')
 * @param {Error} error - The error object
 * @returns {Error} - Formatted error
 */
const errorHandler = (source, error) => {
  // Log the error with source context
  console.error(`Error in ${source}:`, error);
  
  // If it's a Supabase error with specific code
  if (error.code) {
    switch (error.code) {
      // Handle specific Supabase error codes
      case '23505': // Unique violation
        return new CustomError(`Duplicate record: ${error.details}`, 409);
      case '23503': // Foreign key violation
        return new CustomError(`Referenced record does not exist: ${error.details}`, 400);
      case '42P01': // Undefined table
        return new CustomError('Database configuration error', 500);
      case 'PGRST116': // Not found (Row level security related)
        return new CustomError('Record not found or not authorized', 404);
      default:
        if (error.code.startsWith('P')) {
          // Supabase-specific error
          return new CustomError(`Database error: ${error.message}`, 500);
        }
    }
  }
  
  // For validation errors
  if (error.name === 'ValidationError') {
    return new CustomError(`Validation error: ${error.message}`, 400);
  }
  
  // If it's already a CustomError, just return it
  if (error instanceof CustomError) {
    return error;
  }
  
  // Default case: wrap in a CustomError with 500 status
  return new CustomError(error.message || 'An unexpected error occurred', 500);
};

/**
 * Custom error class with status code
 */
class CustomError extends Error {
  /**
   * Create a new CustomError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  CustomError
}; 