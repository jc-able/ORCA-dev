/**
 * Error Handling Service
 * 
 * Provides centralized error handling functionality for the application
 * Includes error categorization, logging, and user-friendly messages
 */

// Error types for categorization
export const ErrorTypes = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  RATE_LIMIT: 'rate_limit',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
};

// Generate a unique ID for tracking specific error instances
const generateErrorId = () => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Log error to monitoring service
 * This would be replaced with actual error monitoring integration (Sentry, LogRocket, etc.)
 */
const logErrorToMonitoring = (error, context = {}) => {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged to monitoring:', {
      error,
      context,
      timestamp: new Date().toISOString()
    });
  }
  
  // In production, this would send to error monitoring service
  // Example Sentry integration:
  // if (process.env.NODE_ENV === 'production' && Sentry) {
  //   Sentry.withScope((scope) => {
  //     Object.keys(context).forEach(key => {
  //       scope.setExtra(key, context[key]);
  //     });
  //     Sentry.captureException(error);
  //   });
  // }
};

/**
 * Format an error response with consistent structure
 */
const formatErrorResponse = (message, type, details = null, errorId = null) => {
  return {
    success: false,
    error: message,
    errorType: type,
    ...(details && { details }),
    ...(errorId && { errorId })
  };
};

/**
 * Categorize and handle API errors
 */
const handleApiError = (error, resource = 'resource') => {
  // Log to monitoring with context
  const context = {
    resource,
    url: error.config?.url,
    method: error.config?.method,
    timestamp: new Date().toISOString()
  };
  
  logErrorToMonitoring(error, context);
  
  // Network errors (no response)
  if (!error.response) {
    return formatErrorResponse(
      'Network error. Please check your connection and try again.',
      ErrorTypes.NETWORK
    );
  }
  
  // Handle based on HTTP status code
  const status = error.response.status;
  const errorId = generateErrorId();
  
  switch (status) {
    case 400:
      return formatErrorResponse(
        'The request was invalid. Please check your input.',
        ErrorTypes.VALIDATION,
        error.response.data?.errors || error.response.data
      );
      
    case 401:
      // Session expired or not authenticated
      return formatErrorResponse(
        'Your session has expired. Please log in again.',
        ErrorTypes.AUTHENTICATION
      );
      
    case 403:
      return formatErrorResponse(
        'You don\'t have permission to perform this action.',
        ErrorTypes.AUTHORIZATION
      );
      
    case 404:
      return formatErrorResponse(
        `The requested ${resource} could not be found.`,
        ErrorTypes.NOT_FOUND
      );
      
    case 429:
      return formatErrorResponse(
        'Too many requests. Please try again later.',
        ErrorTypes.RATE_LIMIT
      );
      
    case 408:
    case 504:
      return formatErrorResponse(
        'The request timed out. Please try again.',
        ErrorTypes.TIMEOUT
      );
      
    case 500:
    case 502:
    case 503:
      return formatErrorResponse(
        'Something went wrong on our servers. Our team has been notified.',
        ErrorTypes.SERVER,
        null,
        errorId
      );
      
    default:
      return formatErrorResponse(
        'An unexpected error occurred. Please try again later.',
        ErrorTypes.UNKNOWN,
        null,
        errorId
      );
  }
};

/**
 * Retry a function with exponential backoff
 */
const retryWithBackoff = async (fn, retries = 3, backoffMs = 300) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, backoffMs));
    
    // Retry with reduced count and increased backoff
    return retryWithBackoff(fn, retries - 1, backoffMs * 2);
  }
};

/**
 * Get user-friendly message based on error type
 */
const getUserFriendlyMessage = (errorType, resourceName = 'item') => {
  switch (errorType) {
    case ErrorTypes.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection.';
      
    case ErrorTypes.AUTHENTICATION:
      return 'Your session has expired. Please sign in again.';
      
    case ErrorTypes.AUTHORIZATION:
      return 'You don\'t have permission to access this feature.';
      
    case ErrorTypes.VALIDATION:
      return 'There was a problem with the information you provided.';
      
    case ErrorTypes.NOT_FOUND:
      return `The ${resourceName} you're looking for could not be found.`;
      
    case ErrorTypes.RATE_LIMIT:
      return 'You\'ve made too many requests. Please wait a moment and try again.';
      
    case ErrorTypes.TIMEOUT:
      return 'The request took too long to complete. Please try again.';
      
    case ErrorTypes.SERVER:
      return 'We\'re experiencing technical difficulties. Our team has been notified.';
      
    default:
      return 'Something went wrong. Please try again later.';
  }
};

// Export the error handling service
const ErrorHandler = {
  types: ErrorTypes,
  handleApiError,
  logErrorToMonitoring,
  formatErrorResponse,
  retryWithBackoff,
  getUserFriendlyMessage
};

export default ErrorHandler; 