# Developer Guidelines for the ORCA Schema

This document provides best practices and guidelines for developers working with the ORCA database schema.

## Data Model Principles

### 1. Unified Person Model

ORCA uses a unified person model where all contacts are stored in the `persons` table, regardless of whether they are leads, referrals, or members.

#### Implementation Guidelines

- Always check role flags (`is_lead`, `is_referral`, `is_member`) before assuming a specific extension exists
- Never create extension records without setting the corresponding flag in the `persons` table
- Use JOIN queries rather than separate queries when retrieving extension data
- Handle multiple roles properly (a person can be both a member and a referral source)

### 2. Extension Pattern

Role-specific data is stored in extension tables to keep the core persons table clean.

#### Implementation Guidelines

- Create extension records in the same transaction as the person record
- Ensure referential integrity with ON DELETE CASCADE for all extension tables
- Never access extension data directly without joining to the persons table
- Use LEFT JOIN when you're not sure if an extension exists

### 3. Relationship Modeling

The relationships table models connections between people, supporting complex referral networks.

#### Implementation Guidelines

- Use consistent direction conventions (referrer is always person_a, referral is always person_b)
- Handle bidirectional relationships appropriately 
- Check for existing relationships with the same three-part primary key before inserting
- Consider relationship_level when querying multi-level referral chains

## Constraint Management

### Range Constraints

- `readiness_score`: Must be between 1 and 10
- `conversion_probability`: Must be between 0 and 100
- `relationship_level`: Must be at least 1
- `billing_day`: Must be between 1 and 31
- `satisfaction_score`: Must be between 1 and 10
- `attribution_percentage`: Must be between 0 and 100

### Implementation Strategies

1. **Client-side Validation**
   ```javascript
   // Example Yup validation for readiness_score
   readiness_score: Yup.number()
     .min(1, 'Readiness score must be at least 1')
     .max(10, 'Readiness score cannot exceed 10')
     .nullable()
   ```

2. **Server-side Validation**
   ```javascript
   // Example server-side validation
   const validateLeadExtension = (data) => {
     const errors = {};
     
     if (data.readiness_score !== null && 
         (data.readiness_score < 1 || data.readiness_score > 10)) {
       errors.readiness_score = 'Readiness score must be between 1 and 10';
     }
     
     // More validations...
     
     return errors;
   };
   ```

3. **Database Error Handling**
   ```javascript
   try {
     // Database operation
   } catch (error) {
     if (error.code === '23514') { // Check constraint violation
       // Handle specific constraint errors
       if (error.message.includes('ck_readiness_score')) {
         return { error: 'Readiness score must be between 1 and 10' };
       }
     }
     throw error;
   }
   ```

## Data Type Handling

### JSONB Fields

JSONB fields store structured data that doesn't need its own table. Example fields:

- `address` in persons
- `social_profiles` in persons
- `preferred_contact_times` in persons
- `utm_parameters` in persons
- `objections` in lead_extensions

#### Implementation Guidelines

- Always use structured objects with defined keys
- Use null for missing values rather than undefined
- Keep JSONB objects reasonably sized (avoid deeply nested structures)
- Use JSONB operators in queries for efficiency

```javascript
// Example of querying with JSONB operators
const getUsersInCity = async (city) => {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .filter('address->city', 'eq', city);
    
  if (error) throw error;
  return data;
};
```

### Array Types

Array fields store lists of related simple values. Example fields:

- `tags` in persons
- `interested_services` in persons
- `pain_points` in lead_extensions
- `motivations` in lead_extensions
- `conversion_blockers` in lead_extensions

#### Implementation Guidelines

- Use consistent data types within arrays
- Avoid extremely large arrays (consider using a junction table instead)
- Use array operators in queries

```javascript
// Example of querying with array operators
const getPersonsWithTag = async (tag) => {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .contains('tags', [tag]);
    
  if (error) throw error;
  return data;
};
```

## Transactions and Data Integrity

### Transaction Patterns

1. **Creating a Person with Extensions**
   ```javascript
   const createLead = async (personData, leadExtensionData) => {
     try {
       // Start transaction
       const { data: person, error: personError } = await supabase
         .from('persons')
         .insert({
           ...personData,
           is_lead: true,
         })
         .select()
         .single();
         
       if (personError) throw personError;
       
       // Create extension in same transaction
       const { data: leadExtension, error: extensionError } = await supabase
         .from('lead_extensions')
         .insert({
           ...leadExtensionData,
           person_id: person.id,
         })
         .select()
         .single();
         
       if (extensionError) throw extensionError;
       
       return { person, leadExtension };
     } catch (error) {
       // Handle errors
       throw error;
     }
   };
   ```

2. **Updating Multiple Related Records**
   ```javascript
   const updateReferralWithAppointment = async (referralId, appointmentData) => {
     try {
       // Start with referral extension update
       const { data: referralExtension, error: extensionError } = await supabase
         .from('referral_extensions')
         .update({
           appointment_date: appointmentData.date,
           appointment_status: 'scheduled',
           google_calendar_event_id: appointmentData.eventId,
           referral_status: 'appointment_scheduled',
           status_history: supabase.sql`array_append(status_history, ${JSON.stringify({
             status: 'appointment_scheduled',
             timestamp: new Date().toISOString(),
             notes: 'Appointment scheduled'
           })})`
         })
         .eq('id', referralId)
         .select()
         .single();
         
       if (extensionError) throw extensionError;
       
       // Update the person record
       const { error: personError } = await supabase
         .from('persons')
         .update({
           next_scheduled_contact: appointmentData.date
         })
         .eq('id', referralExtension.person_id);
         
       if (personError) throw personError;
       
       return referralExtension;
     } catch (error) {
       // Handle errors
       throw error;
     }
   };
   ```

## Performance Optimization

### Query Optimization

1. **Use Covering Indexes**
   - For frequently used filters, ensure appropriate indexes exist
   - For complex queries, consider composite indexes

2. **Minimize Number of Queries**
   - Use JOINs rather than multiple separate queries
   - When getting a person with extensions, fetch in one query with joins

3. **Select Only Needed Fields**
   ```javascript
   // Instead of this:
   const { data } = await supabase.from('persons').select('*');
   
   // Do this:
   const { data } = await supabase.from('persons').select('id, first_name, last_name, email');
   ```

4. **Use Paging for Large Result Sets**
   ```javascript
   const getLeads = async (page = 0, pageSize = 10) => {
     const from = page * pageSize;
     const to = from + pageSize - 1;
     
     const { data, error } = await supabase
       .from('persons')
       .select(`
         *,
         lead_extensions(*)
       `)
       .eq('is_lead', true)
       .range(from, to);
       
     if (error) throw error;
     return data;
   };
   ```

## Schema Evolution

### Adding New Fields

1. **Add to SQL Schema First**
   - Use migrations to add fields to the database schema
   - Set appropriate defaults and constraints

2. **Update TypeScript Interfaces**
   - Add new fields to interfaces in `server/db/schema/types.ts`
   - Mark as optional if adding to existing records

3. **Update Models**
   - Add field definitions to model field lists
   - Add validation logic for new constraints

4. **Update Client Code**
   - Add fields to forms and validation schemas
   - Update data transformation logic

### Example Migration Process

```sql
-- Example migration to add a new field
ALTER TABLE lead_extensions 
ADD COLUMN follow_up_priority TEXT DEFAULT 'normal';

-- Add constraint
ALTER TABLE lead_extensions
ADD CONSTRAINT ck_follow_up_priority 
CHECK (follow_up_priority IN ('high', 'normal', 'low'));
```

## Testing Guidelines

### Data Model Tests

- Test constraint validation with edge case values
- Test cascade deletes across relationships
- Test queries with JOINs to ensure correct relationships

### API Tests

- Test validation error handling for constraint violations
- Test transactions with intentional errors to ensure rollback
- Test complex queries with various filter combinations

## Troubleshooting Common Issues

### Foreign Key Constraint Violations

**Problem**: Errors when inserting/updating records with invalid foreign keys.

**Solution**:
1. Ensure the referenced record exists before creating dependent records
2. Use transactions to ensure consistent order of operations
3. Check for typos in ID fields

### Check Constraint Violations

**Problem**: Errors when inserting/updating with values outside allowed ranges.

**Solution**:
1. Add client-side validation matching database constraints
2. Check for type conversions (e.g., string to number) that might change values
3. Ensure default values are within constraint ranges

### Unique Constraint Violations

**Problem**: Errors when trying to insert duplicate records.

**Solution**:
1. Check for existing records before inserting
2. Implement upsert patterns where appropriate
3. Add client-side validation to check for duplicates

## Additional Resources

- [Supabase JavaScript Client Documentation](https://supabase.io/docs/reference/javascript/start)
- [PostgreSQL JSON Functions and Operators](https://www.postgresql.org/docs/current/functions-json.html)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html) 