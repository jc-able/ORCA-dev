import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { SentimentDissatisfied as SentimentDissatisfiedIcon } from '@mui/icons-material';

/**
 * NotFound page component
 * Displayed when a user navigates to a non-existent route
 */
function NotFound() {
  return (
    <Container component="main" maxWidth="sm">
      <Paper 
        elevation={0}
        sx={{ 
          mt: 8, 
          p: 6, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <SentimentDissatisfiedIcon color="primary" sx={{ fontSize: 80, mb: 2 }} />
        
        <Typography variant="h4" component="h1" gutterBottom>
          404 - Page Not Found
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/"
            size="large"
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default NotFound; 