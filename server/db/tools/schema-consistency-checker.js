#!/usr/bin/env node

/**
 * Schema Consistency Checker Tool
 * 
 * This tool checks the consistency between TypeScript interface definitions and
 * the actual database schema. It helps developers identify misalignments between
 * code and database structure during development.
 * 
 * Usage:
 *   node server/db/tools/schema-consistency-checker.js [options]
 * 
 * Options:
 *   --fix      Attempt to auto-fix simple misalignments
 *   --verbose  Show detailed information about checks
 *   --table=X  Check only the specified table
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk'); // For colorful console output

// Configuration
const TYPES_FILE_PATH = path.join(__dirname, '../schema/types.ts');
const SCHEMA_FILE_PATH = path.join(__dirname, '../schema/current_schema.sql');
const MODEL_DIR_PATH = path.join(__dirname, '../../models');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose'),
  table: args.find(arg => arg.startsWith('--table='))?.split('=')[1] || null
};

/**
 * Main function to check schema consistency
 */
async function checkSchemaConsistency() {
  console.log(chalk.blue('🔍 Schema Consistency Checker'));
  console.log(chalk.gray('Checking consistency between TypeScript interfaces and database schema...\n'));

  try {
    // Read and parse TypeScript interfaces
    const tsInterfaces = parseTypeScriptInterfaces();
    
    // Read and parse SQL schema
    const sqlSchema = parseSqlSchema();
    
    // Check model implementations
    const modelImplementations = parseModelImplementations();
    
    // Compare TypeScript interfaces with SQL schema
    const tsToSqlIssues = compareTypesToSql(tsInterfaces, sqlSchema);
    
    // Compare model implementations with SQL schema
    const modelToSqlIssues = compareModelsToSql(modelImplementations, sqlSchema);
    
    // Compare TypeScript interfaces with model implementations
    const tsToModelIssues = compareTypesToModels(tsInterfaces, modelImplementations);
    
    // Print results
    printResults(tsToSqlIssues, modelToSqlIssues, tsToModelIssues);
    
    // Attempt to fix issues if --fix option is provided
    if (options.fix && (tsToSqlIssues.length > 0 || modelToSqlIssues.length > 0 || tsToModelIssues.length > 0)) {
      attemptToFixIssues(tsToSqlIssues, modelToSqlIssues, tsToModelIssues, tsInterfaces, sqlSchema, modelImplementations);
    }
    
    // Return exit code based on whether issues were found
    return (tsToSqlIssues.length > 0 || modelToSqlIssues.length > 0 || tsToModelIssues.length > 0) ? 1 : 0;
  } catch (error) {
    console.error(chalk.red(`❌ Error checking schema consistency: ${error.message}`));
    console.error(error.stack);
    return 1;
  }
}

/**
 * Parse TypeScript interface definitions from types.ts
 */
function parseTypeScriptInterfaces() {
  console.log(chalk.gray('Parsing TypeScript interfaces...'));
  
  try {
    const typesContent = fs.readFileSync(TYPES_FILE_PATH, 'utf8');
    const interfaces = {};
    
    // Extract interfaces using regex
    const interfaceRegex = /export\s+interface\s+(\w+)\s*{([^}]*)}/g;
    let match;
    
    while ((match = interfaceRegex.exec(typesContent)) !== null) {
      const [, interfaceName, interfaceBody] = match;
      
      // Skip interfaces we're not interested in
      if (!isRelevantInterface(interfaceName)) {
        continue;
      }
      
      // Parse interface properties
      const properties = {};
      const propertyRegex = /(\w+)(\?)?:\s*([^;]*);/g;
      let propertyMatch;
      
      while ((propertyMatch = propertyRegex.exec(interfaceBody)) !== null) {
        const [, propName, optional, propType] = propertyMatch;
        properties[propName] = {
          type: propType.trim(),
          optional: Boolean(optional),
          tsName: propName
        };
      }
      
      interfaces[interfaceName] = {
        name: interfaceName,
        properties
      };
    }
    
    if (options.verbose) {
      console.log(chalk.gray(`Found ${Object.keys(interfaces).length} relevant interfaces`));
    }
    
    return interfaces;
  } catch (error) {
    console.error(chalk.red(`Failed to parse TypeScript interfaces: ${error.message}`));
    return {};
  }
}

/**
 * Parse SQL schema from current_schema.sql
 */
function parseSqlSchema() {
  console.log(chalk.gray('Parsing SQL schema...'));
  
  try {
    const schemaContent = fs.readFileSync(SCHEMA_FILE_PATH, 'utf8');
    const tables = {};
    
    // Extract table definitions
    const tableRegex = /CREATE TABLE public\.(\w+) \(([^;]*)\);/g;
    let tableMatch;
    
    while ((tableMatch = tableRegex.exec(schemaContent)) !== null) {
      const [, tableName, tableDefinition] = tableMatch;
      
      // Parse column definitions
      const columns = {};
      const lines = tableDefinition.trim().split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip constraint definitions and empty lines
        if (trimmedLine.startsWith('CONSTRAINT') || trimmedLine === '') {
          continue;
        }
        
        // Parse column definition
        const columnMatch = trimmedLine.match(/^(\w+) ([\w\[\]\(\)]+)(.*)$/);
        if (columnMatch) {
          const [, colName, colType, colOptions] = columnMatch;
          
          columns[colName] = {
            name: colName,
            type: colType,
            notNull: colOptions.includes('NOT NULL'),
            hasDefault: colOptions.includes('DEFAULT'),
            defaultValue: colOptions.includes('DEFAULT') ? 
              colOptions.match(/DEFAULT\s+([^,]*)/)[1] : null
          };
        }
      }
      
      tables[tableName] = {
        name: tableName,
        columns
      };
    }
    
    if (options.verbose) {
      console.log(chalk.gray(`Found ${Object.keys(tables).length} tables in schema`));
    }
    
    return tables;
  } catch (error) {
    console.error(chalk.red(`Failed to parse SQL schema: ${error.message}`));
    return {};
  }
}

/**
 * Parse model implementations from model JS files
 */
function parseModelImplementations() {
  console.log(chalk.gray('Parsing model implementations...'));
  
  try {
    const models = {};
    const modelFiles = fs.readdirSync(MODEL_DIR_PATH)
      .filter(file => file.endsWith('Model.js'));
    
    for (const modelFile of modelFiles) {
      const fileContent = fs.readFileSync(path.join(MODEL_DIR_PATH, modelFile), 'utf8');
      const modelName = modelFile.replace('Model.js', '');
      
      // Extract model fields
      const fields = {};
      
      // Look for field definitions in comments or code
      const fieldCommentRegex = /\/\*\*\s*\n\s*\*\s*@field\s+(\w+)\s*-\s*([^\n]*)/g;
      let fieldMatch;
      
      while ((fieldMatch = fieldCommentRegex.exec(fileContent)) !== null) {
        const [, fieldName, fieldDescription] = fieldMatch;
        fields[fieldName] = {
          name: fieldName,
          description: fieldDescription.trim()
        };
      }
      
      // Also look for fields in method signatures
      const methodFieldRegex = /async\s+\w+\(\{([^}]*)\}\)/g;
      let methodMatch;
      
      while ((methodMatch = methodFieldRegex.exec(fileContent)) !== null) {
        const paramStr = methodMatch[1];
        const paramFields = paramStr.split(',').map(p => p.trim());
        
        for (const param of paramFields) {
          if (param && !param.includes('=') && !fields[param]) {
            fields[param] = {
              name: param,
              fromMethod: true
            };
          }
        }
      }
      
      models[modelName] = {
        name: modelName,
        fields,
        filePath: path.join(MODEL_DIR_PATH, modelFile)
      };
    }
    
    if (options.verbose) {
      console.log(chalk.gray(`Found ${Object.keys(models).length} model implementations`));
    }
    
    return models;
  } catch (error) {
    console.error(chalk.red(`Failed to parse model implementations: ${error.message}`));
    return {};
  }
}

/**
 * Compare TypeScript interfaces with SQL schema
 */
function compareTypesToSql(tsInterfaces, sqlSchema) {
  console.log(chalk.gray('Comparing TypeScript interfaces with SQL schema...'));
  
  const issues = [];
  
  // Map interface names to table names
  const interfaceToTableMap = {
    'Person': 'persons',
    'LeadExtension': 'lead_extensions',
    'ReferralExtension': 'referral_extensions',
    'MemberExtension': 'member_extensions',
    'Relationship': 'relationships',
    'Interaction': 'interactions',
    'Message': 'messages',
    'User': 'users'
  };
  
  for (const [interfaceName, interfaceData] of Object.entries(tsInterfaces)) {
    const tableName = interfaceToTableMap[interfaceName];
    
    if (!tableName) {
      continue; // Skip interfaces that don't map directly to tables
    }
    
    const tableData = sqlSchema[tableName];
    
    if (!tableData) {
      issues.push({
        type: 'missing_table',
        description: `Interface "${interfaceName}" maps to table "${tableName}" which doesn't exist in the schema`,
        interfaceName,
        tableName
      });
      continue;
    }
    
    // Check properties against columns
    for (const [propName, propData] of Object.entries(interfaceData.properties)) {
      // Convert camelCase to snake_case for column comparison
      const expectedColumnName = camelToSnakeCase(propName);
      const columnData = tableData.columns[expectedColumnName];
      
      if (!columnData) {
        issues.push({
          type: 'missing_column',
          description: `Property "${propName}" in interface "${interfaceName}" doesn't have a corresponding column in table "${tableName}"`,
          interfaceName,
          propName,
          tableName,
          expectedColumnName
        });
        continue;
      }
      
      // Check type compatibility
      if (!isTypeCompatible(propData.type, columnData.type)) {
        issues.push({
          type: 'type_mismatch',
          description: `Type mismatch for property "${propName}" in interface "${interfaceName}": TypeScript has "${propData.type}", SQL has "${columnData.type}"`,
          interfaceName,
          propName,
          tsType: propData.type,
          sqlType: columnData.type
        });
      }
      
      // Check nullability
      if (propData.optional !== !columnData.notNull) {
        issues.push({
          type: 'nullability_mismatch',
          description: `Nullability mismatch for property "${propName}" in interface "${interfaceName}": TypeScript ${propData.optional ? 'has' : 'doesn\'t have'} optional marker, SQL ${columnData.notNull ? 'has' : 'doesn\'t have'} NOT NULL constraint`,
          interfaceName,
          propName,
          tsOptional: propData.optional,
          sqlNotNull: columnData.notNull
        });
      }
    }
    
    // Check for columns that aren't represented in the interface
    for (const [columnName, columnData] of Object.entries(tableData.columns)) {
      const expectedPropName = snakeToCamelCase(columnName);
      
      if (!interfaceData.properties[expectedPropName]) {
        issues.push({
          type: 'missing_property',
          description: `Column "${columnName}" in table "${tableName}" doesn't have a corresponding property in interface "${interfaceName}"`,
          tableName,
          columnName,
          interfaceName,
          expectedPropName
        });
      }
    }
  }
  
  return issues;
}

/**
 * Compare model implementations with SQL schema
 */
function compareModelsToSql(modelImplementations, sqlSchema) {
  console.log(chalk.gray('Comparing model implementations with SQL schema...'));
  
  const issues = [];
  
  // Map model names to table names
  const modelToTableMap = {
    'person': 'persons',
    'lead': 'lead_extensions',
    'referral': 'referral_extensions',
    'member': 'member_extensions',
    'relationship': 'relationships',
    'interaction': 'interactions',
    'message': 'messages',
    'user': 'users'
  };
  
  for (const [modelName, modelData] of Object.entries(modelImplementations)) {
    const tableName = modelToTableMap[modelName];
    
    if (!tableName) {
      continue; // Skip models that don't map directly to tables
    }
    
    const tableData = sqlSchema[tableName];
    
    if (!tableData) {
      issues.push({
        type: 'missing_table',
        description: `Model "${modelName}" maps to table "${tableName}" which doesn't exist in the schema`,
        modelName,
        tableName
      });
      continue;
    }
    
    // Check if all table columns have corresponding model fields
    for (const [columnName, columnData] of Object.entries(tableData.columns)) {
      // Skip common metadata fields that might not be explicitly handled in models
      if (['id', 'created_at', 'updated_at'].includes(columnName)) {
        continue;
      }
      
      const expectedFieldName = snakeToCamelCase(columnName);
      
      if (!modelData.fields[columnName] && !modelData.fields[expectedFieldName]) {
        issues.push({
          type: 'missing_model_field',
          description: `Column "${columnName}" in table "${tableName}" isn't explicitly handled in model "${modelName}"`,
          tableName,
          columnName,
          modelName,
          expectedFieldName
        });
      }
    }
  }
  
  return issues;
}

/**
 * Compare TypeScript interfaces with model implementations
 */
function compareTypesToModels(tsInterfaces, modelImplementations) {
  console.log(chalk.gray('Comparing TypeScript interfaces with model implementations...'));
  
  const issues = [];
  
  // Map interface names to model names
  const interfaceToModelMap = {
    'Person': 'person',
    'LeadExtension': 'lead',
    'ReferralExtension': 'referral',
    'MemberExtension': 'member',
    'Relationship': 'relationship',
    'Interaction': 'interaction',
    'Message': 'message',
    'User': 'user'
  };
  
  for (const [interfaceName, interfaceData] of Object.entries(tsInterfaces)) {
    const modelName = interfaceToModelMap[interfaceName];
    
    if (!modelName) {
      continue; // Skip interfaces that don't map directly to models
    }
    
    const modelData = modelImplementations[modelName];
    
    if (!modelData) {
      issues.push({
        type: 'missing_model',
        description: `Interface "${interfaceName}" maps to model "${modelName}" which doesn't exist in the codebase`,
        interfaceName,
        modelName
      });
      continue;
    }
    
    // For each property in the interface, check if the model handles it
    for (const [propName, propData] of Object.entries(interfaceData.properties)) {
      const snakeCaseName = camelToSnakeCase(propName);
      
      if (!modelData.fields[propName] && !modelData.fields[snakeCaseName]) {
        issues.push({
          type: 'missing_model_property',
          description: `Property "${propName}" in interface "${interfaceName}" isn't explicitly handled in model "${modelName}"`,
          interfaceName,
          propName,
          modelName
        });
      }
    }
  }
  
  return issues;
}

/**
 * Print results of schema consistency check
 */
function printResults(tsToSqlIssues, modelToSqlIssues, tsToModelIssues) {
  const totalIssues = tsToSqlIssues.length + modelToSqlIssues.length + tsToModelIssues.length;
  
  if (totalIssues === 0) {
    console.log(chalk.green('✅ No schema consistency issues found'));
    return;
  }
  
  console.log(chalk.yellow(`⚠️ Found ${totalIssues} schema consistency issues:\n`));
  
  if (tsToSqlIssues.length > 0) {
    console.log(chalk.yellow(`TypeScript to SQL issues (${tsToSqlIssues.length}):`));
    for (const issue of tsToSqlIssues) {
      console.log(chalk.yellow(`  • ${issue.description}`));
      if (options.verbose) {
        console.log(chalk.gray(`    Details: ${JSON.stringify(issue, null, 2)}`));
      }
    }
    console.log('');
  }
  
  if (modelToSqlIssues.length > 0) {
    console.log(chalk.yellow(`Model to SQL issues (${modelToSqlIssues.length}):`));
    for (const issue of modelToSqlIssues) {
      console.log(chalk.yellow(`  • ${issue.description}`));
      if (options.verbose) {
        console.log(chalk.gray(`    Details: ${JSON.stringify(issue, null, 2)}`));
      }
    }
    console.log('');
  }
  
  if (tsToModelIssues.length > 0) {
    console.log(chalk.yellow(`TypeScript to Model issues (${tsToModelIssues.length}):`));
    for (const issue of tsToModelIssues) {
      console.log(chalk.yellow(`  • ${issue.description}`));
      if (options.verbose) {
        console.log(chalk.gray(`    Details: ${JSON.stringify(issue, null, 2)}`));
      }
    }
    console.log('');
  }
  
  console.log(chalk.yellow('Run with --fix to attempt automatic fixes for these issues'));
}

/**
 * Attempt to fix identified issues
 */
function attemptToFixIssues(tsToSqlIssues, modelToSqlIssues, tsToModelIssues, tsInterfaces, sqlSchema, modelImplementations) {
  console.log(chalk.blue('🔧 Attempting to fix issues...'));
  
  let fixedCount = 0;
  
  // Fix TypeScript interface issues
  for (const issue of tsToSqlIssues) {
    if (issue.type === 'missing_property') {
      // Add missing property to TypeScript interface
      const interfaceName = issue.interfaceName;
      const propertyName = issue.expectedPropName;
      const columnData = sqlSchema[issue.tableName].columns[issue.columnName];
      
      const tsType = sqlTypeToTsType(columnData.type);
      const optionalMark = !columnData.notNull ? '?' : '';
      
      const typeContent = fs.readFileSync(TYPES_FILE_PATH, 'utf8');
      const interfaceRegex = new RegExp(`export\\s+interface\\s+${interfaceName}\\s*{([^}]*)}`, 'g');
      const interfaceMatch = interfaceRegex.exec(typeContent);
      
      if (interfaceMatch) {
        const interfaceBody = interfaceMatch[1];
        const updatedBody = `${interfaceBody}\n  ${propertyName}${optionalMark}: ${tsType};`;
        const updatedContent = typeContent.replace(interfaceBody, updatedBody);
        
        fs.writeFileSync(TYPES_FILE_PATH, updatedContent, 'utf8');
        console.log(chalk.green(`✅ Added missing property "${propertyName}" to interface "${interfaceName}"`));
        fixedCount++;
      }
    } else if (issue.type === 'nullability_mismatch' && issue.tsOptional !== !issue.sqlNotNull) {
      // Fix nullability mismatch in TypeScript interface
      const interfaceName = issue.interfaceName;
      const propertyName = issue.propName;
      
      const typeContent = fs.readFileSync(TYPES_FILE_PATH, 'utf8');
      const propRegex = new RegExp(`(\\s+${propertyName})(\\??)(:\\s*[^;]*;)`, 'g');
      const propMatch = propRegex.exec(typeContent);
      
      if (propMatch) {
        const [fullMatch, start, optionalMark, end] = propMatch;
        const updatedOptionalMark = !issue.sqlNotNull ? '?' : '';
        const updatedContent = typeContent.replace(fullMatch, `${start}${updatedOptionalMark}${end}`);
        
        fs.writeFileSync(TYPES_FILE_PATH, updatedContent, 'utf8');
        console.log(chalk.green(`✅ Fixed nullability for property "${propertyName}" in interface "${interfaceName}"`));
        fixedCount++;
      }
    }
  }
  
  // Fix model implementation issues
  for (const issue of modelToSqlIssues) {
    if (issue.type === 'missing_model_field') {
      // Add field comment to model implementation
      const modelName = issue.modelName;
      const modelData = modelImplementations[modelName];
      const columnName = issue.columnName;
      const fieldName = issue.expectedFieldName;
      
      if (modelData && modelData.filePath) {
        const modelContent = fs.readFileSync(modelData.filePath, 'utf8');
        const classRegex = /class\s+\w+Model\s*{/;
        const classMatch = classRegex.exec(modelContent);
        
        if (classMatch) {
          const insertPosition = classMatch.index + classMatch[0].length;
          const fieldComment = `\n\n  /**\n   * @field ${fieldName} - Column: ${columnName}\n   */`;
          const updatedContent = modelContent.slice(0, insertPosition) + fieldComment + modelContent.slice(insertPosition);
          
          fs.writeFileSync(modelData.filePath, updatedContent, 'utf8');
          console.log(chalk.green(`✅ Added field documentation for "${fieldName}" in model "${modelName}"`));
          fixedCount++;
        }
      }
    }
  }
  
  console.log(chalk.blue(`Fixed ${fixedCount} issues automatically`));
  
  if (fixedCount > 0) {
    console.log(chalk.blue('Re-run the tool to check if there are still issues'));
  }
}

/**
 * Helper function to determine if an interface is relevant for database schema mapping
 */
function isRelevantInterface(name) {
  const relevantInterfaces = [
    'Person', 'LeadExtension', 'ReferralExtension', 'MemberExtension',
    'Relationship', 'Interaction', 'Message', 'User'
  ];
  
  return relevantInterfaces.includes(name);
}

/**
 * Helper function to convert camelCase to snake_case
 */
function camelToSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Helper function to convert snake_case to camelCase
 */
function snakeToCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Helper function to check if TypeScript type is compatible with SQL type
 */
function isTypeCompatible(tsType, sqlType) {
  const tsToSqlMap = {
    'string': ['text', 'varchar', 'char', 'uuid', 'date'],
    'number': ['integer', 'numeric', 'decimal', 'float', 'real'],
    'boolean': ['boolean'],
    'Date': ['timestamp', 'date', 'time'],
    'object': ['jsonb', 'json'],
    'any': ['jsonb', 'json'],
    'any[]': ['jsonb[]', 'json[]', 'text[]'],
    'string[]': ['text[]'],
    'number[]': ['integer[]', 'numeric[]']
  };
  
  // Clean up the TS type (remove optional modifiers, etc.)
  const cleanTsType = tsType.replace(/\s+/g, '').replace(/\|null/g, '');
  
  // Look for array type notations
  const isArrayType = cleanTsType.includes('[]') || 
                     cleanTsType.startsWith('Array<') || 
                     sqlType.includes('[]') ||
                     sqlType.toUpperCase().includes('ARRAY');
  
  if (isArrayType) {
    return true; // Simplified array compatibility check
  }
  
  // Check against compatibility map
  for (const [ts, sqlTypes] of Object.entries(tsToSqlMap)) {
    if (cleanTsType.includes(ts)) {
      for (const compatSqlType of sqlTypes) {
        if (sqlType.toLowerCase().includes(compatSqlType)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Helper function to convert SQL type to TypeScript type
 */
function sqlTypeToTsType(sqlType) {
  const sqlToTsMap = {
    'uuid': 'string',
    'text': 'string',
    'varchar': 'string',
    'char': 'string',
    'integer': 'number',
    'numeric': 'number',
    'decimal': 'number',
    'float': 'number',
    'real': 'number',
    'boolean': 'boolean',
    'timestamp': 'string', // or Date if using a date library
    'date': 'string',      // or Date if using a date library
    'time': 'string',
    'jsonb': 'Record<string, any>',
    'json': 'Record<string, any>'
  };
  
  // Handle array types
  if (sqlType.includes('[]')) {
    const baseType = sqlType.replace('[]', '');
    return `${sqlToTsMap[baseType] || 'any'}[]`;
  }
  
  // Handle basic types
  for (const [sql, ts] of Object.entries(sqlToTsMap)) {
    if (sqlType.toLowerCase().includes(sql)) {
      return ts;
    }
  }
  
  return 'any';
}

// Execute the main function
checkSchemaConsistency()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error(chalk.red(`Unhandled error: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }); 