import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Card, 
  CardContent, 
  IconButton, 
  Tooltip, 
  CircularProgress,
  Button
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Get leads by status
 * @param {Array} leads - Array of lead objects
 * @param {String} status - Status to filter by
 * @returns {Array} Filtered leads
 */
const getLeadsByStatus = (leads, status) => {
  if (!Array.isArray(leads)) return [];
  
  // Normalize the status for case-insensitive comparison
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  
  return leads.filter(lead => {
    // If lead has no extensions, return false
    if (!lead?.lead_extensions || lead.lead_extensions.length === 0) {
      return false;
    }
    
    // Get the lead status from the first extension
    const leadStatus = lead.lead_extensions[0]?.lead_status;
    
    // If no status, return false
    if (!leadStatus) {
      return false;
    }
    
    // Normalize the lead status for comparison
    const normalizedLeadStatus = leadStatus.toLowerCase().replace(/\s+/g, '_');
    
    // Compare normalized statuses, handling various formats
    return normalizedLeadStatus === normalizedStatus ||
           // Handle underscore vs space conversion
           normalizedLeadStatus === status.toLowerCase() ||
           leadStatus === status;
  });
};

/**
 * Get color for interest level
 * @param {String} interestLevel - Interest level (High, Medium, Low)
 * @returns {String} MUI color name
 */
const getInterestLevelColor = (interestLevel) => {
  if (!interestLevel) return 'default';
  
  switch(interestLevel) {
    case 'High':
      return 'success';
    case 'Medium':
      return 'warning';
    case 'Low':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * LeadPipeline component
 * A Kanban board for visualizing the lead pipeline
 * Supports drag and drop to move leads between stages
 */
const LeadPipeline = ({ pipelineData = {}, onLeadClick, onStatusChange }) => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState({});

  // Convert pipelineData to columns with correct structure
  useEffect(() => {
    if (!pipelineData || typeof pipelineData !== 'object') {
      setColumns({});
      return;
    }
    
    const newColumns = {};
    Object.keys(pipelineData).forEach(status => {
      // Convert status to a valid column id
      const columnId = status.toLowerCase().replace(/\s+/g, '_');
      
      newColumns[columnId] = {
        id: columnId,
        name: status,
        color: getStatusColor(status),
        items: Array.isArray(pipelineData[status]) ? pipelineData[status] : []
      };
    });
    
    setColumns(newColumns);
  }, [pipelineData]);
  
  // Get color for status
  const getStatusColor = (status) => {
    switch(status) {
      case 'New':
        return '#1e88e5'; // Blue
      case 'Contacted':
        return '#7b1fa2'; // Purple
      case 'Appointment Scheduled':
        return '#ff9800'; // Orange
      case 'Appointment Completed':
        return '#ffc107'; // Amber
      case 'Proposal Made':
        return '#3949ab'; // Indigo
      case 'Negotiation':
        return '#00acc1'; // Cyan
      case 'Won':
        return '#4caf50'; // Green
      case 'Lost':
        return '#f44336'; // Red
      case 'Nurturing':
        return '#9e9e9e'; // Grey
      default:
        return '#1e88e5'; // Default blue
    }
  };

  // Handle dragging end event
  const onDragEnd = result => {
    if (!result) return;
    
    const { source, destination } = result;

    // Dropped outside a droppable area
    if (!destination) {
      return;
    }

    // No change in position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    try {
      // Extract the lead from the source list
      const sourceStatus = source.droppableId;
      const sourceLeads = getLeadsByStatus(pipelineData[sourceStatus], sourceStatus);
      
      if (!Array.isArray(sourceLeads) || sourceLeads.length <= source.index) {
        console.error('Invalid source leads data');
        return;
      }
      
      const movedLead = sourceLeads[source.index];
      
      if (!movedLead || !movedLead.id) {
        console.error('Invalid lead data for drag operation');
        return;
      }

      // If the lead was moved to a different status column
      if (source.droppableId !== destination.droppableId) {
        // Call the onStatusChange callback with the lead ID and new status
        onStatusChange(movedLead.id, destination.droppableId);
      }
    } catch (error) {
      console.error('Error in drag and drop operation:', error);
    }
  };

  // Navigate to lead details page
  const handleViewLeadDetails = (leadId) => {
    navigate(`/leads/${leadId}`);
  };

  // Display loading state or empty state
  if (Object.keys(columns).length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3} minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (Object.values(columns).every(column => column.items.length === 0)) {
    return (
      <Box 
        sx={{ 
          height: '200px', 
          backgroundColor: 'rgba(0,191,255,0.1)', 
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px dashed',
          borderColor: 'primary.main'
        }}
      >
        <Typography variant="subtitle1" color="primary.main">
          No leads found. Add your first lead to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ 
        display: 'flex', 
        overflowX: 'auto', 
        pb: 2,
        '::-webkit-scrollbar': {
          height: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(0,191,255,0.6)',
          borderRadius: '4px',
        }
      }}>
        {Object.values(columns).map((column) => {
          return (
            <Box key={column.id} sx={{ minWidth: '280px', mr: 2 }}>
              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <Typography variant="h6" fontWeight="medium" sx={{ fontSize: '1rem' }}>
                  {column.name}
                </Typography>
                <Chip 
                  label={column.items?.length || 0} 
                  size="small" 
                  sx={{ 
                    backgroundColor: `${column.color}22`,
                    color: column.color,
                    fontWeight: 'bold'
                  }} 
                />
              </Box>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      minHeight: '500px',
                      backgroundColor: snapshot.isDraggingOver ? 'rgba(0,191,255,0.05)' : 'background.paper',
                      borderRadius: 1,
                      p: 1
                    }}
                  >
                    {column.items?.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              p: 2,
                              mb: 2,
                              backgroundColor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                              boxShadow: snapshot.isDragging ? 4 : 1,
                              '&:hover': {
                                boxShadow: 3,
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                                {lead?.first_name || ''} {lead?.last_name || ''}
                              </Typography>
                              <Chip 
                                label={lead?.lead_extensions && 
                                      Array.isArray(lead.lead_extensions) && 
                                      lead.lead_extensions.length > 0 ? 
                                      lead.lead_extensions[0]?.lead_status || 'New' : 'New'} 
                                color="primary" 
                                size="small" 
                                variant={lead?.lead_extensions && 
                                          Array.isArray(lead.lead_extensions) && 
                                          lead.lead_extensions.length > 0 ? 
                                          lead.lead_extensions[0]?.lead_status === 'New' ? 'filled' : 'outlined' : 'outlined'}
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {lead?.email || 'No email'}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {lead?.phone || 'No phone'}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                              <Chip 
                                label={`Interest: ${lead?.interest_level || 'Unknown'}`} 
                                size="small" 
                                variant="outlined" 
                                color={getInterestLevelColor(lead?.interest_level)} 
                              />
                              <Button
                                variant="text"
                                size="small"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => handleViewLeadDetails(lead?.id)}
                              >
                                Details
                              </Button>
                            </Box>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Box>
          );
        })}
      </Box>
    </DragDropContext>
  );
};

export default LeadPipeline; 