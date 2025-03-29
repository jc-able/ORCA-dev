/**
 * Messaging Controller
 * Handles messaging-related API requests and responses
 */
const messageModel = require('../models/messageModel');
const personModel = require('../models/personModel');
const { google } = require('googleapis');
const telnyx = require('telnyx');

// Initialize Telnyx client
const telnyxClient = telnyx(process.env.TELNYX_API_KEY);

/**
 * Get all messages with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllMessages = async (req, res, next) => {
  try {
    // Extract query parameters
    const { 
      page = 0, 
      pageSize = 20,
      messageType,
      recipientId,
      senderId,
      dateFrom,
      dateTo
    } = req.query;
    
    // Prepare filters
    const filters = {
      messageType,
      recipientId,
      senderId,
      dateFrom,
      dateTo
    };
    
    // Prepare pagination
    const pagination = {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    };
    
    // Get messages
    const messages = await messageModel.getAllMessages(filters, pagination);
    
    // Return response
    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get message by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const message = await messageModel.getMessageById(id);
    
    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: `Message with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get full conversation with a specific person
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getConversation = async (req, res, next) => {
  try {
    const { personId } = req.params;
    const userId = req.user.id; // From auth middleware
    
    // Check if person exists
    const person = await personModel.getPersonById(personId);
    
    if (!person) {
      return res.status(404).json({
        status: 'error',
        message: `Person with ID ${personId} not found`
      });
    }
    
    // Get conversation
    const conversation = await messageModel.getConversation(userId, personId);
    
    res.status(200).json({
      status: 'success',
      results: conversation.length,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message (generic handler)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { 
      recipientId, 
      messageType,
      subject, 
      content,
      templateId,
      personalizationData
    } = req.body;
    
    if (!recipientId || !content || !messageType) {
      return res.status(400).json({
        status: 'error',
        message: 'Recipient ID, message type and content are required'
      });
    }
    
    // Check if valid message type
    if (!['email', 'sms'].includes(messageType.toLowerCase())) {
      return res.status(400).json({
        status: 'error',
        message: 'Message type must be either "email" or "sms"'
      });
    }
    
    // Check if recipient exists
    const recipient = await personModel.getPersonById(recipientId);
    
    if (!recipient) {
      return res.status(404).json({
        status: 'error',
        message: `Recipient with ID ${recipientId} not found`
      });
    }
    
    // Prepare message data
    const messageData = {
      sender_id: req.user.id, // From auth middleware
      recipient_id: recipientId,
      message_type: messageType.toLowerCase(),
      subject,
      content,
      template_id: templateId,
      personalization_data: personalizationData
    };
    
    // Route based on message type
    let sentMessage;
    
    if (messageType.toLowerCase() === 'email') {
      // Send email
      sentMessage = await this._sendEmailMessage(messageData, recipient);
    } else if (messageType.toLowerCase() === 'sms') {
      // Send SMS
      sentMessage = await this._sendSMSMessage(messageData, recipient);
    }
    
    res.status(201).json({
      status: 'success',
      data: sentMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send an SMS message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.sendSMS = async (req, res, next) => {
  try {
    const { 
      recipientId, 
      content,
      templateId,
      personalizationData
    } = req.body;
    
    if (!recipientId || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Recipient ID and content are required'
      });
    }
    
    // Check if recipient exists
    const recipient = await personModel.getPersonById(recipientId);
    
    if (!recipient) {
      return res.status(404).json({
        status: 'error',
        message: `Recipient with ID ${recipientId} not found`
      });
    }
    
    // Prepare message data
    const messageData = {
      sender_id: req.user.id, // From auth middleware
      recipient_id: recipientId,
      message_type: 'sms',
      content,
      template_id: templateId,
      personalization_data: personalizationData
    };
    
    // Send SMS
    const sentMessage = await this._sendSMSMessage(messageData, recipient);
    
    res.status(201).json({
      status: 'success',
      data: sentMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Internal method to send SMS message
 * @param {Object} messageData - Message data
 * @param {Object} recipient - Recipient data
 * @returns {Promise<Object>} Sent message record
 * @private
 */
exports._sendSMSMessage = async (messageData, recipient) => {
  try {
    // Apply template if provided
    let finalContent = messageData.content;
    
    if (messageData.template_id && messageData.personalization_data) {
      const template = await messageModel.getTemplateById(messageData.template_id);
      if (template) {
        finalContent = this._applyTemplate(template.content, messageData.personalization_data);
      }
    }
    
    // In a real implementation, we would use Telnyx API
    // Check if we have the API key
    if (!process.env.TELNYX_API_KEY || !process.env.TELNYX_MESSAGING_PROFILE_ID) {
      console.warn('TELNYX_API_KEY or TELNYX_MESSAGING_PROFILE_ID not set, using mock SMS sending');
      
      // Create message record without actually sending
      return await messageModel.createMessage({
        ...messageData,
        content: finalContent,
        status: 'sent',
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString()
      });
    }
    
    // Format phone number if needed
    const phone = recipient.phone.replace(/\D/g, '');
    
    // For an actual implementation, use Telnyx API to send SMS
    try {
      const telnyxResponse = await telnyxClient.messages.create({
        from: process.env.TELNYX_MESSAGING_PROFILE_ID,
        to: phone,
        text: finalContent
      });
      
      // Create message record with Telnyx data
      return await messageModel.createMessage({
        ...messageData,
        content: finalContent,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          telnyx_message_id: telnyxResponse.data.id
        }
      });
    } catch (telnyxError) {
      console.error('Telnyx API error:', telnyxError);
      throw new Error(`SMS sending failed: ${telnyxError.message}`);
    }
  } catch (error) {
    console.error('Error in _sendSMSMessage:', error);
    throw error;
  }
};

/**
 * Send an email message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.sendEmail = async (req, res, next) => {
  try {
    const { 
      recipientId, 
      subject,
      content,
      templateId,
      personalizationData,
      attachments
    } = req.body;
    
    if (!recipientId || !subject || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Recipient ID, subject, and content are required'
      });
    }
    
    // Check if recipient exists
    const recipient = await personModel.getPersonById(recipientId);
    
    if (!recipient) {
      return res.status(404).json({
        status: 'error',
        message: `Recipient with ID ${recipientId} not found`
      });
    }
    
    // Prepare message data
    const messageData = {
      sender_id: req.user.id, // From auth middleware
      recipient_id: recipientId,
      message_type: 'email',
      subject,
      content,
      template_id: templateId,
      personalization_data: personalizationData,
      metadata: {
        attachments
      }
    };
    
    // Send email
    const sentMessage = await this._sendEmailMessage(messageData, recipient);
    
    res.status(201).json({
      status: 'success',
      data: sentMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Internal method to send email message
 * @param {Object} messageData - Message data
 * @param {Object} recipient - Recipient data
 * @returns {Promise<Object>} Sent message record
 * @private
 */
exports._sendEmailMessage = async (messageData, recipient) => {
  try {
    // Apply template if provided
    let finalSubject = messageData.subject;
    let finalContent = messageData.content;
    
    if (messageData.template_id && messageData.personalization_data) {
      const template = await messageModel.getTemplateById(messageData.template_id);
      if (template) {
        if (template.subject) {
          finalSubject = this._applyTemplate(template.subject, messageData.personalization_data);
        }
        finalContent = this._applyTemplate(template.content, messageData.personalization_data);
      }
    }
    
    // In a real implementation, we would use Google Gmail API
    // Check if we have the API credentials
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set, using mock email sending');
      
      // Create message record without actually sending
      return await messageModel.createMessage({
        ...messageData,
        subject: finalSubject,
        content: finalContent,
        status: 'sent',
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString()
      });
    }
    
    // For an actual implementation, use Google Gmail API to send email
    try {
      // This would require full OAuth flow and token management
      // For simplicity, we'll just create the message record
      return await messageModel.createMessage({
        ...messageData,
        subject: finalSubject,
        content: finalContent,
        status: 'sent',
        sent_at: new Date().toISOString()
      });
    } catch (googleError) {
      console.error('Google API error:', googleError);
      throw new Error(`Email sending failed: ${googleError.message}`);
    }
  } catch (error) {
    console.error('Error in _sendEmailMessage:', error);
    throw error;
  }
};

/**
 * Send a text blast to multiple recipients
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.sendTextBlast = async (req, res, next) => {
  try {
    const { 
      recipientIds,
      content,
      templateId,
      personalizationData,
      scheduledFor,
      filters
    } = req.body;
    
    // Validate either recipientIds or filters is provided
    if (!recipientIds && !filters) {
      return res.status(400).json({
        status: 'error',
        message: 'Either recipient IDs or filters are required'
      });
    }
    
    if (!content) {
      return res.status(400).json({
        status: 'error',
        message: 'Content is required'
      });
    }
    
    // Get recipients
    let recipients = [];
    
    if (recipientIds && recipientIds.length > 0) {
      // Use provided recipient IDs
      recipients = await Promise.all(
        recipientIds.map(id => personModel.getPersonById(id))
      );
      recipients = recipients.filter(r => r !== null);
    } else if (filters) {
      // Use filters to find recipients
      recipients = await personModel.getFilteredPersons(filters);
    }
    
    if (recipients.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid recipients found'
      });
    }
    
    // Create a text blast record
    const blastData = {
      sender_id: req.user.id,
      content,
      template_id: templateId,
      personalization_data: personalizationData,
      scheduled_for: scheduledFor,
      recipient_count: recipients.length,
      status: scheduledFor ? 'scheduled' : 'processing',
      created_at: new Date().toISOString()
    };
    
    const textBlast = await messageModel.createTextBlast(blastData);
    
    // If scheduled for later, return the blast record
    if (scheduledFor) {
      res.status(201).json({
        status: 'success',
        data: textBlast
      });
      return;
    }
    
    // Otherwise, process the blast immediately
    const messages = [];
    
    // Process each recipient
    for (const recipient of recipients) {
      // Skip recipients without a phone number or those who opted out
      if (!recipient.phone || recipient.sms_opt_in === false) {
        continue;
      }
      
      try {
        // Prepare personalized data for this recipient
        const recipientPersonalization = {
          ...personalizationData,
          first_name: recipient.first_name,
          last_name: recipient.last_name,
          full_name: `${recipient.first_name} ${recipient.last_name}`
        };
        
        // Prepare message data
        const messageData = {
          sender_id: req.user.id,
          recipient_id: recipient.id,
          message_type: 'sms',
          content,
          template_id: templateId,
          personalization_data: recipientPersonalization,
          is_blast: true,
          blast_id: textBlast.id
        };
        
        // Send the message
        const message = await this._sendSMSMessage(messageData, recipient);
        messages.push(message);
      } catch (recipientError) {
        console.error(`Error sending to recipient ${recipient.id}:`, recipientError);
        // Continue with other recipients
      }
    }
    
    // Update blast status
    await messageModel.updateTextBlastStatus(textBlast.id, 'completed', messages.length);
    
    res.status(201).json({
      status: 'success',
      data: {
        ...textBlast,
        status: 'completed',
        sent_count: messages.length,
        messages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all text blasts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllTextBlasts = async (req, res, next) => {
  try {
    // Extract query parameters
    const { 
      page = 0, 
      pageSize = 10,
      status,
      dateFrom,
      dateTo,
      senderId
    } = req.query;
    
    // Prepare filters
    const filters = {
      status,
      dateFrom,
      dateTo,
      senderId: senderId || req.user.id // Default to current user
    };
    
    // Prepare pagination
    const pagination = {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    };
    
    // Get text blasts
    const textBlasts = await messageModel.getAllTextBlasts(filters, pagination);
    
    // Return response
    res.status(200).json({
      status: 'success',
      results: textBlasts.length,
      data: textBlasts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get text blast by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getTextBlastById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const textBlast = await messageModel.getTextBlastById(id);
    
    if (!textBlast) {
      return res.status(404).json({
        status: 'error',
        message: `Text blast with ID ${id} not found`
      });
    }
    
    // Get messages associated with this blast
    const messages = await messageModel.getMessagesByBlastId(id);
    
    res.status(200).json({
      status: 'success',
      data: {
        ...textBlast,
        messages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all message templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllTemplates = async (req, res, next) => {
  try {
    // Extract query parameters
    const { 
      page = 0, 
      pageSize = 10,
      templateType
    } = req.query;
    
    // Prepare filters
    const filters = {
      templateType,
      userId: req.user.id // Get templates created by this user
    };
    
    // Prepare pagination
    const pagination = {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    };
    
    // Get templates
    const templates = await messageModel.getAllTemplates(filters, pagination);
    
    // Return response
    res.status(200).json({
      status: 'success',
      results: templates.length,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new message template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createTemplate = async (req, res, next) => {
  try {
    const { 
      name,
      templateType,
      subject,
      content,
      variables
    } = req.body;
    
    if (!name || !templateType || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, template type, and content are required'
      });
    }
    
    // Prepare template data
    const templateData = {
      user_id: req.user.id,
      name,
      template_type: templateType,
      subject,
      content,
      variables: variables || [],
      created_at: new Date().toISOString()
    };
    
    // Create template
    const template = await messageModel.createTemplate(templateData);
    
    res.status(201).json({
      status: 'success',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get template by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const template = await messageModel.getTemplateById(id);
    
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: `Template with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name,
      templateType,
      subject,
      content,
      variables
    } = req.body;
    
    // Check if template exists
    const existingTemplate = await messageModel.getTemplateById(id);
    
    if (!existingTemplate) {
      return res.status(404).json({
        status: 'error',
        message: `Template with ID ${id} not found`
      });
    }
    
    // Check if the template belongs to the user
    if (existingTemplate.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this template'
      });
    }
    
    // Prepare template data
    const templateData = {
      name,
      template_type: templateType,
      subject,
      content,
      variables,
      updated_at: new Date().toISOString()
    };
    
    // Remove undefined fields
    Object.keys(templateData).forEach(key => {
      if (templateData[key] === undefined) {
        delete templateData[key];
      }
    });
    
    // Update template
    const updatedTemplate = await messageModel.updateTemplate(id, templateData);
    
    res.status(200).json({
      status: 'success',
      data: updatedTemplate
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if template exists
    const existingTemplate = await messageModel.getTemplateById(id);
    
    if (!existingTemplate) {
      return res.status(404).json({
        status: 'error',
        message: `Template with ID ${id} not found`
      });
    }
    
    // Check if the template belongs to the user
    if (existingTemplate.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this template'
      });
    }
    
    // Delete template
    await messageModel.deleteTemplate(id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messaging statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getMessagingStats = async (req, res, next) => {
  try {
    const { 
      dateFrom, 
      dateTo,
      userId
    } = req.query;
    
    // Get statistics
    const stats = await messageModel.getMessagingStats(dateFrom, dateTo, userId);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper method to apply a template with personalization data
 * @param {String} template - Template string with placeholders
 * @param {Object} data - Personalization data
 * @returns {String} Personalized content
 * @private
 */
exports._applyTemplate = (template, data) => {
  let result = template;
  
  // Replace placeholders in template (e.g. {{first_name}})
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value);
    });
  }
  
  return result;
}; 