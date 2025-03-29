/**
 * Maintenance Routes
 * Provides endpoints for managing system maintenance windows
 * These routes should only be accessible to administrators
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  startMaintenance, 
  endMaintenance, 
  getMaintenanceStatus, 
  getMaintenanceHistory 
} = require('../utils/maintenanceScheduler');

// Middleware to ensure admin access only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Admin privileges required.' 
  });
};

// Public route for users to check maintenance status
router.get('/status', async (req, res) => {
  try {
    const status = getMaintenanceStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('Failed to get maintenance status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get maintenance status', 
      error: error.message 
    });
  }
});

// All admin routes require authentication
router.use(authMiddleware);
router.use(adminOnly);

/**
 * @route   GET /api/maintenance/history
 * @desc    Get maintenance history
 * @access  Admin only
 */
router.get('/history', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const history = getMaintenanceHistory(limit);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Failed to get maintenance history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get maintenance history', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/maintenance/start
 * @desc    Start a maintenance window
 * @access  Admin only
 */
router.post('/start', async (req, res) => {
  try {
    const { reason, duration, dryRun } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for maintenance is required'
      });
    }
    
    // Record the admin who started maintenance
    const adminInfo = {
      adminId: req.user.id,
      adminEmail: req.user.email,
      adminName: `${req.user.first_name} ${req.user.last_name}`
    };
    
    const result = await startMaintenance(
      reason, 
      duration || undefined,
      false, // not scheduled
      dryRun
    );
    
    res.json({ 
      success: true, 
      message: 'Maintenance window started', 
      ...result,
      initiatedBy: adminInfo
    });
  } catch (error) {
    console.error('Failed to start maintenance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start maintenance', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/maintenance/end
 * @desc    End a maintenance window
 * @access  Admin only
 */
router.post('/end', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for ending maintenance is required'
      });
    }
    
    // Record the admin who ended maintenance
    const adminInfo = {
      adminId: req.user.id,
      adminEmail: req.user.email,
      adminName: `${req.user.first_name} ${req.user.last_name}`
    };
    
    const result = await endMaintenance(reason);
    
    res.json({ 
      success: true, 
      message: 'Maintenance window ended', 
      ...result,
      terminatedBy: adminInfo
    });
  } catch (error) {
    console.error('Failed to end maintenance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to end maintenance', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/maintenance/simulate
 * @desc    Simulate a maintenance window without actually entering maintenance mode
 * @access  Admin only
 */
router.post('/simulate', async (req, res) => {
  try {
    const { reason, duration } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for simulated maintenance is required'
      });
    }
    
    // Force dry run mode
    const adminInfo = {
      adminId: req.user.id,
      adminEmail: req.user.email,
      adminName: `${req.user.first_name} ${req.user.last_name}`
    };
    
    const result = await startMaintenance(
      `[SIMULATION] ${reason}`, 
      duration || undefined,
      false, // not scheduled
      true // force dry run
    );
    
    res.json({ 
      success: true, 
      message: 'Maintenance simulation started', 
      ...result,
      simulatedBy: adminInfo
    });
  } catch (error) {
    console.error('Failed to simulate maintenance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to simulate maintenance', 
      error: error.message 
    });
  }
});

module.exports = router; 