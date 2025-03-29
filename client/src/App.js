import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, Snackbar, Alert } from '@mui/material';

// Contexts
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import LeadManagement from './pages/LeadManagement';
import LeadDetails from './pages/LeadDetails';
import ReferralSystem from './pages/ReferralSystem';
import ReferralHandler from './pages/ReferralHandler';
import CommunicationCenter from './pages/CommunicationCenter';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Components
import Layout from './components/ui/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Styles and Theme
import theme from './styles/theme';
import { checkConnection } from './services/supabaseClient';
import { dbConfig } from './utils/envHelper';

// Dark theme configuration
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00BFFF', // Aqua Blue
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    success: {
      main: '#4CAF50', // Green for referrals
    }
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

// Function to check environment variables
const checkEnvironmentVariables = () => {
  // Only log this information during development or if debug mode is enabled
  const isDebugMode = process.env.REACT_APP_DEBUG_MODE === 'true';
  
  if (process.env.NODE_ENV !== 'production' || isDebugMode) {
    console.log('=== Environment Check ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('App Version:', process.env.REACT_APP_VERSION || 'Not set');
    console.log('Supabase URL set:', !!process.env.REACT_APP_SUPABASE_URL);
    console.log('Supabase Key set:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
    console.log('API URL:', process.env.REACT_APP_API_URL || 'Using default');
    console.log('========================');
  }
  
  // Check for critical environment variables in production
  if (process.env.NODE_ENV === 'production') {
    const missingVars = [];
    
    if (!process.env.REACT_APP_SUPABASE_URL) {
      missingVars.push('REACT_APP_SUPABASE_URL');
    }
    
    if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
      missingVars.push('REACT_APP_SUPABASE_ANON_KEY');
    }
    
    if (missingVars.length > 0) {
      console.error('Missing critical environment variables:', missingVars.join(', '));
      
      // In production, log the object keys to help with debugging
      console.log('Available environment variable keys:', 
        Object.keys(process.env)
          .filter(key => key.startsWith('REACT_APP_'))
          .map(key => key)
      );
    }
  }
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [dbConnected, setDbConnected] = useState(true); // Optimistic initial state
  const [showConnectionError, setShowConnectionError] = useState(false);

  // Initialize app
  useEffect(() => {
    // Any initialization logic here
    setIsInitialized(true);
  }, []);

  // Run environment check on first render
  useEffect(() => {
    checkEnvironmentVariables();
    checkConnection().then(connected => {
      if (!connected) {
        console.error('Failed to connect to Supabase. Check your environment variables and network connection.');
      }
    });
  }, []);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Main Layout with Sidebar */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="leads" element={<LeadManagement />} />
                <Route path="leads/:id" element={<LeadDetails />} />
                <Route path="referrals" element={<ReferralSystem />} />
                <Route path="communication" element={<CommunicationCenter />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              
              {/* Standalone Protected Pages */}
              <Route path="/r/:referralId" element={<ReferralHandler />} />
              <Route path="/404" element={<NotFound />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
        
        {/* Database connection error notification */}
        <Snackbar
          open={showConnectionError}
          autoHideDuration={10000}
          onClose={() => setShowConnectionError(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity="error" 
            variant="filled"
            onClose={() => setShowConnectionError(false)}
          >
            Database connection failed. Using mock data instead.
          </Alert>
        </Snackbar>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 