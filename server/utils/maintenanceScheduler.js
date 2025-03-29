/**
 * Maintenance Window Scheduler for ORCA Lead Management
 * 
 * This module handles scheduling and managing maintenance windows for system updates.
 * It provides functionality to:
 * - Schedule recurring maintenance windows
 * - Trigger ad-hoc maintenance windows
 * - Display maintenance notifications to users
 * - Track maintenance history
 */

const cron = require('node-cron');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Configuration for maintenance windows
const config = {
  // Default: Every Sunday at 3:00 AM
  maintenanceSchedule: process.env.MAINTENANCE_SCHEDULE || '0 3 * * 0',
  // Default: 2 hours
  maintenanceDuration: parseInt(process.env.MAINTENANCE_DURATION_MINUTES || '120', 10),
  // Directory to store maintenance logs
  maintenanceLogsDir: process.env.MAINTENANCE_LOGS_DIR || path.join(__dirname, '../../maintenance-logs'),
  // Flag to determine if we're currently in maintenance mode
  maintenanceMode: false,
  // Flag to determine if we should actually put the system in maintenance mode or just simulate
  dryRun: process.env.MAINTENANCE_DRY_RUN === 'true' || false,
  // Custom message to display during maintenance
  customMessage: process.env.MAINTENANCE_MESSAGE || 'The system is currently undergoing scheduled maintenance. Please try again later.'
};

/**
 * Ensures the maintenance logs directory exists
 */
const ensureMaintenanceLogsDir = () => {
  if (!fs.existsSync(config.maintenanceLogsDir)) {
    fs.mkdirSync(config.maintenanceLogsDir, { recursive: true });
    console.log(`Created maintenance logs directory: ${config.maintenanceLogsDir}`);
  }
};

/**
 * Generate a filename for the maintenance log with timestamp
 * @returns {string} Log filename
 */
const getLogFilename = () => {
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, '-');
  return `maintenance_${timestamp}.json`;
};

/**
 * Log maintenance activity
 * @param {string} action - The maintenance action (start, end, scheduled, etc.)
 * @param {string} description - Description of the maintenance
 * @param {Object} details - Additional details about the maintenance
 * @returns {Promise<string>} Path to the log file
 */
const logMaintenance = async (action, description, details = {}) => {
  ensureMaintenanceLogsDir();
  const logFilename = getLogFilename();
  const logPath = path.join(config.maintenanceLogsDir, logFilename);
  
  const logData = {
    action,
    description,
    timestamp: new Date().toISOString(),
    details,
    dryRun: config.dryRun
  };
  
  fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
  console.log(`Maintenance logged to ${logPath}`);
  
  return logPath;
};

/**
 * Start the maintenance mode
 * @param {string} reason - Reason for the maintenance
 * @param {number} duration - Duration in minutes
 * @param {boolean} scheduled - Whether this is a scheduled maintenance
 * @returns {Promise<Object>} Maintenance status
 */
const startMaintenance = async (reason, duration = config.maintenanceDuration, scheduled = false) => {
  if (config.maintenanceMode) {
    console.log('Maintenance mode is already active');
    return { 
      status: 'already_active', 
      message: 'Maintenance mode is already active',
      dryRun: config.dryRun
    };
  }
  
  // Log maintenance start
  await logMaintenance(
    'start', 
    reason, 
    { 
      duration, 
      scheduled,
      startTime: new Date().toISOString(),
      expectedEndTime: new Date(Date.now() + duration * 60000).toISOString()
    }
  );
  
  if (!config.dryRun) {
    config.maintenanceMode = true;
    
    // Set a timer to automatically end maintenance
    setTimeout(() => {
      endMaintenance(`Automatic completion of maintenance: ${reason}`);
    }, duration * 60000);
  }
  
  console.log(`Maintenance mode ${config.dryRun ? '(DRY RUN) ' : ''}started: ${reason}`);
  return { 
    status: 'started', 
    message: `Maintenance mode ${config.dryRun ? '(DRY RUN) ' : ''}started: ${reason}`,
    dryRun: config.dryRun,
    endsAt: new Date(Date.now() + duration * 60000).toISOString()
  };
};

/**
 * End the maintenance mode
 * @param {string} reason - Reason for ending maintenance
 * @returns {Promise<Object>} Maintenance status
 */
const endMaintenance = async (reason) => {
  if (!config.maintenanceMode && !config.dryRun) {
    console.log('Maintenance mode is not active');
    return { 
      status: 'not_active', 
      message: 'Maintenance mode is not active',
      dryRun: config.dryRun
    };
  }
  
  // Log maintenance end
  await logMaintenance('end', reason);
  
  if (!config.dryRun) {
    config.maintenanceMode = false;
  }
  
  console.log(`Maintenance mode ${config.dryRun ? '(DRY RUN) ' : ''}ended: ${reason}`);
  return { 
    status: 'ended', 
    message: `Maintenance mode ${config.dryRun ? '(DRY RUN) ' : ''}ended: ${reason}`,
    dryRun: config.dryRun
  };
};

/**
 * Check if the system is currently in maintenance mode
 * @returns {Object} Maintenance status
 */
const getMaintenanceStatus = () => {
  return {
    inMaintenance: config.maintenanceMode,
    message: config.maintenanceMode ? config.customMessage : null,
    dryRun: config.dryRun
  };
};

/**
 * Get maintenance history
 * @param {number} limit - Maximum number of logs to return
 * @returns {Array} Maintenance history logs
 */
const getMaintenanceHistory = (limit = 10) => {
  ensureMaintenanceLogsDir();
  
  try {
    const files = fs.readdirSync(config.maintenanceLogsDir)
      .filter(file => file.startsWith('maintenance_') && file.endsWith('.json'));
    
    // Sort by date, newest first
    files.sort((a, b) => {
      const aTime = fs.statSync(path.join(config.maintenanceLogsDir, a)).mtime.getTime();
      const bTime = fs.statSync(path.join(config.maintenanceLogsDir, b)).mtime.getTime();
      return bTime - aTime;
    });
    
    // Get the latest logs
    const latestFiles = files.slice(0, limit);
    
    // Parse and return the logs
    return latestFiles.map(file => {
      try {
        const logPath = path.join(config.maintenanceLogsDir, file);
        const logContent = fs.readFileSync(logPath, 'utf8');
        return JSON.parse(logContent);
      } catch (err) {
        console.error(`Error reading log file ${file}:`, err);
        return { error: `Error reading log file ${file}` };
      }
    });
  } catch (error) {
    console.error('Error getting maintenance history:', error);
    return [];
  }
};

/**
 * Schedule recurring maintenance windows
 */
const scheduleRecurringMaintenance = () => {
  console.log(`Scheduling recurring maintenance: ${config.maintenanceSchedule}`);
  
  cron.schedule(config.maintenanceSchedule, async () => {
    console.log('Running scheduled maintenance...');
    try {
      await startMaintenance(
        `Scheduled system maintenance (${new Date().toISOString()})`, 
        config.maintenanceDuration, 
        true
      );
    } catch (error) {
      console.error('Scheduled maintenance failed:', error);
    }
  });
};

/**
 * Express middleware to check if the system is in maintenance mode
 * and respond accordingly
 */
const maintenanceMiddleware = (req, res, next) => {
  // Skip maintenance check for maintenance API endpoints
  if (req.path.startsWith('/api/maintenance')) {
    return next();
  }
  
  // Check if we're in maintenance mode
  if (config.maintenanceMode && !config.dryRun) {
    return res.status(503).json({
      status: 'maintenance',
      message: config.customMessage,
      retry_after: config.maintenanceDuration * 60 // in seconds
    });
  }
  
  next();
};

// Export functions for use in the application
module.exports = {
  startMaintenance,
  endMaintenance,
  getMaintenanceStatus,
  getMaintenanceHistory,
  scheduleRecurringMaintenance,
  maintenanceMiddleware
}; 