import React from 'react';
import { Box, CircularProgress, Typography, Button, Paper } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * Component to display loading or error states for the leads page
 * Handles showing a loading spinner, error messages, or empty state message
 */
function LeadLoadingState({ loading, error, onRetry, isEmpty }) {
  // Loading state with spinner
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '200px',
          width: '100%'
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography color="textSecondary">Loading leads...</Typography>
      </Box>
    );
  }
  
  // Error state with retry button
  if (error) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          background: 'rgba(255, 0, 0, 0.05)', 
          border: '1px solid rgba(255, 0, 0, 0.1)',
          width: '100%',
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" color="error" gutterBottom>
          Error Loading Leads
        </Typography>
        <Typography color="textSecondary" paragraph>
          {error}
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          color="primary" 
          onClick={onRetry}
        >
          Try Again
        </Button>
      </Paper>
    );
  }
  
  // Empty state
  if (isEmpty) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 4,
          width: '100%',
          color: 'info.main',
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" color="primary" gutterBottom>
          No leads found.
        </Typography>
        <Typography color="textSecondary" paragraph>
          Add your first lead to get started.
        </Typography>
      </Box>
    );
  }
  
  // Return null if not loading, no error, and not empty
  return null;
}

export default LeadLoadingState; 