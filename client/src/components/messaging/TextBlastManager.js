import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  Avatar,
  IconButton,
  ListItem,
  ListItemText,
  ListItemAvatar,
  List,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Send as SendIcon, 
  Group as GroupIcon,
  FilterList as FilterIcon,
  PersonAdd as PersonAddIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { formatTimestamp, processJsonField } from '../../utils/dataTransformUtils';

/**
 * TextBlastManager component
 * Manages SMS blast messaging to multiple recipients
 * Creates messages in the database with is_blast=true and a shared blast_id
 * 
 * @param {Function} onSend - Function to call when sending blast
 * @param {Array} leads - Array of leads to potentially message
 */
const TextBlastManager = ({ onSend, leads = [] }) => {
  const [message, setMessage] = useState('');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    interestLevel: '',
    lastContact: '',
    source: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSelectRecipients, setShowSelectRecipients] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Handle message change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  // Apply filters to leads
  const getFilteredLeads = () => {
    let filtered = [...leads];
    
    // Filter by lead_extensions.lead_status
    if (filters.status) {
      filtered = filtered.filter(lead => {
        if (lead.lead_extensions && lead.lead_extensions.length > 0) {
          return lead.lead_extensions[0].lead_status === filters.status;
        }
        return false;
      });
    }
    
    // Filter by interest_level (from persons table)
    if (filters.interestLevel) {
      filtered = filtered.filter(lead => lead.interest_level === filters.interestLevel);
    }
    
    // Filter by acquisition_source (from persons table)
    if (filters.source) {
      filtered = filtered.filter(lead => lead.acquisition_source === filters.source);
    }
    
    return filtered;
  };

  // Toggle lead selection
  const toggleLeadSelection = (lead) => {
    if (selectedLeads.some(l => l.id === lead.id)) {
      setSelectedLeads(selectedLeads.filter(l => l.id !== lead.id));
    } else {
      setSelectedLeads([...selectedLeads, lead]);
    }
  };

  // Select all filtered leads
  const selectAllFiltered = () => {
    setSelectedLeads(getFilteredLeads());
  };

  // Clear all selected leads
  const clearSelection = () => {
    setSelectedLeads([]);
  };

  // Toggle filters dialog
  const toggleFiltersDialog = () => {
    setShowFilters(!showFilters);
  };

  // Toggle recipient selection dialog
  const toggleSelectRecipientsDialog = () => {
    setShowSelectRecipients(!showSelectRecipients);
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Handle scheduled toggle
  const handleScheduledToggle = (e) => {
    setScheduled(e.target.checked);
  };

  // Handle sending the blast
  const handleSendBlast = () => {
    if (!message.trim() || selectedLeads.length === 0) return;
    
    // Generate a unique blast ID - this will be shared across all messages
    // in this blast to group them in the database
    const blastId = `blast_${Date.now()}`;
    
    // Create a message for each recipient, all sharing the same blast_id
    const messages = selectedLeads.map(lead => ({
      content: message,
      recipient_id: lead.id,
      message_type: 'sms',
      sent_at: scheduled ? null : new Date().toISOString(),
      status: scheduled ? 'scheduled' : 'sent',
      scheduled_for: scheduled ? `${scheduledDate}T${scheduledTime}` : null,
      is_blast: true,
      blast_id: blastId,
      personalization_data: processJsonField({
        first_name: lead.first_name,
        last_name: lead.last_name
      })
    }));
    
    // Send the blast messages
    if (onSend) {
      onSend({
        messages,
        blastId,
        totalRecipients: selectedLeads.length,
        scheduled,
        scheduledDate: scheduled ? formatTimestamp(`${scheduledDate}T${scheduledTime}`, 'iso') : null
      });
    }
    
    // Reset form
    setMessage('');
    setSelectedLeads([]);
    setScheduled(false);
    setScheduledDate('');
    setScheduledTime('');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <GroupIcon color="primary" />
          </Grid>
          <Grid item xs>
            <Typography variant="h6">
              Text Blast
            </Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              startIcon={<FilterIcon />}
              onClick={toggleFiltersDialog}
              size="small"
            >
              Filters
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recipients: {selectedLeads.length} selected
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {selectedLeads.length > 0 ? (
              selectedLeads.map(lead => (
                <Chip
                  key={lead.id}
                  avatar={<Avatar>{lead.first_name.charAt(0)}</Avatar>}
                  label={`${lead.first_name} ${lead.last_name}`}
                  onDelete={() => toggleLeadSelection(lead)}
                  variant="outlined"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recipients selected
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={toggleSelectRecipientsDialog}
            size="small"
            fullWidth
          >
            Select Recipients
          </Button>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Message
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            placeholder="Type your message here..."
            value={message}
            onChange={handleMessageChange}
            variant="outlined"
            InputProps={{
              sx: { backgroundColor: 'background.paper' }
            }}
            helperText={`${message.length}/160 characters`}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <FormControlLabel
            control={
              <Switch 
                checked={scheduled} 
                onChange={handleScheduledToggle} 
                color="primary"
              />
            }
            label="Schedule for later"
          />
          
          {scheduled && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
      
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={scheduled ? <ScheduleIcon /> : <SendIcon />}
          onClick={handleSendBlast}
          disabled={!message.trim() || selectedLeads.length === 0 || (scheduled && (!scheduledDate || !scheduledTime))}
        >
          {scheduled ? 'Schedule Blast' : 'Send Blast'}
        </Button>
      </Box>
      
      {/* Filters Dialog */}
      <Dialog open={showFilters} onClose={toggleFiltersDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Leads</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Lead Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Lead Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="appointment_scheduled">Appointment Scheduled</MenuItem>
                  <MenuItem value="appointment_completed">Appointment Completed</MenuItem>
                  <MenuItem value="proposal_made">Proposal Made</MenuItem>
                  <MenuItem value="negotiation">Negotiation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Interest Level</InputLabel>
                <Select
                  value={filters.interestLevel}
                  onChange={(e) => handleFilterChange('interestLevel', e.target.value)}
                  label="Interest Level"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Very High">Very High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Lead Source</InputLabel>
                <Select
                  value={filters.source}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  label="Lead Source"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Website">Website</MenuItem>
                  <MenuItem value="Social Media">Social Media</MenuItem>
                  <MenuItem value="Direct Referral">Direct Referral</MenuItem>
                  <MenuItem value="Walk-in">Walk-in</MenuItem>
                  <MenuItem value="Event">Event</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleFiltersDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Select Recipients Dialog */}
      <Dialog open={showSelectRecipients} onClose={toggleSelectRecipientsDialog} maxWidth="md" fullWidth>
        <DialogTitle>Select Recipients</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={selectAllFiltered}
            >
              Select All ({getFilteredLeads().length})
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={clearSelection}
              disabled={selectedLeads.length === 0}
            >
              Clear Selection
            </Button>
          </Box>
          
          <List sx={{ bgcolor: 'background.paper' }}>
            {getFilteredLeads().map((lead) => (
              <ListItem
                key={lead.id}
                button
                onClick={() => toggleLeadSelection(lead)}
                selected={selectedLeads.some(l => l.id === lead.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.dark',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    }
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar>{lead.first_name.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={`${lead.first_name} ${lead.last_name}`} 
                  secondary={lead.phone || 'No phone number'} 
                />
                {selectedLeads.some(l => l.id === lead.id) && (
                  <Chip 
                    label="Selected" 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleSelectRecipientsDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={toggleSelectRecipientsDialog}
            color="primary"
          >
            Confirm Selection ({selectedLeads.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TextBlastManager; 