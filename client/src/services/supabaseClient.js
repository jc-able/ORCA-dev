import { createClient } from '@supabase/supabase-js';
import { dbConfig, featureFlags } from '../utils/envHelper';
import { 
  processRecord, 
  tableSchemas 
} from '../utils/dataTransformUtils';
import { 
  validateOrThrow, 
  handleConstraintError, 
  isValidUuid 
} from '../utils/dbValidation';

/**
 * Supabase client configuration
 * 
 * Using environment variables for Supabase URL and API key
 * In development, these will come from .env file
 * In production, they will be set in the hosting platform (Vercel)
 * 
 * For local development, create a .env file with:
 * REACT_APP_SUPABASE_URL=your-supabase-url
 * REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
 * REACT_APP_DATABASE_URL=your-database-url (optional, for advanced queries)
 */

// Debug logging for environment variables in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.log('Supabase URL:', dbConfig.supabaseUrl);
  console.log('Supabase Key exists:', !!dbConfig.supabaseKey);
  console.log('Database URL exists:', !!dbConfig.databaseUrl);
} else {
  console.log('Environment check: REACT_APP_SUPABASE_URL exists:', !!process.env.REACT_APP_SUPABASE_URL);
  console.log('Environment check: REACT_APP_SUPABASE_ANON_KEY exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
}

// Check if we're using real or fallback credentials
if (!dbConfig.hasValidCredentials()) {
  console.warn('Using fallback Supabase credentials. Please check your .env file.');
}

// Initialize Supabase client with options
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'apikey': dbConfig.supabaseKey
    }
  }
};

// Add database URL if available and direct DB access is enabled
if (dbConfig.hasDirectDbAccess() && featureFlags.enableDirectDbAccess) {
  options.db = { 
    schema: 'public',
    connectionString: dbConfig.databaseUrl 
  };
  console.log('Using direct database connection for advanced queries');
}

// Create the Supabase client with explicit URL, key, and options
export const supabase = createClient(dbConfig.supabaseUrl, dbConfig.supabaseKey, options);

// Verify the client has the API key properly set
const verifyClientAuth = () => {
  try {
    const headers = supabase.rest.headers;
    if (!headers?.apikey && !headers?.['apikey']) {
      console.error('Supabase client missing apikey in headers');
      
      // Try to add it directly to the client's headers
      supabase.rest.headers['apikey'] = dbConfig.supabaseKey;
      console.log('Added apikey to Supabase client headers');
    } else {
      console.log('Supabase client has apikey in headers');
    }
  } catch (e) {
    console.error('Error verifying Supabase headers:', e);
  }
};

// Run the verification immediately
verifyClientAuth();

/**
 * Check Supabase connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export const checkConnection = async () => {
  try {
    // Log credentials status before attempting connection
    console.log('Attempting Supabase connection with:', {
      url: dbConfig.supabaseUrl.substring(0, 10) + '...',
      keyExists: !!dbConfig.supabaseKey,
      keyLength: dbConfig.supabaseKey ? dbConfig.supabaseKey.length : 0
    });
    
    // Verify client auth headers before making request
    verifyClientAuth();
    
    // Simple query to check connection
    const { error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      
      // If error is API key related, try to reinitialize client
      if (error.message?.includes('API key') || error.message?.includes('apikey')) {
        console.log('Attempting to reinitialize Supabase client with explicit headers');
        
        // Try adding apikey as direct parameter to the request
        const { error: retryError } = await supabase.from('users')
          .select('id')
          .limit(1)
          .headers({ 'apikey': dbConfig.supabaseKey });
          
        if (!retryError) {
          console.log('Retry with explicit apikey header succeeded');
          return true;
        } else {
          console.error('Retry with explicit apikey header failed:', retryError.message);
        }
      }
      
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
};

/**
 * Fetch leads data directly from Supabase
 * @param {Object} options - Query options
 * @param {Object} options.filters - Filter parameters
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Items per page
 * @returns {Promise<Object>} - Query result with data and pagination info
 */
export const fetchLeadsData = async ({ filters = {}, page = 1, limit = 20 }) => {
  try {
    // Convert 1-based page to 0-based for range calculation
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    console.log('Fetching leads with filters:', filters);
    
    // Check if the assigned_to filter has a valid UUID format
    if (filters.assigned_to && typeof filters.assigned_to === 'string') {
      if (!isValidUuid(filters.assigned_to)) {
        console.warn('Invalid UUID format for assigned_to filter:', filters.assigned_to);
        
        // Try to fetch a valid user ID instead (if in dev mode)
        if (process.env.NODE_ENV === 'development') {
          const { data: validUsers } = await supabase
            .from('users')
            .select('id')
            .limit(1);
            
          if (validUsers && validUsers.length > 0) {
            console.log('Using valid user ID instead:', validUsers[0].id);
            filters.assigned_to = validUsers[0].id;
          } else {
            delete filters.assigned_to;
          }
        } else {
          delete filters.assigned_to;
        }
      }
    }
    
    // Start query building for persons table with lead flag
    let query = supabase
      .from('persons')
      .select(`
        *,
        lead_extensions (*)
      `, { count: 'exact' })
      .eq('is_lead', true);
    
    // Apply additional filters
    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    
    // Apply search filter if provided
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`);
    }
    
    // Execute the query with range
    const { data, error, count } = await query.range(from, to);
    
    if (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
    
    console.log('Leads fetched successfully:', data?.length || 0);
    
    // If no leads were found but we were filtering by assigned_to,
    // try without that filter as a fallback
    if ((!data || data.length === 0) && filters.assigned_to && process.env.NODE_ENV === 'development') {
      console.log('No leads found for assigned user, trying without filter');
      
      // Try again without the assigned_to filter
      const generalQuery = supabase
        .from('persons')
        .select(`
          *,
          lead_extensions (*)
        `, { count: 'exact' })
        .eq('is_lead', true)
        .range(from, to);
        
      const { data: generalData, error: generalError, count: generalCount } = await generalQuery;
      
      if (!generalError && generalData && generalData.length > 0) {
        console.log('Found leads without user filter:', generalData.length);
        
        // Process these leads just like the original query
        const processedData = generalData.map(person => {
          if (!person.lead_extensions || person.lead_extensions.length === 0) {
            person.lead_extensions = [{
              lead_status: 'New',
              created_at: person.created_at
            }];
          }
          return person;
        });
        
        return {
          data: processedData,
          pagination: {
            total: generalCount || processedData.length,
            page,
            limit,
            totalPages: Math.ceil((generalCount || processedData.length) / limit)
          }
        };
      }
    }
    
    // Process data to ensure consistent format
    const processedData = data?.map(person => {
      // Ensure lead_extensions is always an array
      if (!person.lead_extensions || person.lead_extensions.length === 0) {
        person.lead_extensions = [{
          lead_status: 'New',
          created_at: person.created_at
        }];
      }
      return person;
    }) || [];
    
    // Return formatted result with pagination info
    return {
      data: processedData,
      pagination: {
        total: count || processedData.length,
        page,
        limit,
        totalPages: Math.ceil((count || processedData.length) / limit)
      }
    };
  } catch (error) {
    console.error('Error in fetchLeadsData:', error);
    
    // Handle constraint errors
    const constraintError = handleConstraintError(error);
    if (constraintError) {
      console.error('Database constraint error:', constraintError);
    }
    
    throw error;
  }
};

/**
 * Fetch relationship data for referral network visualization
 * @param {string} personId - ID of the person to fetch network for
 * @param {number} levels - Number of relationship levels to fetch (default: 2)
 * @returns {Promise<Object>} - Network data including nodes and connections
 */
export const fetchReferralNetwork = async (personId, levels = 2) => {
  try {
    if (!personId) {
      throw new Error('Person ID is required');
    }
    
    // First get the direct relationships
    const { data: directRelationships, error: directError } = await supabase
      .from('relationships')
      .select(`
        id,
        person_a_id,
        person_b_id,
        relationship_type,
        direction,
        referral_date,
        is_primary_referrer,
        relationship_level
      `)
      .or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`)
      .eq('relationship_type', 'referral');
    
    if (directError) {
      console.error('Error fetching direct relationships:', directError);
      throw directError;
    }
    
    // Collect all unique person IDs from relationships
    const relatedPersonIds = new Set();
    directRelationships.forEach(rel => {
      if (rel.person_a_id !== personId) relatedPersonIds.add(rel.person_a_id);
      if (rel.person_b_id !== personId) relatedPersonIds.add(rel.person_b_id);
    });
    
    // If we need additional levels, fetch extended network
    let extendedRelationships = [];
    if (levels > 1 && relatedPersonIds.size > 0) {
      const idList = Array.from(relatedPersonIds);
      const { data: extended, error: extendedError } = await supabase
        .from('relationships')
        .select(`
          id,
          person_a_id,
          person_b_id,
          relationship_type,
          direction,
          referral_date,
          is_primary_referrer,
          relationship_level
        `)
        .in('person_a_id', idList)
        .eq('relationship_type', 'referral')
        .not('person_b_id', 'eq', personId);
      
      if (extendedError) {
        console.error('Error fetching extended relationships:', extendedError);
      } else {
        extendedRelationships = extended;
        
        // Add additional person IDs
        extended.forEach(rel => {
          if (!relatedPersonIds.has(rel.person_a_id)) relatedPersonIds.add(rel.person_a_id);
          if (!relatedPersonIds.has(rel.person_b_id)) relatedPersonIds.add(rel.person_b_id);
        });
      }
    }
    
    // Fetch details for all persons in the network
    const allRelationships = [...directRelationships, ...extendedRelationships];
    const allPersonIds = Array.from(relatedPersonIds);
    allPersonIds.push(personId); // Add the original person
    
    const { data: persons, error: personsError } = await supabase
      .from('persons')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        is_lead,
        is_referral,
        is_member,
        acquisition_date,
        referral_source
      `)
      .in('id', allPersonIds);
    
    if (personsError) {
      console.error('Error fetching person details:', personsError);
      throw personsError;
    }
    
    // Format data for visualization
    return {
      rootId: personId,
      nodes: persons.map(person => ({
        id: person.id,
        name: `${person.first_name} ${person.last_name}`,
        email: person.email,
        phone: person.phone,
        type: person.is_member ? 'member' : (person.is_lead ? 'lead' : 'referral'),
        acquisitionDate: person.acquisition_date
      })),
      connections: allRelationships.map(rel => ({
        id: rel.id,
        source: rel.direction === 'a_to_b' || rel.direction === 'bidirectional' ? rel.person_a_id : rel.person_b_id,
        target: rel.direction === 'a_to_b' || rel.direction === 'bidirectional' ? rel.person_b_id : rel.person_a_id,
        date: rel.referral_date,
        isPrimary: rel.is_primary_referrer,
        level: rel.relationship_level
      }))
    };
  } catch (err) {
    console.error('Error in fetchReferralNetwork:', err);
    throw err;
  }
};

/**
 * Utility functions for common Supabase operations
 */

/**
 * Fetch data from a Supabase table with optional filters
 * @param {string} table - Table name
 * @param {Object} options - Query options
 * @param {Object} options.filters - Query filters
 * @param {string[]} options.columns - Columns to select
 * @param {Object} options.pagination - Pagination options
 * @returns {Promise} Query result
 */
export const fetchData = async (table, options = {}) => {
  try {
    const { 
      columns = '*', 
      filters = {}, 
      page = 1, 
      limit = 20,
      relationships = {} 
    } = options;
    
    // Convert 1-based page to 0-based for range calculation
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Validate table name to prevent SQL injection
    const validTables = ['persons', 'interactions', 'lead_extensions', 'relationships', 'messages', 'users'];
    if (!validTables.includes(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    
    // Build column selection with relationships
    let columnSelection = columns;
    if (relationships && Object.keys(relationships).length > 0) {
      columnSelection = `${columns === '*' ? '*' : columns},`;
      Object.entries(relationships).forEach(([relation, fields]) => {
        columnSelection += `${relation}(${fields}),`;
      });
      columnSelection = columnSelection.slice(0, -1); // Remove trailing comma
    }
    
    // Start query building
    let query = supabase
      .from(table)
      .select(columnSelection, { count: 'exact' });
    
    // Apply filters with proper UUID validation
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // If this is likely a UUID field, validate it
        if (key.endsWith('_id') && typeof value === 'string') {
          if (isValidUuid(value)) {
            query = query.eq(key, value);
          } else {
            console.warn(`Invalid UUID for ${key}:`, value);
            // Don't apply this filter
          }
        } else {
          query = query.eq(key, value);
        }
      }
    });
    
    // Add pagination
    query = query.range(from, to);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error(`Error fetching from ${table}:`, error);
      const constraintError = handleConstraintError(error);
      if (constraintError) {
        console.error('Database constraint error:', constraintError);
      }
      throw error;
    }
    
    // Process data according to table schema
    const processedData = data?.map(item => {
      return processRecord(item, tableSchemas[table] || {});
    });
    
    return {
      data: processedData || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error(`Error in fetchData for ${table}:`, error);
    throw error;
  }
};

/**
 * Insert a record into a Supabase table
 * @param {string} table - Table name
 * @param {Object} record - Record to insert
 * @returns {Promise} Insert result
 */
export const insertRecord = async (table, record) => {
  try {
    // Validate record against schema constraints
    validateOrThrow(table, record);
    
    // Process record data according to table schema
    const processedRecord = processRecord(record, tableSchemas[table] || {});
    
    // Insert the record
    const { data, error } = await supabase
      .from(table)
      .insert(processedRecord)
      .select();
    
    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      const constraintError = handleConstraintError(error);
      if (constraintError) {
        console.error('Database constraint error:', constraintError);
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error in insertRecord for ${table}:`, error);
    throw error;
  }
};

/**
 * Update a record in a Supabase table
 * @param {string} table - Table name
 * @param {Object} record - Record with updated fields
 * @param {string} id - ID of the record to update
 * @returns {Promise} Update result
 */
export const updateRecord = async (table, record, id) => {
  try {
    // Verify ID is a valid UUID
    if (!isValidUuid(id)) {
      throw new Error(`Invalid UUID for record ID: ${id}`);
    }
    
    // Validate record against schema constraints
    validateOrThrow(table, record);
    
    // Process record data according to table schema
    const processedRecord = processRecord(record, tableSchemas[table] || {});
    
    // Update the record
    const { data, error } = await supabase
      .from(table)
      .update(processedRecord)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error(`Error updating ${table}:`, error);
      const constraintError = handleConstraintError(error);
      if (constraintError) {
        console.error('Database constraint error:', constraintError);
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error in updateRecord for ${table}:`, error);
    throw error;
  }
};

/**
 * Delete a record from a Supabase table
 * @param {string} table - Table name
 * @param {string} id - ID of the record to delete
 * @returns {Promise<boolean>} True if successful
 */
export const deleteRecord = async (table, id) => {
  try {
    // Verify ID is a valid UUID
    if (!isValidUuid(id)) {
      throw new Error(`Invalid UUID for record ID: ${id}`);
    }
    
    // Delete the record
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      const constraintError = handleConstraintError(error);
      if (constraintError) {
        console.error('Database constraint error:', constraintError);
      }
      throw error;
    }
    
    return { success: true, id };
  } catch (error) {
    console.error(`Error in deleteRecord for ${table}:`, error);
    throw error;
  }
};

/**
 * Run a simple custom query
 * @param {Function} queryFn - Function that takes supabase client and runs a query
 * @returns {Promise} Query result
 */
export const runQuery = async (queryFn) => {
  try {
    return await queryFn(supabase);
  } catch (error) {
    console.error('Error running custom query:', error);
    throw error;
  }
}; 