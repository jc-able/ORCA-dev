/**
 * Database Backup Utility for ORCA Lead Management
 * 
 * This module handles automated database backups for the Supabase database.
 * It provides functions to schedule and manage backups, and to restore from backups if needed.
 * 
 * Supabase already provides automatic daily backups for paid plans, but this utility
 * allows for additional customization, scheduling, and backup management.
 */

const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cron = require('node-cron');
const dotenv = require('dotenv');

dotenv.config();

// Configuration for backups
const config = {
  backupDir: process.env.BACKUP_DIR || path.join(__dirname, '../../backups'),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY, // Use service key with more privileges
  backupSchedule: process.env.BACKUP_SCHEDULE || '0 1 * * *', // Default: 1:00 AM daily
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10), // Default: keep backups for 30 days
  backupTables: process.env.BACKUP_TABLES ? process.env.BACKUP_TABLES.split(',') : [
    'users',
    'persons',
    'lead_extensions',
    'referral_extensions',
    'member_extensions',
    'relationships',
    'interactions',
    'messages'
  ]
};

/**
 * Ensures the backup directory exists
 */
const ensureBackupDir = () => {
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
    console.log(`Created backup directory: ${config.backupDir}`);
  }
};

/**
 * Generate a filename for the backup with timestamp
 * @returns {string} Backup filename
 */
const getBackupFilename = () => {
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, '-');
  return `orca_backup_${timestamp}.json`;
};

/**
 * Performs a full database backup
 * @returns {Promise<string>} Path to the backup file
 */
const performFullBackup = async () => {
  ensureBackupDir();
  const backupFilename = getBackupFilename();
  const backupPath = path.join(config.backupDir, backupFilename);
  
  try {
    // Create an object to store all table data
    const backupData = {
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        tables: config.backupTables
      },
      tables: {}
    };
    
    // Backup each table
    for (const table of config.backupTables) {
      console.log(`Backing up table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) {
        throw new Error(`Error backing up table ${table}: ${error.message}`);
      }
      
      backupData.tables[table] = data;
      console.log(`Backed up ${data.length} rows from ${table}`);
    }
    
    // Write backup to file
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`Backup saved to ${backupPath}`);
    
    // Clean up old backups
    cleanupOldBackups();
    
    return backupPath;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
};

/**
 * Deletes backup files older than the retention period
 */
const cleanupOldBackups = () => {
  try {
    const files = fs.readdirSync(config.backupDir);
    const now = new Date();
    
    files.forEach(file => {
      if (!file.startsWith('orca_backup_')) return;
      
      const filePath = path.join(config.backupDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // Age in days
      
      if (fileAge > config.retentionDays) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old backup: ${file} (${Math.round(fileAge)} days old)`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
};

/**
 * Restores the database from a backup file
 * CAUTION: This will overwrite existing data
 * @param {string} backupFilePath - Path to the backup file
 * @returns {Promise<boolean>} Success status
 */
const restoreFromBackup = async (backupFilePath) => {
  try {
    console.log(`Restoring from backup: ${backupFilePath}`);
    
    // Read the backup file
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    // Verify backup format
    if (!backupData.metadata || !backupData.tables) {
      throw new Error('Invalid backup format');
    }
    
    // Process each table in reverse order to handle dependencies correctly
    // This is a simplified approach; a more robust solution would analyze and sort by dependencies
    const tables = Object.keys(backupData.tables).reverse();
    
    for (const table of tables) {
      const tableData = backupData.tables[table];
      
      if (!tableData || !Array.isArray(tableData)) {
        console.warn(`Skipping table ${table}: Invalid data format`);
        continue;
      }
      
      console.log(`Restoring table ${table} (${tableData.length} rows)`);
      
      // Clear existing data
      // CAUTION: This will delete all data in the table
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .not('id', 'is', null); // A safer way to delete all rows
      
      if (deleteError) {
        throw new Error(`Error clearing table ${table}: ${deleteError.message}`);
      }
      
      // Skip empty tables
      if (tableData.length === 0) continue;
      
      // Insert data in batches to avoid limitations
      const BATCH_SIZE = 500;
      
      for (let i = 0; i < tableData.length; i += BATCH_SIZE) {
        const batch = tableData.slice(i, i + BATCH_SIZE);
        
        const { error: insertError } = await supabase
          .from(table)
          .insert(batch);
        
        if (insertError) {
          throw new Error(`Error restoring table ${table}: ${insertError.message}`);
        }
        
        console.log(`Restored ${batch.length} rows to ${table}`);
      }
    }
    
    console.log('Restore completed successfully');
    return true;
  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
};

/**
 * Lists available backup files
 * @returns {Array<Object>} List of backup files with metadata
 */
const listBackups = () => {
  ensureBackupDir();
  
  try {
    const files = fs.readdirSync(config.backupDir)
      .filter(file => file.startsWith('orca_backup_') && file.endsWith('.json'));
    
    return files.map(file => {
      const filePath = path.join(config.backupDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        filename: file,
        path: filePath,
        size: stats.size,
        created: stats.mtime,
        age: Math.round((new Date() - stats.mtime) / (1000 * 60 * 60 * 24)) // Age in days
      };
    }).sort((a, b) => b.created - a.created); // Sort by date, newest first
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
  }
};

/**
 * Exports a Supabase Database using their CLI tools
 * Note: This requires the Supabase CLI to be installed and properly authenticated
 * @returns {Promise<string>} Path to the exported file
 */
const exportSupabaseDatabase = () => {
  ensureBackupDir();
  const backupFilename = `orca_supabase_export_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
  const backupPath = path.join(config.backupDir, backupFilename);
  
  return new Promise((resolve, reject) => {
    // This requires supabase CLI to be installed
    // https://supabase.com/docs/guides/cli/local-development#database-migrations
    const command = `supabase db dump -f ${backupPath}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Supabase export error: ${error.message}`);
        return reject(error);
      }
      
      console.log(`Supabase database exported to ${backupPath}`);
      return resolve(backupPath);
    });
  });
};

/**
 * Schedules automatic backups based on configuration
 */
const scheduleAutomaticBackups = () => {
  console.log(`Scheduling automatic backups: ${config.backupSchedule}`);
  
  cron.schedule(config.backupSchedule, async () => {
    console.log('Running scheduled backup...');
    try {
      const backupPath = await performFullBackup();
      console.log(`Scheduled backup completed: ${backupPath}`);
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  });
};

// Export functions for use in the application
module.exports = {
  performFullBackup,
  restoreFromBackup,
  listBackups,
  exportSupabaseDatabase,
  scheduleAutomaticBackups
}; 