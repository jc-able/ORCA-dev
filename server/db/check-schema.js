#!/usr/bin/env node

/**
 * Script to check the current database schema in Supabase
 * Usage: node check-schema.js
 * 
 * This script connects to Supabase and lists all tables and their columns,
 * which is useful for verifying that migrations have been applied correctly.
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set');
  process.exit(1);
}

// Initialize Supabase client with service key for admin privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function checkSchema() {
  try {
    console.log('Fetching database schema information...\n');

    // Query to get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError.message);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('No tables found in the public schema.');
      return;
    }

    console.log(`Found ${tables.length} tables in the public schema:\n`);

    // List all tables and their columns
    for (const { tablename } of tables) {
      // Skip Supabase system tables
      if (tablename.startsWith('_') || tablename.startsWith('auth_')) continue;

      console.log(`Table: ${tablename}`);

      // Query to get all columns for this table
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: tablename });

      if (columnsError) {
        console.error(`  Error fetching columns for table ${tablename}:`, columnsError.message);
        continue;
      }

      if (!columns || columns.length === 0) {
        console.log('  No columns found for this table.');
        continue;
      }

      // Display columns with their types
      columns.forEach(column => {
        console.log(`  - ${column.column_name} (${column.data_type}${column.is_nullable === 'NO' ? ', NOT NULL' : ''}${column.column_default ? `, DEFAULT: ${column.column_default}` : ''})`);
      });

      console.log(''); // Add a newline between tables
    }

    console.log('Schema check complete.');
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

// Execute the schema check
checkSchema().catch(error => {
  console.error('Unhandled error in schema check:', error);
  process.exit(1);
});

/**
 * Note: This script requires a Postgres function to be created in your Supabase instance:
 * 
 * CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
 * RETURNS TABLE (
 *   column_name text,
 *   data_type text,
 *   is_nullable text,
 *   column_default text
 * )
 * LANGUAGE sql
 * SECURITY DEFINER
 * AS $$
 *   SELECT 
 *     column_name,
 *     data_type,
 *     is_nullable,
 *     column_default
 *   FROM 
 *     information_schema.columns
 *   WHERE 
 *     table_schema = 'public' AND 
 *     table_name = table_name
 *   ORDER BY 
 *     ordinal_position;
 * $$;
 * 
 * You'll need to create this function using the SQL editor in the Supabase dashboard
 * or through another method with appropriate permissions.
 */ 