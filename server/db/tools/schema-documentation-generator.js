#!/usr/bin/env node

/**
 * Schema Documentation Generator
 * 
 * This tool generates comprehensive documentation from the database schema.
 * It creates Markdown files documenting the database structure, relationships,
 * and constraints.
 * 
 * Usage:
 *   node server/db/tools/schema-documentation-generator.js [output-dir]
 * 
 * Arguments:
 *   output-dir - Directory to save the generated documentation (default: docs/schema)
 */

const fs = require('fs');
const path = require('path');
const { supabase } = require('../supabase');

// Configuration
const SCHEMA_FILE_PATH = path.join(__dirname, '../schema/current_schema.sql');
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '../../../docs/schema');

// Parse command line arguments
const outputDir = process.argv[2] || DEFAULT_OUTPUT_DIR;

// Table relationships
const TABLE_RELATIONSHIPS = {
  'persons': {
    hasOne: ['lead_extensions', 'referral_extensions', 'member_extensions'],
    belongsTo: ['users'],
    hasMany: ['relationships', 'interactions', 'messages']
  },
  'users': {
    hasMany: ['persons', 'interactions', 'messages']
  },
  'lead_extensions': {
    belongsTo: ['persons']
  },
  'referral_extensions': {
    belongsTo: ['persons']
  },
  'member_extensions': {
    belongsTo: ['persons']
  },
  'relationships': {
    belongsTo: ['persons']
  },
  'interactions': {
    belongsTo: ['persons', 'users']
  },
  'messages': {
    belongsTo: ['persons', 'users']
  }
};

// Important constraints to highlight
const IMPORTANT_CONSTRAINTS = [
  'readiness_score must be between 1 and 10',
  'conversion_probability must be between 0 and 100',
  'relationship_level must be at least 1',
  'billing_day must be between 1 and 31',
  'satisfaction_score must be between 1 and 10',
  'attribution_percentage must be between 0 and 100'
];

/**
 * Main function to generate documentation
 */
async function generateDocumentation() {
  try {
    console.log('Generating schema documentation...');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get database schema information
    const schema = await getSchemaInfo();
    
    // Generate main documentation file
    generateMainDocumentation(schema);
    
    // Generate individual table documentation files
    for (const table of schema.tables) {
      generateTableDocumentation(table, schema);
    }
    
    // Generate ERD documentation
    generateERDDocumentation(schema);
    
    // Generate constraints documentation
    generateConstraintsDocumentation(schema);
    
    console.log(`Documentation generated successfully in ${outputDir}`);
  } catch (error) {
    console.error('Error generating documentation:', error.message);
    process.exit(1);
  }
}

/**
 * Get schema information from the database
 */
async function getSchemaInfo() {
  // Get tables
  const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
  if (tablesError) throw new Error(`Error fetching tables: ${tablesError.message}`);
  
  // Get columns
  const { data: columns, error: columnsError } = await supabase.rpc('get_columns');
  if (columnsError) throw new Error(`Error fetching columns: ${columnsError.message}`);
  
  // Get constraints
  const { data: constraints, error: constraintsError } = await supabase.rpc('get_constraints');
  if (constraintsError) throw new Error(`Error fetching constraints: ${constraintsError.message}`);
  
  // Get indexes
  const { data: indexes, error: indexesError } = await supabase.rpc('get_indexes');
  if (indexesError) throw new Error(`Error fetching indexes: ${indexesError.message}`);
  
  // Organize data
  const schema = {
    tables: tables.map(table => ({
      name: table.table_name,
      description: getTableDescription(table.table_name),
      columns: columns.filter(col => col.table_name === table.table_name),
      constraints: constraints.filter(con => con.table_name === table.table_name),
      indexes: indexes.filter(idx => idx.table_name === table.table_name),
      relationships: TABLE_RELATIONSHIPS[table.table_name] || {}
    }))
  };
  
  return schema;
}

/**
 * Get table description
 */
function getTableDescription(tableName) {
  const descriptions = {
    'persons': 'Core table that stores all person records (leads, referrals, members).',
    'lead_extensions': 'Extended information specific to leads, linked to persons table.',
    'referral_extensions': 'Extended information specific to referrals, linked to persons table.',
    'member_extensions': 'Extended information specific to members, linked to persons table.',
    'relationships': 'Tracks relationships between persons (referrals, memberships, etc.).',
    'interactions': 'Records all interactions with persons (calls, meetings, etc.).',
    'messages': 'Stores all messages sent to or received from persons.',
    'users': 'System users (salespeople, administrators).'
  };
  
  return descriptions[tableName] || `Table that stores ${tableName.replace(/_/g, ' ')}.`;
}

/**
 * Generate main documentation file
 */
function generateMainDocumentation(schema) {
  const content = `# ORCA Database Schema Documentation

This documentation was automatically generated from the database schema on ${new Date().toISOString().split('T')[0]}.

## Tables

${schema.tables.map(table => `* [${table.name}](${table.name}.md) - ${table.description}`).join('\n')}

## Entity Relationship Diagram

See the [Entity Relationship Diagram](erd.md) for a visual representation of the database schema.

## Constraints

See the [Constraints Documentation](constraints.md) for a detailed list of all constraints in the database.

## Important Implementation Notes

1. **Unified Person Model**: A single \`persons\` table serves as the foundation for all contact types (leads, referrals, members)
2. **Extension Pattern**: Specialized data is stored in extension tables that reference the base person record
3. **Relationship Tracking**: Explicit modeling of relationships between people for referral network analysis
4. **Activity Monitoring**: Comprehensive tracking of all interactions and communications
5. **Flexible Data Storage**: Use of JSONB and array types for evolving data needs
6. **Audit Trail**: Timestamp tracking for all major actions and status changes

## Key Constraints

${IMPORTANT_CONSTRAINTS.map(constraint => `* ${constraint}`).join('\n')}
`;

  fs.writeFileSync(path.join(outputDir, 'README.md'), content);
  console.log('Generated main documentation file');
}

/**
 * Generate table documentation
 */
function generateTableDocumentation(table, schema) {
  const content = `# ${table.name}

${table.description}

## Columns

| Name | Type | Nullable | Default | Description |
|------|------|----------|---------|-------------|
${table.columns.map(col => {
  const defaultValue = col.column_default ? col.column_default.replace(/::[\w\s]+/g, '') : 'NULL';
  return `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${defaultValue} | ${getColumnDescription(table.name, col.column_name)} |`;
}).join('\n')}

## Constraints

${table.constraints.length > 0 ? table.constraints.map(con => `* **${con.constraint_name}**: ${con.constraint_type} ${con.constraint_definition}`).join('\n') : 'No constraints.'}

## Indexes

${table.indexes.length > 0 ? table.indexes.map(idx => `* **${idx.index_name}**: ${idx.index_definition}`).join('\n') : 'No indexes.'}

## Relationships

${Object.entries(table.relationships).length > 0 ? `
${Object.entries(table.relationships).map(([type, tables]) => {
  if (Array.isArray(tables) && tables.length > 0) {
    return `### ${capitalizeFirstLetter(type)}
${tables.map(relatedTable => `* [${relatedTable}](${relatedTable}.md)`).join('\n')}`;
  }
  return '';
}).filter(section => section !== '').join('\n\n')}
` : 'No relationships.'}

## Usage

This table is used in the following contexts:

${getTableUsageContext(table.name)}
`;

  fs.writeFileSync(path.join(outputDir, `${table.name}.md`), content);
  console.log(`Generated documentation for table ${table.name}`);
}

/**
 * Generate ERD documentation
 */
function generateERDDocumentation(schema) {
  const content = `# Entity Relationship Diagram

This document provides a textual representation of the Entity Relationship Diagram for the ORCA database.

## Core Relationships

\`\`\`
persons
│
├─────── users (assigned_to)
│
├─────── lead_extensions (1:1)
│
├─────── referral_extensions (1:1)
│
├─────── member_extensions (1:1)
│
├─────── interactions (1:n)
│
└─────── messages (1:n)
\`\`\`

## Relationship Network

The \`relationships\` table creates complex networks between persons:

\`\`\`
         ┌─────────────────┐
         │                 │
         ▼                 │
persons ◄─┼───► relationships ◄──► persons
         │                 ▲
         │                 │
         └─────────────────┘
\`\`\`

## Communication Flow

\`\`\`
users ───► messages ───► persons
  │                       ▲
  │                       │
  └───► interactions ─────┘
\`\`\`

## Database Tables

${schema.tables.map(table => {
  const primaryKeys = table.constraints
    .filter(con => con.constraint_type === 'PRIMARY KEY')
    .map(con => con.constraint_definition.match(/\(([^)]+)\)/)[1])
    .join(', ');
    
  return `### ${table.name}
Primary Key: ${primaryKeys}
${table.columns.map(col => `- ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})`).join('\n')}`;
}).join('\n\n')}
`;

  fs.writeFileSync(path.join(outputDir, 'erd.md'), content);
  console.log('Generated ERD documentation');
}

/**
 * Generate constraints documentation
 */
function generateConstraintsDocumentation(schema) {
  // Group constraints by type
  const constraintsByType = {};
  
  schema.tables.forEach(table => {
    table.constraints.forEach(constraint => {
      if (!constraintsByType[constraint.constraint_type]) {
        constraintsByType[constraint.constraint_type] = [];
      }
      
      constraintsByType[constraint.constraint_type].push({
        table: table.name,
        name: constraint.constraint_name,
        definition: constraint.constraint_definition
      });
    });
  });
  
  const content = `# Database Constraints

This document lists all constraints in the ORCA database, organized by type.

${Object.entries(constraintsByType).map(([type, constraints]) => `
## ${type}

${constraints.map(con => `* **${con.table}.${con.name}**: ${con.definition}`).join('\n')}
`).join('\n')}

## Validation Notes

These constraints are enforced at the database level. Application-level validation should be implemented to prevent constraint violations before data reaches the database.

Important validation rules:

${IMPORTANT_CONSTRAINTS.map(constraint => `* ${constraint}`).join('\n')}

## Implementation in Code

The application code implements these constraints in the following ways:

1. **TypeScript interfaces** - Types defined in \`server/db/schema/types.ts\`
2. **Model validation** - Validation in model files at \`server/models/*Model.js\`
3. **Form validation** - Client-side validation in \`client/src/components/*/Form.js\`
4. **API validation** - API endpoint validation in \`server/controllers/*Controller.js\`
5. **Runtime validation** - Middleware validation in \`server/middleware/schemaValidation.js\`
`;

  fs.writeFileSync(path.join(outputDir, 'constraints.md'), content);
  console.log('Generated constraints documentation');
}

/**
 * Get column description
 */
function getColumnDescription(tableName, columnName) {
  // Known column descriptions
  const descriptions = {
    'id': 'Unique identifier (UUID v4)',
    'created_at': 'Record creation timestamp',
    'updated_at': 'Last update timestamp',
    'first_name': 'Person\'s first name',
    'last_name': 'Person\'s last name',
    'email': 'Email address',
    'phone': 'Primary contact phone number',
    'is_lead': 'Flag indicating if person is a lead',
    'is_referral': 'Flag indicating if person is a referral',
    'is_member': 'Flag indicating if person is a member',
    'lead_status': 'Current status in the lead pipeline',
    'referral_status': 'Current status in the referral process',
    'appointment_date': 'Scheduled appointment date',
    'assigned_to': 'Reference to user responsible for this person',
    'relationship_type': 'Type of relationship between persons',
    'readiness_score': 'Lead readiness score (1-10)',
    'conversion_probability': 'Probability of conversion (0-100%)',
    'relationship_level': 'Network depth level (>=1)',
    'message_type': 'Type of message (email, sms, etc.)',
    'content': 'Message or interaction content',
    'subject': 'Subject line or title'
  };
  
  // Table-specific column descriptions
  const tableSpecificDescriptions = {
    'lead_extensions': {
      'person_id': 'Reference to the person record in persons table',
      'lead_temperature': 'Hot/warm/cold classification',
      'visit_completed': 'Flag indicating if facility visit is completed',
      'trial_status': 'Current status of trial membership'
    },
    'referral_extensions': {
      'person_id': 'Reference to the person record in persons table',
      'relationship_to_referrer': 'Nature of relationship to the referring person',
      'appointment_status': 'Status of the scheduled appointment',
      'google_calendar_event_id': 'ID of the event in Google Calendar'
    },
    'member_extensions': {
      'person_id': 'Reference to the person record in persons table',
      'membership_type': 'Type of membership',
      'membership_status': 'Current status of the membership',
      'billing_day': 'Day of month for billing (1-31)',
      'check_in_count': 'Number of times member has checked in'
    }
  };
  
  // Return the description if found
  if (tableSpecificDescriptions[tableName]?.[columnName]) {
    return tableSpecificDescriptions[tableName][columnName];
  }
  
  return descriptions[columnName] || '';
}

/**
 * Get table usage context
 */
function getTableUsageContext(tableName) {
  const usageContexts = {
    'persons': `* **Lead Management** - Storing and tracking leads
* **Referral System** - Managing referrals
* **Member Management** - Tracking active members
* **Communication** - Sending messages to contacts`,
    'lead_extensions': `* **Lead Pipeline** - Managing leads through sales stages
* **Lead Qualification** - Scoring and qualifying leads
* **Sales Forecasting** - Predicting conversion probability`,
    'referral_extensions': `* **Referral Program** - Tracking referral status
* **Appointment Scheduling** - Managing appointments with referrals
* **Referral Incentives** - Tracking incentives for referrals`,
    'member_extensions': `* **Membership Management** - Tracking active memberships
* **Billing** - Managing billing cycles
* **Retention** - Monitoring attendance and satisfaction
* **Referral Network** - Leveraging members for referrals`,
    'relationships': `* **Referral Network** - Mapping relationships between persons
* **Attribution** - Tracking who referred whom
* **Multi-Level Referrals** - Managing chains of referrals`,
    'interactions': `* **Contact History** - Recording all interactions with leads/members
* **Activity Tracking** - Monitoring engagement
* **Follow-up Scheduling** - Planning next interactions`,
    'messages': `* **Communication Center** - Managing all messages
* **Text Blast** - Sending bulk messages
* **Conversation History** - Tracking message threads`,
    'users': `* **User Authentication** - Managing access to the system
* **Assignment** - Assigning leads to salespeople
* **Performance Tracking** - Monitoring salesperson performance`
  };
  
  return usageContexts[tableName] || '* No specific usage contexts documented.';
}

/**
 * Helper function to capitalize first letter
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Execute the main function
generateDocumentation().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 