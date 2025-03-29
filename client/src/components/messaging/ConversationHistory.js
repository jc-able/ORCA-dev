import React, { useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider,
  Avatar,
  Chip
} from '@mui/material';
import { 
  Done as DoneIcon, 
  DoneAll as DoneAllIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * ConversationHistory component
 * Displays a history of messages between the user and a contact
 */
const ConversationHistory = ({ messages = [], contact = {}, currentUser = {} }) => {
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Format timestamp to readable time
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for day dividers
  const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  // Get status icon based on message status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <DoneIcon fontSize="small" />;
      case 'delivered':
        return <DoneAllIcon fontSize="small" />;
      case 'read':
        return <DoneAllIcon fontSize="small" color="primary" />;
      case 'scheduled':
        return <ScheduleIcon fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, message) => {
    const date = formatMessageDate(message.timestamp);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {});

  if (messages.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          p: 3
        }}
      >
        <Typography color="text.secondary">
          No messages yet. Start a conversation!
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        p: 2, 
        height: '100%',
        overflow: 'auto',
        bgcolor: 'background.default'
      }}
    >
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <Box key={date}>
          {/* Date divider */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 2, 
              mt: 2 
            }}
          >
            <Chip 
              label={date} 
              size="small" 
              sx={{ 
                bgcolor: 'background.paper', 
                color: 'text.secondary',
                fontSize: '0.75rem'
              }} 
            />
          </Box>
          
          {/* Messages for this date */}
          {dateMessages.map((message, index) => {
            const isSent = message.sender === currentUser.id;
            
            return (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: isSent ? 'flex-end' : 'flex-start',
                  mb: 1.5
                }}
              >
                {/* Avatar for received messages */}
                {!isSent && (
                  <Avatar 
                    sx={{ width: 32, height: 32, mr: 1 }}
                    alt={contact.name}
                    src={contact.avatar}
                  >
                    {contact.name?.charAt(0) || '?'}
                  </Avatar>
                )}
                
                {/* Message bubble */}
                <Box 
                  sx={{ 
                    maxWidth: '70%',
                    position: 'relative'
                  }}
                >
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 2,
                      bgcolor: isSent ? 'primary.main' : 'background.paper',
                      color: isSent ? 'primary.contrastText' : 'text.primary',
                      borderTopRightRadius: isSent ? 0 : 2,
                      borderTopLeftRadius: isSent ? 2 : 0,
                    }}
                  >
                    {/* Email subject */}
                    {message.type === 'email' && message.subject && (
                      <>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {message.subject}
                        </Typography>
                        <Divider sx={{ my: 0.5 }} />
                      </>
                    )}
                    
                    {/* Message content */}
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    
                    {/* Time and status */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        alignItems: 'center',
                        mt: 0.5,
                        opacity: 0.8,
                        fontSize: '0.7rem'
                      }}
                    >
                      <Typography variant="caption" sx={{ mr: 0.5 }}>
                        {formatMessageTime(message.timestamp)}
                      </Typography>
                      {isSent && getStatusIcon(message.status)}
                    </Box>
                  </Paper>
                </Box>
              </Box>
            );
          })}
        </Box>
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ConversationHistory; 