import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  IconButton, 
  Divider,
  Typography,
  Chip,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { 
  Send as SendIcon, 
  AttachFile as AttachFileIcon,
  InsertEmoticon as EmojiIcon,
  MoreVert as MoreVertIcon,
  Description as TemplateIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { 
  validateMessageBeforeSend, 
  getMessageDefaults, 
  extractTemplateVariables, 
  applyPersonalization 
} from '../../utils/messageValidation';

/**
 * MessageComposer component
 * Reusable component for composing both SMS and email messages
 * Maps to the messages table in the database
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Message type ('sms' or 'email') maps to message_type field
 * @param {Object} props.recipient - Recipient data (maps to recipient_id in messages table)
 * @param {Function} props.onSend - Function to call when sending message
 * @param {Array} props.templates - Available message templates
 * @param {number} props.maxLength - Maximum message length (for SMS)
 */
const MessageComposer = ({ 
  type = 'sms', // 'sms' or 'email'
  recipient, 
  onSend,
  templates = [],
  maxLength = type === 'sms' ? 160 : null
}) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [errors, setErrors] = useState({});

  // Handle message content change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    // Clear error when user types
    if (errors.content) {
      setErrors({
        ...errors,
        content: undefined
      });
    }
  };

  // Handle subject change (email only)
  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
    // Clear error when user types
    if (errors.subject) {
      setErrors({
        ...errors,
        subject: undefined
      });
    }
  };

  // Validate message before sending
  const validateBeforeSend = () => {
    // Create a message object that matches the database schema
    const messageToValidate = {
      sender_id: 'current-user', // This would be the actual user ID in a real app
      recipient_id: recipient?.id,
      message_type: type,
      content: message,
      subject: type === 'email' ? subject : undefined
    };
    
    // Use our validation utility
    const validationErrors = validateMessageBeforeSend(messageToValidate, maxLength);
    
    setErrors(validationErrors);
    
    // Return true if no errors
    return Object.keys(validationErrors).length === 0;
  };

  // Handle sending the message
  const handleSend = () => {
    // First validate the message
    if (!validateBeforeSend()) {
      return; // Don't send if validation fails
    }
    
    // Get default values based on schema constraints
    const defaults = getMessageDefaults(type);
    
    // Format payload to match messages table schema with defaults from SQL schema
    const payload = {
      ...defaults, // Include all default values
      content: message,
      recipient_id: recipient.id,
      message_type: type
    };
    
    if (type === 'email') {
      payload.subject = subject;
      payload.metadata = {
        ...payload.metadata,
        attachments: attachments
      };
    }
    
    if (onSend) {
      onSend(payload);
    }
    
    // Reset form
    setMessage('');
    setErrors({});
    if (type === 'email') {
      setSubject('');
      setAttachments([]);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setMessage(template.content);
    if (type === 'email' && template.subject) {
      setSubject(template.subject);
    }
    setShowTemplates(false);
    setSelectedTemplate(template.id);
  };

  // Toggle template dialog
  const toggleTemplateDialog = () => {
    setShowTemplates(!showTemplates);
  };

  // Character counter for SMS
  const renderCharacterCounter = () => {
    if (type !== 'sms' || !maxLength) return null;
    
    const count = message.length;
    const isOverLimit = count > maxLength;
    
    return (
      <Typography 
        variant="caption" 
        sx={{ 
          ml: 2, 
          color: isOverLimit ? 'error.main' : 'text.secondary' 
        }}
      >
        {count}/{maxLength} characters
      </Typography>
    );
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      {/* Header - shows recipient and message type */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Message to:
        </Typography>
        <Chip 
          label={recipient ? `${recipient.first_name} ${recipient.last_name}` : 'Select recipient'} 
          sx={{ ml: 1 }}
          color={recipient ? 'primary' : 'default'}
        />
        <Chip 
          label={type === 'sms' ? 'SMS' : 'Email'} 
          variant="outlined"
          size="small"
          sx={{ ml: 1 }}
        />
      </Box>
      
      {/* Display validation errors */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {Object.values(errors).map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </Alert>
      )}
      
      {/* Form fields */}
      <Box 
        component="form"
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2 
        }}
      >
        {/* Email subject field */}
        {type === 'email' && (
          <TextField
            label="Subject"
            fullWidth
            value={subject}
            onChange={handleSubjectChange}
            error={!!errors.subject}
            helperText={errors.subject}
          />
        )}
        
        {/* Message content field */}
        <TextField
          label={`Message${type === 'sms' ? ` (${maxLength} chars max)` : ''}`}
          multiline
          rows={type === 'email' ? 6 : 3}
          value={message}
          onChange={handleMessageChange}
          fullWidth
          error={!!errors.content}
          helperText={errors.content}
          InputProps={{
            endAdornment: type === 'sms' && (
              <InputAdornment position="end">
                {renderCharacterCounter()}
              </InputAdornment>
            )
          }}
        />
        
        {/* Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Box>
            {/* Template selection button */}
            <IconButton 
              onClick={toggleTemplateDialog}
              title="Select template"
            >
              <TemplateIcon />
            </IconButton>
            
            {/* Other action buttons dependent on message type */}
            {type === 'email' && (
              <IconButton title="Attach file">
                <AttachFileIcon />
              </IconButton>
            )}
            
            <IconButton title="Add emoji">
              <EmojiIcon />
            </IconButton>
            
            <IconButton title="Schedule">
              <ScheduleIcon />
            </IconButton>
          </Box>
          
          {/* Send button */}
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSend}
            disabled={!message || (type === 'email' && !subject)}
          >
            Send
          </Button>
        </Box>
      </Box>
      
      {/* Template selection dialog */}
      <Dialog open={showTemplates} onClose={toggleTemplateDialog} maxWidth="md">
        <DialogTitle>Select a Template</DialogTitle>
        <DialogContent>
          {templates.length === 0 ? (
            <Typography>No templates available</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
              {templates.filter(t => t.type === type).map((template) => (
                <Paper 
                  key={template.id} 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <Typography variant="subtitle1">{template.name}</Typography>
                  {type === 'email' && (
                    <Typography variant="body2" color="text.secondary">
                      Subject: {template.subject}
                    </Typography>
                  )}
                  <Typography sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                    {template.content.length > 100 
                      ? `${template.content.substring(0, 100)}...` 
                      : template.content}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleTemplateDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MessageComposer; 