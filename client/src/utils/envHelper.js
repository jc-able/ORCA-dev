/**
 * Environment variable helper utilities
 * Provides consistent access to environment variables with fallbacks
 */

/**
 * Get environment variable with fallback
 * @param {string} name - Environment variable name
 * @param {*} fallback - Fallback value if not found
 * @returns {string} - Value or fallback
 */
export const getEnv = (name, fallback = '') => {
  const value = process.env[`REACT_APP_${name}`];
  
  // Debug environment variable loading in non-production
  if (process.env.NODE_ENV !== 'production') {
    if (!value && name.includes('KEY')) {
      console.warn(`Environment variable REACT_APP_${name} not found, using fallback`);
    }
  }
  
  return value || fallback;
};

/**
 * Database configuration
 */
export const dbConfig = {
  supabaseUrl: getEnv('SUPABASE_URL', 'https://placeholder-url.supabase.co'),
  supabaseKey: getEnv('SUPABASE_ANON_KEY', 'placeholder-key'),
  databaseUrl: getEnv('DATABASE_URL', ''),
  
  // Returns true if we have valid credentials
  hasValidCredentials: () => {
    const hasValidUrl = dbConfig.supabaseUrl !== 'https://placeholder-url.supabase.co';
    const hasValidKey = dbConfig.supabaseKey !== 'placeholder-key';
    
    if (!hasValidUrl || !hasValidKey) {
      console.error('Missing or invalid Supabase credentials:', {
        hasValidUrl,
        hasValidKey,
        // Show partial URL for debugging but never log the full key
        url: hasValidUrl ? dbConfig.supabaseUrl.substring(0, 15) + '...' : 'missing'
      });
    }
    
    return hasValidUrl && hasValidKey;
  },
  
  // Returns true if we have the direct database URL
  hasDirectDbAccess: () => {
    return !!dbConfig.databaseUrl;
  }
};

/**
 * API configuration
 */
export const apiConfig = {
  baseUrl: getEnv('API_URL', 'http://localhost:5001/api'),
  timeout: parseInt(getEnv('API_TIMEOUT', '30000')),
};

/**
 * Feature flags
 */
export const featureFlags = {
  useMockData: getEnv('USE_MOCK_DATA', 'false').toLowerCase() === 'true',
  enableDirectDbAccess: getEnv('ENABLE_DIRECT_DB', 'true').toLowerCase() === 'true',
  debugMode: getEnv('DEBUG_MODE', 'false').toLowerCase() === 'true'
}; 