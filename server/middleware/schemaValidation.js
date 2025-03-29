/**
 * Runtime Schema Validation Middleware
 * 
 * This middleware validates incoming request data against schema constraints
 * for critical database operations to ensure data integrity.
 */

const { supabase } = require('../db/supabase');

// Schema constraints cache
let schemaConstraintsCache = null;
let lastCacheUpdate = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Load schema constraints from the database
 */
async function loadSchemaConstraints() {
  try {
    // If cache is valid, return it
    if (schemaConstraintsCache && lastCacheUpdate && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
      return schemaConstraintsCache;
    }
    
    // Get column constraints
    const { data: columns, error: columnsError } = await supabase.rpc('get_column_constraints');
    if (columnsError) throw new Error(`Error fetching column constraints: ${columnsError.message}`);
    
    // Get check constraints
    const { data: checks, error: checksError } = await supabase.rpc('get_check_constraints');
    if (checksError) throw new Error(`Error fetching check constraints: ${checksError.message}`);
    
    // Get unique constraints
    const { data: uniques, error: uniquesError } = await supabase.rpc('get_unique_constraints');
    if (uniquesError) throw new Error(`Error fetching unique constraints: ${uniquesError.message}`);
    
    // Organize by table and column
    const constraints = {};
    
    // Process column constraints
    columns.forEach(col => {
      if (!constraints[col.table_name]) {
        constraints[col.table_name] = { columns: {}, checks: [], uniques: [] };
      }
      
      constraints[col.table_name].columns[col.column_name] = {
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        hasDefault: col.column_default !== null,
        defaultValue: col.column_default
      };
    });
    
    // Process check constraints
    checks.forEach(check => {
      if (!constraints[check.table_name]) {
        constraints[check.table_name] = { columns: {}, checks: [], uniques: [] };
      }
      
      constraints[check.table_name].checks.push({
        name: check.constraint_name,
        definition: check.definition
      });
    });
    
    // Process unique constraints
    uniques.forEach(unique => {
      if (!constraints[unique.table_name]) {
        constraints[unique.table_name] = { columns: {}, checks: [], uniques: [] };
      }
      
      // Parse comma-separated column list
      const columns = unique.column_names.split(',').map(col => col.trim());
      
      constraints[unique.table_name].uniques.push({
        name: unique.constraint_name,
        columns
      });
    });
    
    // Update cache
    schemaConstraintsCache = constraints;
    lastCacheUpdate = Date.now();
    
    return constraints;
  } catch (error) {
    console.error('Error loading schema constraints:', error);
    throw error;
  }
}

/**
 * Validate data against schema constraints
 */
function validateAgainstSchema(data, table, constraints) {
  const errors = [];
  const tableConstraints = constraints[table];
  
  if (!tableConstraints) {
    return errors;
  }
  
  // Validate column constraints
  for (const [colName, colConstraints] of Object.entries(tableConstraints.columns)) {
    const value = data[colName];
    
    // Skip if value is undefined/null and column has default or is nullable
    if ((value === undefined || value === null) && (colConstraints.hasDefault || colConstraints.nullable)) {
      continue;
    }
    
    // Check for required columns
    if ((value === undefined || value === null) && !colConstraints.nullable && !colConstraints.hasDefault) {
      errors.push({
        field: colName,
        message: `${colName} is required and cannot be null`
      });
      continue;
    }
    
    // Skip further validation if value is null and column is nullable
    if (value === null && colConstraints.nullable) {
      continue;
    }
    
    // Skip undefined values (will use default if available)
    if (value === undefined) {
      continue;
    }
    
    // Validate data types
    if (!validateDataType(value, colConstraints.type)) {
      errors.push({
        field: colName,
        message: `${colName} has invalid type. Expected ${colConstraints.type}.`
      });
    }
  }
  
  // Validate check constraints
  for (const check of tableConstraints.checks) {
    if (!validateCheckConstraint(data, check.definition)) {
      errors.push({
        constraint: check.name,
        message: `Check constraint violation: ${check.definition}`
      });
    }
  }
  
  return errors;
}

/**
 * Validate data type
 */
function validateDataType(value, type) {
  if (value === null) return true;
  
  switch (type.toLowerCase()) {
    case 'uuid':
      return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    
    case 'text':
    case 'varchar':
    case 'char':
      return typeof value === 'string';
    
    case 'integer':
    case 'int':
    case 'smallint':
    case 'bigint':
      return Number.isInteger(value);
    
    case 'numeric':
    case 'decimal':
    case 'real':
    case 'double precision':
    case 'float':
      return typeof value === 'number';
    
    case 'boolean':
      return typeof value === 'boolean';
    
    case 'date':
    case 'timestamp':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      // Accept Date objects, ISO strings, or strings that can be parsed as dates
      return (
        value instanceof Date ||
        (typeof value === 'string' && !isNaN(Date.parse(value)))
      );
    
    case 'jsonb':
    case 'json':
      return (
        typeof value === 'object' || 
        (typeof value === 'string' && (() => {
          try {
            JSON.parse(value);
            return true;
          } catch (e) {
            return false;
          }
        })())
      );
    
    default:
      // Handle array types
      if (type.endsWith('[]')) {
        return Array.isArray(value);
      }
      
      // For unsupported types, pass validation
      return true;
  }
}

/**
 * Validate check constraint
 */
function validateCheckConstraint(data, definition) {
  // Parse and validate common check constraints
  
  // Example: ((readiness_score >= 1) AND (readiness_score <= 10))
  const rangeMatch = definition.match(/\(\((\w+)\s*>=\s*(\d+)\)\s*AND\s*\((\w+)\s*<=\s*(\d+)\)\)/);
  if (rangeMatch) {
    const [, field1, min, field2, max] = rangeMatch;
    if (field1 !== field2) return true; // Skip complex constraints
    
    const value = data[field1];
    if (value === undefined || value === null) return true;
    
    return value >= parseInt(min) && value <= parseInt(max);
  }
  
  // For complex constraints, return true (validate at database level)
  return true;
}

/**
 * Validate request against table schema
 */
async function validateRequest(req, table, operation = 'insert') {
  try {
    const constraints = await loadSchemaConstraints();
    const errors = validateAgainstSchema(req.body, table, constraints);
    
    return { valid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error validating request:', error);
    return { valid: false, errors: [{ message: 'Schema validation error' }] };
  }
}

/**
 * Schema validation middleware
 */
function schemaValidationMiddleware(table, operation = 'insert') {
  return async (req, res, next) => {
    try {
      const { valid, errors } = await validateRequest(req, table, operation);
      
      if (!valid) {
        return res.status(400).json({
          error: 'Schema validation failed',
          details: errors
        });
      }
      
      next();
    } catch (error) {
      console.error('Schema validation middleware error:', error);
      next(error);
    }
  };
}

// Export the middleware and helper functions
module.exports = {
  schemaValidationMiddleware,
  validateRequest,
  loadSchemaConstraints
}; 