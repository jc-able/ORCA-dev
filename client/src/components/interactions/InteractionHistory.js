import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  Divider, 
  Paper, 
  Avatar,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Message as SmsIcon,
  EventNote as MeetingIcon,
  Note as NoteIcon,
  Visibility as VisitIcon,
  Description as FormIcon,
  Payment as PaymentIcon,
  MoreHoriz as OtherIcon,
  Add as AddIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import InteractionForm from './InteractionForm';
import InteractionFilter from './InteractionFilter';
import ErrorMessage from '../ui/ErrorMessage';

/**
 * Get icon for interaction type
 * @param {String} type - Interaction type
 * @returns {JSX.Element} Icon component
 */
const getInteractionIcon = (type) => {
  switch (type) {
    case 'call': return <PhoneIcon />;
    case 'email': return <EmailIcon />;
    case 'sms': return <SmsIcon />;
    case 'meeting': return <MeetingIcon />;
    case 'note': return <NoteIcon />;
    case 'visit': return <VisitIcon />;
    case 'form': return <FormIcon />;
    case 'payment': return <PaymentIcon />;
    default: return <OtherIcon />;
  }
};

/**
 * Get color for interaction type
 * @param {String} type - Interaction type
 * @returns {String} Color name
 */
const getInteractionColor = (type) => {
  switch (type) {
    case 'call': return 'primary';
    case 'email': return 'info';
    case 'sms': return 'success';
    case 'meeting': return 'secondary';
    case 'note': return 'default';
    case 'visit': return 'warning';
    case 'form': return 'info';
    case 'payment': return 'success';
    default: return 'default';
  }
};

/**
 * InteractionHistory Component
 * Displays a history of interactions with a person
 * 
 * @param {Object} props - Component props
 * @param {String} props.personId - Person ID
 * @param {Boolean} props.allowAdd - Whether to show the add interaction button
 * @param {Boolean} props.allowFilter - Whether to show the filter button
 * @param {Number} props.initialLimit - Initial number of interactions to show
 * @param {String} props.emptyMessage - Message to show when there are no interactions
 * @returns {JSX.Element} Interaction history component
 */
const InteractionHistory = ({ 
  personId, 
  allowAdd = true, 
  allowFilter = true,
  initialLimit = 5,
  emptyMessage = 'No interaction history found'
}) => {
  const theme = useTheme();
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialLimit);
  
  // Fetch interactions on component mount
  useEffect(() => {
    if (!personId) return;
    
    const fetchInteractions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const params = new URLSearchParams({
          page,
          pageSize
        });
        
        // Add any active filters
        if (filters.type) params.append('type', filters.type);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.status) params.append('status', filters.status);
        
        const response = await fetch(`/api/interactions/person/${personId}?${params}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch interactions: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setInteractions(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch interactions');
        }
      } catch (err) {
        console.error('Error fetching interactions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInteractions();
  }, [personId, page, pageSize, filters]);
  
  // Handle form submission
  const handleFormSubmit = (newInteraction) => {
    // Close the form
    setShowForm(false);
    
    // Refresh the interaction list
    setPage(0);
    
    // TODO: Optimize by updating the local state instead of refetching
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setShowFilter(false);
    setPage(0);
  };
  
  // Load more interactions
  const handleLoadMore = () => {
    setPageSize(prevSize => prevSize + initialLimit);
  };
  
  // Render loading state
  if (loading && interactions.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        p={2}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" ml={1}>
          Loading interaction history...
        </Typography>
      </Box>
    );
  }
  
  // Render error state
  if (error && !loading) {
    return <ErrorMessage message={error} />;
  }
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1
      }}
    >
      {/* Header */}
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        p={2}
        borderBottom={`1px solid ${theme.palette.divider}`}
      >
        <Typography variant="h6">
          Interaction History
        </Typography>
        
        <Box>
          {allowFilter && (
            <Tooltip title="Filter interactions">
              <IconButton onClick={() => setShowFilter(!showFilter)}>
                <FilterIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {allowAdd && (
            <Tooltip title="Add interaction">
              <IconButton 
                color="primary"
                onClick={() => setShowForm(!showForm)}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      {/* Filter Panel */}
      {showFilter && (
        <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`}>
          <InteractionFilter 
            initialFilters={filters}
            onApplyFilters={handleFilterChange}
            onCancel={() => setShowFilter(false)}
          />
        </Box>
      )}
      
      {/* Add Interaction Form */}
      {showForm && (
        <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`}>
          <InteractionForm 
            personId={personId}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        </Box>
      )}
      
      {/* Interaction List */}
      {interactions.length > 0 ? (
        <List sx={{ width: '100%', p: 0 }}>
          {interactions.map((interaction, index) => (
            <React.Fragment key={interaction.id}>
              <ListItem
                alignItems="flex-start"
                sx={{ 
                  py: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: `${getInteractionColor(interaction.interaction_type)}.main`,
                    mr: 2
                  }}
                >
                  {getInteractionIcon(interaction.interaction_type)}
                </Avatar>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1" component="span">
                        {interaction.subject || `${interaction.interaction_type.charAt(0).toUpperCase() + interaction.interaction_type.slice(1)} Interaction`}
                      </Typography>
                      
                      <Chip 
                        label={interaction.interaction_type}
                        size="small"
                        color={getInteractionColor(interaction.interaction_type)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        component="span"
                        sx={{ display: 'block', mt: 1 }}
                      >
                        {interaction.content}
                      </Typography>
                      
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          By: {interaction.users?.first_name || 'System'} {interaction.users?.last_name || ''}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary">
                          {interaction.created_at && format(new Date(interaction.created_at), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                      
                      {interaction.response_received && (
                        <Box 
                          mt={1} 
                          p={1.5} 
                          bgcolor={theme.palette.background.default}
                          borderRadius={1}
                        >
                          <Typography variant="body2" color="text.secondary" mb={0.5}>
                            Response:
                          </Typography>
                          <Typography variant="body2">
                            {interaction.response_content}
                          </Typography>
                        </Box>
                      )}
                    </>
                  }
                />
              </ListItem>
              
              {index < interactions.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          p={4}
        >
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      )}
      
      {/* Load More */}
      {interactions.length >= pageSize && (
        <Box 
          p={2} 
          display="flex" 
          justifyContent="center"
          borderTop={`1px solid ${theme.palette.divider}`}
        >
          <Typography 
            variant="button" 
            color="primary" 
            sx={{ cursor: 'pointer' }}
            onClick={handleLoadMore}
          >
            Load More
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default InteractionHistory; 