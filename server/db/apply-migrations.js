#!/usr/bin/env node

/**
 * Script to apply database migrations to Supabase
 * Usage: node apply-migrations.js
 * 
 * This script reads SQL migration files from the migrations directory
 * and applies them to the Supabase database in order.
 */

const fs = require('fs');
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

// Path to migrations directory
const migrationsDir = path.resolve(__dirname, 'migrations');

async function applyMigrations() {
  try {
    // Get all migration files in alphabetical order (001_..., 002_..., etc.)
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('No migration files found in the migrations directory.');
      return;
    }

    console.log(`Found ${migrationFiles.length} migration files.`);

    // Process each migration file
    for (const migrationFile of migrationFiles) {
      console.log(`\nProcessing migration: ${migrationFile}`);
      
      // Read the SQL from the file
      const sqlPath = path.join(migrationsDir, migrationFile);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Split the SQL into statements (simple approach)
      const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
      
      console.log(`Found ${statements.length} SQL statements in ${migrationFile}`);
      
      // Execute each SQL statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (!statement) continue;
        
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('pgfunction', { statement });
          
          if (error) {
            console.error(`Error executing statement ${i + 1}:`, error);
            
            // Add logic here to decide whether to continue or exit
            const shouldContinue = true; // This could be a prompt in a more interactive script
            if (!shouldContinue) {
              process.exit(1);
            }
          } else {
            console.log(`Statement ${i + 1} executed successfully.`);
          }
        } catch (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
        }
      }
      
      console.log(`Completed migration: ${migrationFile}`);
    }
    
    console.log('\nAll migrations have been processed.');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

// Execute the migration process
applyMigrations().catch(error => {
  console.error('Unhandled error in migration process:', error);
  process.exit(1);
});

/**
 * Note: This script requires a Postgres function to be created in your Supabase instance:
 * 
 * CREATE OR REPLACE FUNCTION pgfunction(statement text)
 * RETURNS void
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * AS $$
 * BEGIN
 *   EXECUTE statement;
 * END;
 * $$;
 * 
 * You'll need to create this function using the SQL editor in the Supabase dashboard
 * or through another method with appropriate permissions.
 */ 