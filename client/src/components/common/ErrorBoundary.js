import React, { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import ErrorHandler from '../../services/errorHandler';

/**
 * Error Boundary component
 * 
 * Catches JavaScript errors in its child component tree and displays a fallback UI
 * instead of crashing the entire application.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our monitoring service
    ErrorHandler.logErrorToMonitoring(error, {
      componentStack: errorInfo.componentStack,
      component: this.props.componentName || 'unknown',
      ...this.props.errorContext
    });
    
    this.setState({
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call the onReset prop if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    const { hasError } = this.state;
    const { 
      fallback, 
      children,
      showDetails = process.env.NODE_ENV === 'development'
    } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(this.state.error, this.handleReset)
          : fallback;
      }

      // Default fallback UI
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            m: 2, 
            borderRadius: 2,
            backgroundColor: 'error.light', 
            color: 'error.contrastText',
            maxWidth: '100%',
            overflow: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ErrorIcon fontSize="large" sx={{ mr: 2 }} />
            <Typography variant="h5" component="h2">
              Something went wrong
            </Typography>
          </Box>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            {this.props.message || "We've encountered an error. Please try again or contact support if the problem persists."}
          </Typography>
          
          {showDetails && this.state.error && (
            <Box 
              sx={{ 
                p: 2, 
                my: 2, 
                backgroundColor: 'rgba(0,0,0,0.1)', 
                borderRadius: 1,
                maxHeight: '200px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Error Details:
              </Typography>
              <pre>{this.state.error.toString()}</pre>
              {this.state.errorInfo && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Component Stack:
                  </Typography>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </>
              )}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </Box>
        </Paper>
      );
    }

    // When there's no error, render children normally
    return children;
  }
}

export default ErrorBoundary; 