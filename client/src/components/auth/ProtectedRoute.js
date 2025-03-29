import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * ProtectedRoute component ensures that only authenticated users can access certain routes
 * Redirects unauthenticated users to the login page
 * 
 * @returns {ReactNode} The protected route component with an Outlet for child routes
 */
const ProtectedRoute = () => {
  const location = useLocation();
  const { currentUser, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }
  
  // If not authenticated, redirect to login with return path
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // If authenticated, render the outlet (child routes)
  return <Outlet />;
};

export default ProtectedRoute; 