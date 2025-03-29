import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorMessage from './ErrorMessage';
import LoadingState from './LoadingState';

/**
 * DataFetchWrapper Component
 * Wraps data-fetching components with consistent loading, error, and empty state handling
 * 
 * @param {Object} props - Component props
 * @param {Boolean} props.loading - Whether data is loading
 * @param {String|null} props.error - Error message, or null if no error
 * @param {Boolean} props.isEmpty - Whether the data is empty
 * @param {ReactNode} props.children - The content to render when data is loaded
 * @param {String} props.loadingMessage - Message to display during loading
 * @param {String} props.emptyMessage - Message to display when data is empty
 * @param {String} props.emptyActionLabel - Label for the empty state action button
 * @param {Function} props.onEmptyAction - Callback for the empty state action button
 * @param {Boolean} props.contained - Whether to display the loading/error/empty states in a container
 * @returns {JSX.Element} Wrapped component with loading, error, and empty states
 */
const DataFetchWrapper = ({
  loading = false,
  error = null,
  isEmpty = false,
  children,
  loadingMessage = 'Loading data...',
  emptyMessage = 'No data available',
  emptyActionLabel = 'Refresh',
  onEmptyAction = () => {},
  contained = true
}) => {
  // Show loading state
  if (loading) {
    return <LoadingState message={loadingMessage} contained={contained} />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        title="Error Loading Data" 
        fullWidth={true} 
      />
    );
  }

  // Show empty state
  if (isEmpty) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 2,
          textAlign: 'center'
        }}
      >
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 2 }}
        >
          {emptyMessage}
        </Typography>
        {onEmptyAction && (
          <Button 
            variant="outlined" 
            onClick={onEmptyAction}
            size="small"
          >
            {emptyActionLabel}
          </Button>
        )}
      </Box>
    );
  }

  // Show content
  return children;
};

export default DataFetchWrapper; 