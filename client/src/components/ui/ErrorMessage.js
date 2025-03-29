import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';

/**
 * ErrorMessage Component
 * Display error messages in a consistent way across the application
 * 
 * @param {Object} props - Component props
 * @param {String} props.message - Error message to display
 * @param {String} props.title - Optional error title
 * @param {String} props.severity - Error severity (error, warning, info, success)
 * @param {Boolean} props.fullWidth - Whether to display at full width
 * @returns {JSX.Element} Error message component
 */
const ErrorMessage = ({ 
  message, 
  title = 'Error', 
  severity = 'error',
  fullWidth = false
}) => {
  return (
    <Box 
      sx={{ 
        width: fullWidth ? '100%' : 'auto', 
        my: 2
      }}
    >
      <Alert severity={severity}>
        {title && (
          <Typography variant="subtitle2" component="div" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
        )}
        <Typography variant="body2">
          {message}
        </Typography>
      </Alert>
    </Box>
  );
};

export default ErrorMessage; 