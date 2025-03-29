const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const supabase = require('../config/supabase');

// Load environment variables
dotenv.config();

/**
 * Middleware to protect routes by validating JWT token
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from Bearer token
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-jwt-key');
      
      // Check if user still exists in Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();
      
      if (error || !user) {
        return res.status(401).json({
          status: 'error',
          message: 'User belonging to this token no longer exists'
        });
      }
      
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Server error in auth middleware'
    });
  }
};

/**
 * Middleware to restrict routes to specific roles
 * 
 * @param  {...string} roles - Allowed roles
 * @returns {Function} - Express middleware
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
}; 