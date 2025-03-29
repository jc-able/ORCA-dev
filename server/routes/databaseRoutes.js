/**
 * Database Management Routes
 * Provides endpoints for database backup, restore, and management
 * These routes should only be accessible to administrators
 */

const express = require('express');
const router = express.Router();
const { performFullBackup, restoreFromBackup, listBackups, exportSupabaseDatabase } = require('../utils/databaseBackup');
const authMiddleware = require('../middleware/authMiddleware');

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

// Apply authentication middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

/**
 * @route   GET /api/database/backups
 * @desc    List all available backups
 * @access  Admin only
 */
router.get('/backups', async (req, res) => {
  try {
    const backups = listBackups();
    res.json({ success: true, backups });
  } catch (error) {
    console.error('Failed to list backups:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to list backups', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/database/backup
 * @desc    Perform a manual backup
 * @access  Admin only
 */
router.post('/backup', async (req, res) => {
  try {
    const backupPath = await performFullBackup();
    res.json({ 
      success: true, 
      message: 'Backup created successfully', 
      backupPath 
    });
  } catch (error) {
    console.error('Backup failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Backup failed', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/database/restore/:filename
 * @desc    Restore database from a backup
 * @access  Admin only
 */
router.post('/restore/:filename', async (req, res) => {
  try {
    const backups = listBackups();
    const backup = backups.find(b => b.filename === req.params.filename);
    
    if (!backup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Backup not found' 
      });
    }
    
    // Require confirmation in request body
    if (!req.body.confirm || req.body.confirm !== true) {
      return res.status(400).json({ 
        success: false, 
        message: 'Confirmation required. Set confirm:true in request body.' 
      });
    }
    
    await restoreFromBackup(backup.path);
    
    res.json({ 
      success: true, 
      message: 'Database restored successfully' 
    });
  } catch (error) {
    console.error('Restore failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Restore failed', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/database/export
 * @desc    Export database using Supabase CLI (requires CLI to be installed)
 * @access  Admin only
 */
router.post('/export', async (req, res) => {
  try {
    const exportPath = await exportSupabaseDatabase();
    res.json({ 
      success: true, 
      message: 'Database exported successfully', 
      exportPath 
    });
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Export failed. Make sure Supabase CLI is installed.', 
      error: error.message 
    });
  }
});

/**
 * @route   DELETE /api/database/backups/:filename
 * @desc    Delete a specific backup
 * @access  Admin only
 */
router.delete('/backups/:filename', async (req, res) => {
  try {
    const backups = listBackups();
    const backup = backups.find(b => b.filename === req.params.filename);
    
    if (!backup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Backup not found' 
      });
    }
    
    const fs = require('fs');
    fs.unlinkSync(backup.path);
    
    res.json({ 
      success: true, 
      message: 'Backup deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete backup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete backup', 
      error: error.message 
    });
  }
});

module.exports = router; 