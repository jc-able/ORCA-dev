/**
 * User Model
 * Handles database interactions for users
 */
const supabase = require('../config/supabase');

/**
 * Standard fields for the users table, matching Supabase database structure
 * Used for validation and documentation purposes
 */
exports.userFields = {
  id: 'uuid', // DEFAULT extensions.uuid_generate_v4() in SQL
  email: 'text', // NOT NULL and UNIQUE constraints in SQL
  password: 'text', // NOT NULL constraint in SQL
  first_name: 'text',
  last_name: 'text',
  phone: 'text',
  role: 'text', // DEFAULT 'salesperson'::text in SQL
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp', // DEFAULT now() in SQL
  last_login: 'timestamp',
  settings: 'jsonb' // DEFAULT '{}'::jsonb in SQL
};

/**
 * Get all users with optional filtering
 * @param {Object} filters - Optional query filters
 * @param {String} filters.role - Filter by role
 * @param {String} filters.searchTerm - Search by name or email
 * @param {Object} pagination - Pagination options
 * @param {Number} pagination.page - Page number (0-indexed)
 * @param {Number} pagination.pageSize - Items per page
 * @returns {Promise<Array>} Array of user records
 */
exports.getAllUsers = async (filters = {}, pagination = { page: 0, pageSize: 10 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('users')
      .select('*')
      .range(from, to);
    
    // Apply filters
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    
    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Remove password field from results
    return data.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
};

/**
 * Get a user by ID
 * @param {UUID} id - User ID
 * @returns {Promise<Object>} User record (without password)
 */
exports.getUserById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Remove password field
    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
};

/**
 * Get a user by email
 * @param {String} email - User email
 * @returns {Promise<Object>} User record (without password)
 */
exports.getUserByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    // Remove password field
    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    throw error;
  }
};

/**
 * Create a new user (usually after Supabase Auth signup)
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user record (without password)
 */
exports.createUser = async (userData) => {
  try {
    // Validate required fields
    if (!userData.email) {
      throw new Error('Email is required');
    }
    
    if (!userData.password) {
      throw new Error('Password is required');
    }
    
    // Check for existing user with same email (UNIQUE constraint)
    const existingUser = await exports.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }
    
    // Prepare user data
    const now = new Date().toISOString();
    const newUser = {
      email: userData.email,
      password: userData.password, // Should be already hashed
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      role: userData.role || 'salesperson',
      created_at: now,
      updated_at: now,
      settings: userData.settings || {}
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();
    
    if (error) {
      // Handle specific errors
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('A user with this email already exists');
      }
      throw error;
    }
    
    // Remove password field
    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

/**
 * Update a user
 * @param {UUID} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Updated user record (without password)
 */
exports.updateUser = async (id, userData) => {
  try {
    // Check if we're updating email to ensure uniqueness
    if (userData.email) {
      const existingUser = await exports.getUserByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('A user with this email already exists');
      }
    }
    
    // Prepare update data
    const updateData = {
      ...userData,
      updated_at: new Date().toISOString()
    };
    
    // Rename firstName and lastName to match database schema
    if (updateData.firstName) {
      updateData.first_name = updateData.firstName;
      delete updateData.firstName;
    }
    
    if (updateData.lastName) {
      updateData.last_name = updateData.lastName;
      delete updateData.lastName;
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      // Handle specific errors
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('A user with this email already exists');
      }
      throw error;
    }
    
    // Remove password field
    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error in updateUser:', error);
    throw error;
  }
};

/**
 * Update user last login timestamp
 * @param {UUID} id - User ID
 * @returns {Promise<Object>} Updated user record (without password)
 */
exports.updateLastLogin = async (id) => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('users')
      .update({ last_login: now })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Remove password field
    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error in updateLastLogin:', error);
    throw error;
  }
};

/**
 * Delete a user
 * @param {UUID} id - User ID
 * @returns {Promise<Boolean>} True if successful
 */
exports.deleteUser = async (id) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    throw error;
  }
};

/**
 * Authenticate a user by email and password
 * @param {String} email - User email
 * @param {String} password - User password (already hashed)
 * @returns {Promise<Object>} User record if authentication successful
 */
exports.authenticateUser = async (email, password) => {
  try {
    // In a real application, you would typically use Supabase Auth
    // This is a simplified example for custom authentication
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password) // Password should be hashed
      .single();
    
    if (error) {
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    // Update last login timestamp
    await exports.updateLastLogin(data.id);
    
    // Remove password field
    const { password: pw, ...userWithoutPassword } = data;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error in authenticateUser:', error);
    return null;
  }
}; 