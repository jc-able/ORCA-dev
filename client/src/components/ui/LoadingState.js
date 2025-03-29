import React from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';

/**
 * LoadingState Component
 * Displays a consistent loading indicator across the application
 * 
 * @param {Object} props - Component props
 * @param {String} props.message - Optional message to display during loading
 * @param {Boolean} props.fullPage - Whether to display as a full page overlay
 * @param {Boolean} props.contained - Whether to display inside a Paper container
 * @param {Number} props.size - Size of the CircularProgress component
 * @param {Object} props.sx - Additional styling
 * @returns {JSX.Element} Loading state component
 */
const LoadingState = ({ 
  message = 'Loading...', 
  fullPage = false, 
  contained = false,
  size = 40,
  sx = {} 
}) => {
  const content = (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        p: 3,
        ...sx
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullPage) {
    return (
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper 
          elevation={4} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            maxWidth: '80%'
          }}
        >
          {content}
        </Paper>
      </Box>
    );
  }

  if (contained) {
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          m: 2,
          borderRadius: 1
        }}
      >
        {content}
      </Paper>
    );
  }

  return content;
};

export default LoadingState; 