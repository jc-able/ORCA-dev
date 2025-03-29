/**
 * Auth Controller
 * Handles user authentication and profile operations
 */
const userModel = require('../models/userModel');
const supabase = require('../config/supabase');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.register = async (req, res, next) => {
  try {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone, 
      role = 'salesperson' 
    } = req.body;
    
    // Create auth user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      return res.status(400).json({
        status: 'error',
        message: authError.message
      });
    }
    
    // Create user in our users table with additional details
    const userData = {
      id: authData.user.id, // Use same ID as auth
      email,
      first_name,
      last_name,
      phone,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const newUser = await userModel.createUser(userData);
    
    // Don't return the password
    delete userData.password;
    
    // Return the user data and token
    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
        session: authData.session
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Get user details from our users table
    const user = await userModel.getUserById(authData.user.id);
    
    if (!user) {
      // This should not happen, but just in case
      return res.status(404).json({
        status: 'error',
        message: 'User record not found'
      });
    }
    
    // Update last login timestamp
    await userModel.updateLastLogin(user.id);
    
    // Return the user data and token
    res.status(200).json({
      status: 'success',
      data: {
        user,
        session: authData.session
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.logout = async (req, res, next) => {
  try {
    // Log out with Supabase Auth
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object (with user object from authMiddleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // req.user should be set by authMiddleware
    const user = await userModel.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object (with user object from authMiddleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, settings } = req.body;
    
    // Only allow certain fields to be updated
    const updatedData = {
      first_name,
      last_name,
      phone,
      settings,
      updated_at: new Date().toISOString()
    };
    
    // Remove undefined fields
    Object.keys(updatedData).forEach(key => 
      updatedData[key] === undefined && delete updatedData[key]
    );
    
    // Update the user
    const updatedUser = await userModel.updateUser(req.user.id, updatedData);
    
    res.status(200).json({
      status: 'success',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password - send reset link via email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Send reset password email
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update password (after reset)
 * @param {Object} req - Express request object (with user object from authMiddleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    // Update password with Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password
    });
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    
    // Update the updated_at field in our users table
    await userModel.updateUser(req.user.id, {
      updated_at: new Date().toISOString()
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
}; 