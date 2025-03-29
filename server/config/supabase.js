const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Supabase client configuration
 * 
 * Environment variables needed:
 * - SUPABASE_URL: The URL of your Supabase project
 * - SUPABASE_SERVICE_KEY: The service role key for server-side operations
 * 
 * For local development, create a .env file with these variables
 * In production, they will be set in the hosting platform (Vercel)
 */
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-service-key';

// Log a warning if using fallback values
if (supabaseUrl === 'https://placeholder-url.supabase.co' || supabaseServiceKey === 'placeholder-service-key') {
  console.warn('Using fallback Supabase credentials. Please check your server .env file.');
}

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase; 