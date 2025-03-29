#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * Verifies that the current database schema matches the expected schema from SQL definitions
 * 
 * This script is designed to be run in CI/CD pipelines to ensure schema consistency
 * 
 * Usage:
 *   node server/scripts/verifySchema.js
 * 
 * Exit codes:
 *   0 - Schema is valid and matches expected schema
 *   1 - Schema has discrepancies or validation failed
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabase } = require('../db/supabase');
const { spawn } = require('child_process');

// Configuration
const SCHEMA_FILE_PATH = path.join(__dirname, '../db/schema/current_schema.sql');
const TABLES_TO_VERIFY = [
  'persons', 'lead_extensions', 'referral_extensions', 'member_extensions',
  'relationships', 'interactions', 'messages', 'users'
];

// Read the expected schema from the SQL file
function readExpectedSchema() {
  try {
    const schemaContent = fs.readFileSync(SCHEMA_FILE_PATH, 'utf8');
    return schemaContent;
  } catch (error) {
    console.error('Error reading schema file:', error.message);
    process.exit(1);
  }
}

// Extract table definitions from SQL content
function extractTableDefinitions(sqlContent) {
  const tableDefinitions = {};
  
  for (const table of TABLES_TO_VERIFY) {
    const tableRegex = new RegExp(`CREATE TABLE public\\.${table} \\(([\\s\\S]*?)\\);`, 'i');
    const tableMatch = sqlContent.match(tableRegex);
    
    if (tableMatch && tableMatch[1]) {
      tableDefinitions[table] = tableMatch[1].trim();
    }
  }
  
  return tableDefinitions;
}

// Extract index definitions from SQL content
function extractIndexDefinitions(sqlContent) {
  const indexDefinitions = {};
  
  for (const table of TABLES_TO_VERIFY) {
    const indexRegex = new RegExp(`CREATE INDEX.*ON public\\.${table}\\b[\\s\\S]*?;`, 'g');
    const matches = [...sqlContent.matchAll(indexRegex)];
    
    if (matches.length > 0) {
      indexDefinitions[table] = matches.map(match => match[0].trim());
    }
  }
  
  return indexDefinitions;
}

// Get current schema from database
async function getCurrentSchema() {
  try {
    // Execute query to get table info
    const { data: tableData, error: tableError } = await supabase.rpc('get_table_info');
    
    if (tableError) {
      throw new Error(`Error fetching table info: ${tableError.message}`);
    }
    
    // Execute query to get constraint info
    const { data: constraintData, error: constraintError } = await supabase.rpc('get_constraint_info');
    
    if (constraintError) {
      throw new Error(`Error fetching constraint info: ${constraintError.message}`);
    }
    
    // Execute query to get index info
    const { data: indexData, error: indexError } = await supabase.rpc('get_index_info');
    
    if (indexError) {
      throw new Error(`Error fetching index info: ${indexError.message}`);
    }
    
    return {
      tables: tableData,
      constraints: constraintData,
      indexes: indexData
    };
  } catch (error) {
    console.error('Error getting current schema:', error.message);
    process.exit(1);
  }
}

// Compare expected and current schema
function compareSchemas(expectedDefinitions, currentSchema) {
  const discrepancies = [];
  
  // Compare each table
  for (const table of TABLES_TO_VERIFY) {
    // Skip if table definition is not found
    if (!expectedDefinitions[table]) {
      discrepancies.push(`Table definition for '${table}' not found in SQL schema file`);
      continue;
    }
    
    // Filter current schema data for this table
    const tableColumns = currentSchema.tables.filter(t => t.table_name === table);
    const tableConstraints = currentSchema.constraints.filter(c => c.table_name === table);
    const tableIndexes = currentSchema.indexes.filter(i => i.table_name === table);
    
    // Check if table exists
    if (tableColumns.length === 0) {
      discrepancies.push(`Table '${table}' not found in database`);
      continue;
    }
    
    // Check column definitions
    const expectedColumns = extractColumnDefinitions(expectedDefinitions[table]);
    for (const expCol of expectedColumns) {
      const currentCol = tableColumns.find(c => c.column_name === expCol.name);
      
      if (!currentCol) {
        discrepancies.push(`Column '${expCol.name}' not found in table '${table}'`);
        continue;
      }
      
      // Check data type
      if (!isCompatibleType(expCol.dataType, currentCol.data_type)) {
        discrepancies.push(
          `Column '${expCol.name}' in table '${table}' has wrong data type. ` +
          `Expected '${expCol.dataType}', got '${currentCol.data_type}'`
        );
      }
      
      // Check nullable
      if (expCol.nullable !== (currentCol.is_nullable === 'YES')) {
        discrepancies.push(
          `Column '${expCol.name}' in table '${table}' has wrong nullable status. ` +
          `Expected ${expCol.nullable ? 'nullable' : 'NOT NULL'}, got ${currentCol.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'}`
        );
      }
    }
  }
  
  return discrepancies;
}

// Extract column definitions from table definition string
function extractColumnDefinitions(tableDefinition) {
  const columnDefinitions = [];
  const lines = tableDefinition.split('\n');
  
  for (const line of lines) {
    // Skip constraint definitions
    if (line.trim().startsWith('CONSTRAINT')) {
      continue;
    }
    
    // Parse column definition
    const columnMatch = line.trim().match(/^(\w+)\s+([\w\(\)]+)\s*(.*?)$/);
    if (columnMatch) {
      const [, name, dataType, rest] = columnMatch;
      
      columnDefinitions.push({
        name,
        dataType,
        nullable: !rest.includes('NOT NULL')
      });
    }
  }
  
  return columnDefinitions;
}

// Check if types are compatible (e.g., "uuid" and "uuid" are compatible)
function isCompatibleType(expectedType, actualType) {
  // Handle array types (e.g., "text[]" and "ARRAY")
  if (expectedType.endsWith('[]') && actualType.toUpperCase().includes('ARRAY')) {
    return true;
  }
  
  // Handle JSON types
  if ((expectedType === 'jsonb' || expectedType === 'json') && 
      (actualType.toUpperCase().includes('JSON'))) {
    return true;
  }
  
  // Direct comparison with some flexibility
  const normalizedExpected = expectedType.replace(/\([^)]+\)/, '').toLowerCase();
  const normalizedActual = actualType.replace(/\([^)]+\)/, '').toLowerCase();
  
  return normalizedExpected.includes(normalizedActual) || 
         normalizedActual.includes(normalizedExpected);
}

// Setup RPC functions needed for schema verification
async function setupRpcFunctions() {
  try {
    // Create get_table_info RPC function
    await supabase.rpc('create_get_table_info', {}, { count: 'none' });
    
    // Create get_constraint_info RPC function
    await supabase.rpc('create_get_constraint_info', {}, { count: 'none' });
    
    // Create get_index_info RPC function
    await supabase.rpc('create_get_index_info', {}, { count: 'none' });
    
    return true;
  } catch (error) {
    console.warn('Error creating RPC functions (they may already exist):', error.message);
    return false;
  }
}

// Main verification function
async function verifySchema() {
  try {
    console.log('Starting database schema verification...');
    
    // Setup RPC functions if they don't exist
    await setupRpcFunctions();
    
    // Read expected schema
    const sqlContent = readExpectedSchema();
    const expectedTableDefinitions = extractTableDefinitions(sqlContent);
    const expectedIndexDefinitions = extractIndexDefinitions(sqlContent);
    
    // Get current schema
    const currentSchema = await getCurrentSchema();
    
    // Compare schemas
    const discrepancies = compareSchemas(expectedTableDefinitions, currentSchema);
    
    if (discrepancies.length === 0) {
      console.log('✅ Schema verification successful. Database schema matches expected schema.');
      process.exit(0);
    } else {
      console.error('❌ Schema verification failed. Discrepancies found:');
      discrepancies.forEach(discrepancy => console.error(`  - ${discrepancy}`));
      process.exit(1);
    }
  } catch (error) {
    console.error('Schema verification failed with error:', error.message);
    process.exit(1);
  }
}

// Run the verification
verifySchema(); 