const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const personRoutes = require('./routes/personRoutes');
const leadRoutes = require('./routes/leadRoutes');
const referralRoutes = require('./routes/referralRoutes');
const messagingRoutes = require('./routes/messagingRoutes');
const memberRoutes = require('./routes/memberRoutes');
const relationshipRoutes = require('./routes/relationshipRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');

// Import utilities
const { scheduleAutomaticBackups } = require('./utils/databaseBackup');
const { maintenanceMiddleware, scheduleRecurringMaintenance } = require('./utils/maintenanceScheduler');

// Initialize Express app
const app = express();

// Set up middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Apply maintenance middleware to all routes
// This must be before any routes to intercept requests during maintenance
app.use(maintenanceMiddleware);

// Define port
const PORT = process.env.PORT || 5001;

// Check Supabase connection
const supabase = require('./config/supabase');
const checkSupabaseConnection = async () => {
  try {
    // Simple query to check if Supabase is connected
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
    return false;
  }
};

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const supabaseConnected = await checkSupabaseConnection();
  
  res.json({
    status: 'ok',
    supabaseConnected,
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Set secure headers for production
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  
  // Serve static files
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // For any route that doesn't match our API, send the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // Root route for development
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Welcome to ORCA Lead Management API',
      version: '1.0.0',
      status: 'ok'
    });
  });
}

// Custom error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
});

// Handle 404 errors for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: 'API Resource not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Check database connection on startup
  checkSupabaseConnection();
  
  // Set up automatic database backups
  if (process.env.ENABLE_AUTO_BACKUPS === 'true') {
    scheduleAutomaticBackups();
    console.log('Automatic database backups scheduled');
  }
  
  // Set up recurring maintenance windows
  if (process.env.ENABLE_SCHEDULED_MAINTENANCE === 'true') {
    scheduleRecurringMaintenance();
    console.log('Recurring maintenance windows scheduled');
  }
});

module.exports = app; // Export for testing 