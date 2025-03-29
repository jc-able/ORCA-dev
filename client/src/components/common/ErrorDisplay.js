import React from 'react';
import { 
  Alert, 
  AlertTitle, 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Snackbar,
  Collapse
} from '@mui/material';
import { 
  ErrorOutline as ErrorIcon, 
  WarningAmber as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import ErrorHandler, { ErrorTypes } from '../../services/errorHandler';

/**
 * Determines the appropriate alert severity based on error type
 */
const getAlertSeverity = (errorType) => {
  switch (errorType) {
    case ErrorTypes.SERVER:
    case ErrorTypes.UNKNOWN:
      return 'error';
    case ErrorTypes.AUTHENTICATION:
    case ErrorTypes.AUTHORIZATION:
    case ErrorTypes.VALIDATION:
      return 'warning';
    case ErrorTypes.NETWORK:
    case ErrorTypes.TIMEOUT:
    case ErrorTypes.RATE_LIMIT:
      return 'info';
    default:
      return 'error';
  }
};

/**
 * Inline Error Display
 * For displaying errors within components
 */
export const InlineError = ({ 
  error, 
  onRetry, 
  compact = false,
  hideDetails = process.env.NODE_ENV !== 'development'
}) => {
  if (!error) return null;
  
  // Get error data in our standard format
  const errorData = typeof error === 'string' 
    ? { error, errorType: ErrorTypes.UNKNOWN }
    : error;
  
  const severity = getAlertSeverity(errorData.errorType);
  const userMessage = errorData.error || ErrorHandler.getUserFriendlyMessage(errorData.errorType);
  
  if (compact) {
    return (
      <Alert 
        severity={severity} 
        sx={{ mb: 2, width: '100%' }}
        action={
          onRetry && (
            <Button 
              color="inherit" 
              size="small" 
              onClick={onRetry}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          )
        }
      >
        {userMessage}
      </Alert>
    );
  }
  
  return (
    <Alert 
      severity={severity} 
      sx={{ mb: 3, width: '100%' }}
      action={
        onRetry && (
          <Button 
            color="inherit" 
            size="small" 
            onClick={onRetry}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        )
      }
    >
      <AlertTitle>{
        severity === 'error' ? 'Error' : 
        severity === 'warning' ? 'Warning' : 
        'Information'
      }</AlertTitle>
      
      <Typography variant="body2" gutterBottom>
        {userMessage}
      </Typography>
      
      {!hideDetails && errorData.details && (
        <Collapse in={true}>
          <Box 
            sx={{ 
              mt: 1, 
              p: 1, 
              borderRadius: 1, 
              bgcolor: 'rgba(0,0,0,0.04)',
              maxHeight: '150px',
              overflow: 'auto'
            }}
          >
            <Typography variant="caption" component="pre" sx={{ m: 0 }}>
              {JSON.stringify(errorData.details, null, 2)}
            </Typography>
          </Box>
        </Collapse>
      )}
    </Alert>
  );
};

/**
 * Error Toast Notification
 * For displaying temporary error notifications
 */
export const ErrorToast = ({ 
  error, 
  open, 
  onClose, 
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' } 
}) => {
  if (!error) return null;
  
  // Get error data in our standard format
  const errorData = typeof error === 'string' 
    ? { error, errorType: ErrorTypes.UNKNOWN }
    : error;
  
  const severity = getAlertSeverity(errorData.errorType);
  const userMessage = errorData.error || ErrorHandler.getUserFriendlyMessage(errorData.errorType);
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {userMessage}
      </Alert>
    </Snackbar>
  );
};

/**
 * Error Page
 * For critical errors that take over the whole page/section
 */
export const ErrorPage = ({ 
  error, 
  onRetry,
  title,
  hideDetails = process.env.NODE_ENV !== 'development'
}) => {
  if (!error) return null;
  
  // Get error data in our standard format
  const errorData = typeof error === 'string' 
    ? { error, errorType: ErrorTypes.UNKNOWN }
    : error;
  
  const userMessage = errorData.error || ErrorHandler.getUserFriendlyMessage(errorData.errorType);
  
  let Icon = ErrorIcon;
  if (errorData.errorType === ErrorTypes.AUTHENTICATION || 
      errorData.errorType === ErrorTypes.AUTHORIZATION) {
    Icon = WarningIcon;
  } else if (errorData.errorType === ErrorTypes.NETWORK || 
             errorData.errorType === ErrorTypes.TIMEOUT) {
    Icon = InfoIcon;
  }
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        m: 2, 
        borderRadius: 2,
        backgroundColor: 'background.paper',
        maxWidth: '100%',
        textAlign: 'center'
      }}
    >
      <Icon fontSize="large" color="error" sx={{ fontSize: 60, mb: 2 }} />
      
      <Typography variant="h5" component="h2" gutterBottom>
        {title || 'Something went wrong'}
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        {userMessage}
      </Typography>
      
      {!hideDetails && errorData.details && (
        <Box 
          sx={{ 
            p: 2, 
            my: 2, 
            backgroundColor: 'rgba(0,0,0,0.05)', 
            borderRadius: 1,
            maxHeight: '200px',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            textAlign: 'left'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Error Details:
          </Typography>
          <pre>{JSON.stringify(errorData.details, null, 2)}</pre>
        </Box>
      )}
      
      {onRetry && (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      )}
    </Paper>
  );
};

/**
 * Default export for the common case
 */
const ErrorDisplay = InlineError;
export default ErrorDisplay; 