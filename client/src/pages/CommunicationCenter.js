import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  TextField, 
  Divider, 
  Tabs, 
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  InputAdornment,
  Badge,
  CircularProgress,
  Menu,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Send as SendIcon, 
  Email as EmailIcon, 
  Sms as SmsIcon, 
  Campaign as CampaignIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import MessageComposer from '../components/messaging/MessageComposer';
import ConversationHistory from '../components/messaging/ConversationHistory';
import TextBlastManager from '../components/messaging/TextBlastManager';

/**
 * Communication Center page component
 * Handles messaging and communication with leads and referrals
 */
function CommunicationCenter() {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [contactMenuAnchor, setContactMenuAnchor] = useState(null);
  const [activeContactId, setActiveContactId] = useState(null);
  
  // Current user mock data for demo
  const currentUser = {
    id: 'user1',
    name: 'John Smith',
    avatar: null
  };
  
  // Sample data for UI demonstration
  const contacts = [
    { id: '1', first_name: 'John', last_name: 'Doe', status: 'lead', lead_status: 'New', interest_level: 'High', last_contact: '2 days ago', phone: '555-123-4567', unread: true, acquisition_source: 'Website' },
    { id: '2', first_name: 'Sarah', last_name: 'Wilson', status: 'lead', lead_status: 'Contacted', interest_level: 'Medium', last_contact: '5 days ago', phone: '555-222-3333', unread: false, acquisition_source: 'Referral' },
    { id: '3', first_name: 'Mike', last_name: 'Johnson', status: 'referral', lead_status: 'Appointment Scheduled', interest_level: 'High', last_contact: '1 week ago', phone: '555-444-5555', unread: false, acquisition_source: 'Walk-in' },
    { id: '4', first_name: 'Emma', last_name: 'Lee', status: 'lead', lead_status: 'Proposal Made', interest_level: 'High', last_contact: 'Yesterday', phone: '555-999-8888', unread: true, acquisition_source: 'Social Media' },
    { id: '5', first_name: 'Robert', last_name: 'Chen', status: 'member', lead_status: 'Won', interest_level: 'High', last_contact: '3 days ago', phone: '555-777-6666', unread: false, acquisition_source: 'Event' },
  ];
  
  // Sample message templates
  const sampleTemplates = [
    {
      id: '1',
      type: 'sms',
      name: 'Appointment Reminder',
      content: 'Hi {first_name}, just a friendly reminder about your appointment tomorrow at {time}. Looking forward to meeting you!',
      preview: 'Appointment reminder template'
    },
    {
      id: '2',
      type: 'email',
      name: 'Welcome Email',
      subject: 'Welcome to Our Gym!',
      content: 'Dear {first_name},\n\nThank you for your interest in our gym. We\'re excited to help you achieve your fitness goals!\n\nBest regards,\nThe Gym Team',
      preview: 'Welcome email for new leads'
    }
  ];
  
  // Effect to fetch mock data
  useEffect(() => {
    // Simulate fetching conversations
    setTimeout(() => {
      const mockConversations = {
        '1': [
          { id: 'msg1', content: 'Hi John, thanks for your interest in our gym!', timestamp: '2023-08-15T10:30:00', sender: 'user1', type: 'sms', status: 'delivered' },
          { id: 'msg2', content: 'I\'d like to know more about your membership plans.', timestamp: '2023-08-15T10:45:00', sender: '1', type: 'sms' },
          { id: 'msg3', content: 'Sure, we have several options starting from $50/month for our basic plan.', timestamp: '2023-08-15T11:00:00', sender: 'user1', type: 'sms', status: 'read' },
          { id: 'msg4', content: 'That sounds great. Do you have any special offers for new members?', timestamp: '2023-08-16T09:15:00', sender: '1', type: 'sms' },
        ],
        '2': [
          { id: 'msg5', content: 'Hello Sarah, I saw you visited our gym yesterday. How was your experience?', timestamp: '2023-08-14T14:20:00', sender: 'user1', type: 'sms', status: 'delivered' },
          { id: 'msg6', content: 'It was great! I really liked the facilities.', timestamp: '2023-08-14T15:10:00', sender: '2', type: 'sms' },
        ],
        '4': [
          { id: 'msg7', subject: 'Membership Proposal', content: 'Dear Emma,\n\nBased on our conversation, I\'m pleased to offer you our premium membership at a special rate of $75/month for the first 3 months.\n\nPlease let me know if you have any questions.\n\nBest regards,\nJohn', timestamp: '2023-08-16T08:30:00', sender: 'user1', type: 'email', status: 'sent' },
        ]
      };
      
      setConversations(mockConversations);
      setMessageTemplates(sampleTemplates);
      setLoading(false);
    }, 1000);
  }, []);
  
  /**
   * Handle tab change
   * @param {Event} event - Tab change event
   * @param {number} newValue - New tab index
   */
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    // Clear selected contact when switching to blast mode
    if (newValue === 2) {
      setSelectedContact(null);
    }
  };
  
  /**
   * Handle search query change
   * @param {Event} e - Input change event
   */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Filter contacts based on search query
   * @returns {Array} Filtered contacts
   */
  const filteredContacts = contacts.filter(contact => 
    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  /**
   * Handle selecting a contact
   * @param {Object} contact - The selected contact
   */
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    
    // Mark as read in a real implementation
    // This would update the database
    if (contact.unread) {
      const updatedContacts = contacts.map(c => 
        c.id === contact.id ? { ...c, unread: false } : c
      );
      // In a real implementation, we would update the state here
    }
  };

  /**
   * Handle sending a message
   * @param {Object} messageData - The message data to send
   */
  const handleSendMessage = (messageData) => {
    if (!selectedContact) return;
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      ...messageData,
      sender: currentUser.id,
      status: 'sent'
    };
    
    // In a real implementation, this would be an API call
    const updatedConversations = { ...conversations };
    
    if (!updatedConversations[selectedContact.id]) {
      updatedConversations[selectedContact.id] = [];
    }
    
    updatedConversations[selectedContact.id] = [
      ...updatedConversations[selectedContact.id],
      newMessage
    ];
    
    setConversations(updatedConversations);
    
    // Update last contact time
    // This would update the database in a real implementation
    console.log('Message sent:', newMessage);
  };

  /**
   * Handle sending a text blast
   * @param {Object} blastData - The blast data to send
   */
  const handleSendBlast = (blastData) => {
    // In a real implementation, this would be an API call
    console.log('Text blast sent:', blastData);
    
    // Show success feedback
    alert(`Text blast ${blastData.scheduled ? 'scheduled' : 'sent'} to ${blastData.recipients.length} recipients`);
  };

  /**
   * Open contact menu
   * @param {Event} event - Click event
   * @param {string} contactId - The contact ID
   */
  const handleOpenContactMenu = (event, contactId) => {
    event.stopPropagation();
    setContactMenuAnchor(event.currentTarget);
    setActiveContactId(contactId);
  };

  /**
   * Close contact menu
   */
  const handleCloseContactMenu = () => {
    setContactMenuAnchor(null);
    setActiveContactId(null);
  };

  /**
   * Get conversation for selected contact
   * @returns {Array} Conversation messages
   */
  const getSelectedConversation = () => {
    if (!selectedContact) return [];
    return conversations[selectedContact.id] || [];
  };

  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="medium">
        Communication Center
      </Typography>
      
      {/* Tabs for different communication methods */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tab} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<SmsIcon />} label="SMS" />
          <Tab icon={<EmailIcon />} label="Email" />
          <Tab icon={<CampaignIcon />} label="Text Blast" />
        </Tabs>
      </Paper>
      
      <Grid container spacing={3}>
        {/* Only show contacts list in SMS and Email tabs */}
        {tab !== 2 && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ height: '650px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              <Divider />
              
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
                  <CircularProgress />
                </Box>
              ) : (
                <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                  {filteredContacts.map((contact) => (
                    <React.Fragment key={contact.id}>
                      <ListItem 
                        button 
                        alignItems="flex-start"
                        sx={{
                          backgroundColor: selectedContact?.id === contact.id ? 'rgba(0, 191, 255, 0.1)' : 
                                          contact.unread ? 'rgba(0, 191, 255, 0.05)' : 'transparent',
                          '&:hover': {
                            backgroundColor: selectedContact?.id === contact.id ? 'rgba(0, 191, 255, 0.2)' : 'rgba(0, 0, 0, 0.04)',
                          }
                        }}
                        onClick={() => handleSelectContact(contact)}
                      >
                        <ListItemAvatar>
                          <Badge 
                            color="primary" 
                            variant="dot" 
                            invisible={!contact.unread}
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          >
                            <Avatar>
                              {contact.first_name.charAt(0)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1" noWrap sx={{ maxWidth: '150px' }}>
                                {`${contact.first_name} ${contact.last_name}`}
                              </Typography>
                              <Box>
                                <Chip 
                                  label={contact.status} 
                                  size="small"
                                  color={
                                    contact.status === 'lead' ? 'primary' : 
                                    contact.status === 'referral' ? 'secondary' : 'default'
                                  }
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => handleOpenContactMenu(e, contact.id)}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {contact.phone}
                              </Typography>
                              <Typography component="div" variant="caption" color="text.secondary">
                                Last contacted: {contact.last_contact}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        )}
        
        {/* Message Area */}
        <Grid item xs={12} md={tab === 2 ? 12 : 8}>
          <Paper sx={{ height: '650px', display: 'flex', flexDirection: 'column' }}>
            {/* Conversation Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              {tab === 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    {selectedContact 
                      ? `SMS: ${selectedContact.first_name} ${selectedContact.last_name}` 
                      : 'SMS Messaging'}
                  </Typography>
                  {selectedContact && (
                    <Tooltip title="Call">
                      <IconButton color="primary">
                        <PhoneIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
              {tab === 1 && (
                <Typography variant="h6">
                  {selectedContact 
                    ? `Email: ${selectedContact.first_name} ${selectedContact.last_name}` 
                    : 'Email Composer'}
                </Typography>
              )}
              {tab === 2 && (
                <Typography variant="h6">
                  Text Blast Manager
                </Typography>
              )}
            </Box>
            
            {/* Content based on selected tab */}
            {tab === 0 && (
              <>
                {selectedContact ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* SMS Conversation */}
                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                      <ConversationHistory 
                        messages={getSelectedConversation()}
                        contact={selectedContact}
                        currentUser={currentUser}
                      />
                    </Box>
                    
                    {/* SMS Composer */}
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                      <MessageComposer 
                        type="sms"
                        recipient={selectedContact.id}
                        onSend={handleSendMessage}
                        templates={messageTemplates.filter(t => t.type === 'sms')}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%',
                    p: 3
                  }}>
                    <Typography color="text.secondary">
                      Select a contact to start a conversation
                    </Typography>
                  </Box>
                )}
              </>
            )}
            
            {tab === 1 && (
              <>
                {selectedContact ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Email Conversation */}
                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                      <ConversationHistory 
                        messages={getSelectedConversation().filter(msg => msg.type === 'email')}
                        contact={selectedContact}
                        currentUser={currentUser}
                      />
                    </Box>
                    
                    {/* Email Composer */}
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                      <MessageComposer 
                        type="email"
                        recipient={selectedContact.id}
                        onSend={handleSendMessage}
                        templates={messageTemplates.filter(t => t.type === 'email')}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%',
                    p: 3
                  }}>
                    <Typography color="text.secondary">
                      Select a contact to start a conversation
                    </Typography>
                  </Box>
                )}
              </>
            )}
            
            {tab === 2 && (
              <TextBlastManager 
                onSend={handleSendBlast}
                leads={contacts.filter(c => c.status === 'lead')}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Contact Menu */}
      <Menu
        anchorEl={contactMenuAnchor}
        open={Boolean(contactMenuAnchor)}
        onClose={handleCloseContactMenu}
      >
        <MenuItem onClick={handleCloseContactMenu}>View Profile</MenuItem>
        <MenuItem onClick={handleCloseContactMenu}>Mark as Important</MenuItem>
        <MenuItem onClick={handleCloseContactMenu}>Add to Group</MenuItem>
      </Menu>
    </Box>
  );
}

export default CommunicationCenter; 