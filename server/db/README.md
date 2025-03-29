# Database Schema and Management

This directory contains the database schema, migrations, and database management utilities for the ORCA Lead Management Software.

## Schema Files

- **`schema/types.ts`**: TypeScript interface definitions for the database tables
- **`schema/current_schema.sql`**: The current and verified database schema in SQL format
- **`migrations/`**: Database migration files for sequential schema changes

## Database Schema Alignment

We are currently in the process of aligning the TypeScript interfaces with the SQL schema to ensure consistency throughout the application. The `current_schema.sql` file represents the canonical database structure.

### Ongoing Alignment Tasks

1. Update TypeScript interfaces in `schema/types.ts` to match the SQL schema
2. Update model implementations to properly validate against schema constraints
3. Verify that client-side code respects database constraints
4. Add proper validation for all constraint types (NOT NULL, unique, check constraints, etc.)
5. Ensure consistent handling of complex data types (JSONB, arrays, etc.)

For a complete list of alignment tasks, see the [Database Schema Alignment](../../README.md#database-schema-alignment) section in the main README.

## Schema Verification

You can verify your local schema against the reference schema using:

```bash
cd server
node db/check-schema.js
```

This will check your local database against the expected schema and report any discrepancies.

## Migrations

The `migrations/` directory contains SQL migration files numbered in sequential order:

- **`000_setup_helper_functions.sql`**: Sets up helper functions for migrations
- **`001_initial_schema.sql`**: Creates the initial database tables and relationships
- **`002_row_level_security.sql`**: Adds row-level security policies for data access control

To apply migrations:

```bash
cd server
node db/apply-migrations.js
```

## Seed Data

To populate the database with test data:

```bash
cd server
node db/seed-data.js
```

## Backup and Restore

For database backup and restore functionality, see the [Database Backup System](../../README.md#database-backup-system) section in the main README.

## Directory Structure

- `/migrations` - SQL migration files that define the database schema
  - Files are executed in alphabetical order (001_*, 002_*, etc.)
  - `000_setup_helper_functions.sql` - Sets up utility functions required by our scripts
  - `001_initial_schema.sql` - Creates the initial database tables and indexes
- `/schema` - TypeScript type definitions that match the database schema
  - `types.ts` - Type definitions for all database tables
- Root scripts:
  - `apply-migrations.js` - Applies migrations to the Supabase database
  - `check-schema.js` - Checks the current state of the database schema

## Database Schema

The ORCA database uses a unified person model with extension tables:

1. **Core tables**:
   - `users` - User accounts for admins and salespeople
   - `persons` - Unified model for leads, referrals, and members
   - `lead_extensions` - Additional data for leads
   - `referral_extensions` - Additional data for referrals
   - `member_extensions` - Additional data for members

2. **Relationship and interaction tables**:
   - `relationships` - Defines relationships between people (referrals, etc.)
   - `interactions` - Tracks all interactions with leads and members
   - `messages` - Stores all communication (email, SMS, blasts)

## Migration Process

### Initial Setup (Required Only Once)

Before running migrations for the first time, you need to set up helper functions in your Supabase database:

1. Go to the Supabase dashboard for your project
2. Navigate to the SQL editor
3. Copy the contents of `migrations/000_setup_helper_functions.sql`
4. Execute the SQL to create the helper functions

### Running Migrations

To apply migrations to your Supabase database:

```bash
# Ensure you have the correct environment variables in .env
npm run db:migrate
```

### Checking Database Schema

To check the current state of your Supabase database:

```bash
npm run db:check
```

### Creating New Migrations

To create a new migration file:

```bash
npm run db:setup
```

This will create a new file `002_next_migration.sql` (incrementing as needed).

## Environment Variables

The migration scripts require the following environment variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

Make sure these are set in your `.env` file at the project root.

## Row-Level Security (RLS)

The database uses Supabase's Row Level Security features to control access to data:

- Users can only see data assigned to them (except admins)
- Basic policies are set up in the initial migration
- Additional policies can be added in future migrations

## Best Practices

1. Never modify existing migrations after they've been applied
2. Create new migrations for schema changes
3. Always use migrations for schema changes, not manual SQL
4. Keep TypeScript types in sync with the database schema 