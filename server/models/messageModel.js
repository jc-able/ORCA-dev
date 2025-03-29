/**
 * Message Model
 * Handles message-related database operations
 */
const supabase = require('../config/supabase');
const { SchemaConstraints } = require('../db/schema/types');

/**
 * Standard fields for the messages table, matching Supabase database structure
 * Used for validation and documentation purposes
 */
exports.messageFields = {
  // Core fields
  id: 'uuid',
  
  // Sender and recipient
  sender_id: 'uuid', // NOT NULL constraint in SQL
  recipient_id: 'uuid', // NOT NULL constraint in SQL
  
  // Message details
  message_type: 'text', // NOT NULL constraint in SQL
  subject: 'text',
  content: 'text', // NOT NULL constraint in SQL
  
  // Status tracking
  status: 'text', // DEFAULT 'sent'::text in SQL
  sent_at: 'timestamp', // DEFAULT now() in SQL
  delivered_at: 'timestamp',
  read_at: 'timestamp',
  
  // For group messages
  is_blast: 'boolean', // DEFAULT false in SQL
  blast_id: 'uuid',
  
  // Personalization and campaign info
  template_id: 'uuid',
  personalization_data: 'jsonb',
  campaign_id: 'text',
  
  // Response tracking
  has_response: 'boolean', // DEFAULT false in SQL
  response_id: 'uuid',
  
  // Meta
  metadata: 'jsonb', // DEFAULT '{}'::jsonb in SQL
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp' // DEFAULT now() in SQL
};

/**
 * Validates message data against schema constraints
 * @param {Object} messageData - The message data to validate
 * @returns {Object} Object with isValid and errors properties
 */
exports.validateMessage = (messageData) => {
  const errors = [];
  
  // Check required fields
  if (!messageData.sender_id) {
    errors.push('sender_id is required');
  }
  
  if (!messageData.recipient_id) {
    errors.push('recipient_id is required');
  }
  
  if (!messageData.message_type) {
    errors.push('message_type is required');
  }
  
  if (!messageData.content) {
    errors.push('content is required');
  }
  
  // Set default values if not provided
  if (messageData.status === undefined) {
    messageData.status = SchemaConstraints.DEFAULT_VALUES.MESSAGE_STATUS;
  }
  
  if (messageData.is_blast === undefined) {
    messageData.is_blast = SchemaConstraints.DEFAULT_VALUES.IS_BLAST;
  }
  
  if (messageData.has_response === undefined) {
    messageData.has_response = SchemaConstraints.DEFAULT_VALUES.HAS_RESPONSE;
  }
  
  // Apply default values to metadata if not provided
  if (messageData.metadata === undefined) {
    messageData.metadata = {};
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: messageData
  };
};

/**
 * Get all messages with filtering options
 * @param {Object} filters - Optional query filters
 * @param {String} filters.messageType - Filter by message type
 * @param {UUID} filters.recipientId - Filter by recipient ID
 * @param {UUID} filters.senderId - Filter by sender ID
 * @param {String} filters.dateFrom - Filter by date range start
 * @param {String} filters.dateTo - Filter by date range end
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of message records
 */
exports.getAllMessages = async (filters = {}, pagination = { page: 0, pageSize: 20 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('messages')
      .select('*, sender:sender_id(*), recipient:recipient_id(*)')
      .range(from, to)
      .order('sent_at', { ascending: false });
    
    // Apply filters
    if (filters.messageType) {
      query = query.eq('message_type', filters.messageType);
    }
    
    if (filters.recipientId) {
      query = query.eq('recipient_id', filters.recipientId);
    }
    
    if (filters.senderId) {
      query = query.eq('sender_id', filters.senderId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('sent_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('sent_at', filters.dateTo);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getAllMessages:', error);
    throw error;
  }
};

/**
 * Get message by ID
 * @param {UUID} id - Message ID
 * @returns {Promise<Object>} Message record
 */
exports.getMessageById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(*), recipient:recipient_id(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getMessageById:', error);
    throw error;
  }
};

/**
 * Get conversation between a user and a person
 * @param {UUID} userId - User ID
 * @param {UUID} personId - Person ID
 * @returns {Promise<Array>} Array of message records in the conversation
 */
exports.getConversation = async (userId, personId) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${personId}),and(sender_id.eq.${personId},recipient_id.eq.${userId})`)
      .order('sent_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getConversation:', error);
    throw error;
  }
};

/**
 * Create a new message
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Created message record
 */
exports.createMessage = async (messageData) => {
  try {
    // Validate data
    const validation = exports.validateMessage(messageData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Add timestamps if not provided
    const now = new Date().toISOString();
    const dataWithTimestamps = {
      ...validation.data,
      sent_at: messageData.sent_at || now,
      created_at: messageData.created_at || now,
      updated_at: messageData.updated_at || now
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(dataWithTimestamps)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createMessage:', error);
    throw error;
  }
};

/**
 * Update a message
 * @param {UUID} id - Message ID
 * @param {Object} messageData - Message data to update
 * @returns {Promise<Object>} Updated message record
 */
exports.updateMessage = async (id, messageData) => {
  try {
    // Validate data
    const validation = exports.validateMessage(messageData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Add updated timestamp
    const now = new Date().toISOString();
    const dataWithTimestamp = {
      ...validation.data,
      updated_at: now
    };
    
    const { data, error } = await supabase
      .from('messages')
      .update(dataWithTimestamp)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateMessage:', error);
    throw error;
  }
};

/**
 * Mark message as delivered
 * @param {UUID} id - Message ID
 * @returns {Promise<Object>} Updated message record
 */
exports.markAsDelivered = async (id) => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('messages')
      .update({
        delivered_at: now,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in markAsDelivered:', error);
    throw error;
  }
};

/**
 * Mark message as read
 * @param {UUID} id - Message ID
 * @returns {Promise<Object>} Updated message record
 */
exports.markAsRead = async (id) => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('messages')
      .update({
        read_at: now,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in markAsRead:', error);
    throw error;
  }
};

/**
 * Delete a message
 * @param {UUID} id - Message ID
 * @returns {Promise<boolean>} Success flag
 */
exports.deleteMessage = async (id) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    throw error;
  }
};

/**
 * Record response to a message
 * @param {UUID} originalMessageId - Original message ID
 * @param {Object} responseData - Response message data
 * @returns {Promise<Object>} Created response message record
 */
exports.recordResponse = async (originalMessageId, responseData) => {
  try {
    // First get the original message
    const { data: originalMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', originalMessageId)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!originalMessage) {
      throw new Error(`Original message with ID ${originalMessageId} not found`);
    }
    
    // Create the response message
    const responseMessage = await exports.createMessage({
      ...responseData,
      sender_id: originalMessage.recipient_id,
      recipient_id: originalMessage.sender_id
    });
    
    // Update the original message to reference the response
    const { data: updatedOriginal, error: updateError } = await supabase
      .from('messages')
      .update({
        has_response: true,
        response_id: responseMessage.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', originalMessageId)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    return responseMessage;
  } catch (error) {
    console.error('Error in recordResponse:', error);
    throw error;
  }
};

/**
 * Create a blast message (single message sent to multiple recipients)
 * @param {Object} blastData - Basic message data without recipient info
 * @param {Array<UUID>} recipientIds - Array of recipient IDs
 * @returns {Promise<Object>} Object with blast ID and array of created messages
 */
exports.createBlast = async (blastData, recipientIds) => {
  try {
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      throw new Error('At least one recipient ID is required');
    }
    
    // Generate a blast ID
    const blastId = crypto.randomUUID();
    
    // Create a message for each recipient
    const messages = await Promise.all(
      recipientIds.map(async (recipientId) => {
        const messageData = {
          ...blastData,
          recipient_id: recipientId,
          is_blast: true,
          blast_id: blastId
        };
        
        // Validate data
        const validation = exports.validateMessage(messageData);
        
        if (!validation.isValid) {
          console.warn(`Skipping invalid message for recipient ${recipientId}: ${validation.errors.join(', ')}`);
          return null;
        }
        
        try {
          return await exports.createMessage(validation.data);
        } catch (error) {
          console.warn(`Failed to create message for recipient ${recipientId}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any nulls from failed messages
    const validMessages = messages.filter(Boolean);
    
    if (validMessages.length === 0) {
      throw new Error('Failed to create any valid messages in the blast');
    }
    
    return {
      blast_id: blastId,
      messages: validMessages,
      total_sent: validMessages.length,
      total_attempted: recipientIds.length
    };
  } catch (error) {
    console.error('Error in createBlast:', error);
    throw error;
  }
};

/**
 * Get all messages in a blast
 * @param {UUID} blastId - Blast ID
 * @returns {Promise<Array>} Array of message records in the blast
 */
exports.getBlastMessages = async (blastId) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, recipient:recipient_id(*)')
      .eq('blast_id', blastId)
      .order('sent_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getBlastMessages:', error);
    throw error;
  }
};

/**
 * Get blast summary
 * @param {UUID} blastId - Blast ID
 * @returns {Promise<Object>} Summary object with counts and status
 */
exports.getBlastSummary = async (blastId) => {
  try {
    const messages = await exports.getBlastMessages(blastId);
    
    if (!messages || messages.length === 0) {
      throw new Error(`No messages found for blast ID ${blastId}`);
    }
    
    const summary = {
      blast_id: blastId,
      total_messages: messages.length,
      delivered_count: messages.filter(msg => msg.delivered_at).length,
      read_count: messages.filter(msg => msg.read_at).length,
      response_count: messages.filter(msg => msg.has_response).length,
      sent_at: messages[0].sent_at,
      sender: messages[0].sender_id
    };
    
    return summary;
  } catch (error) {
    console.error('Error in getBlastSummary:', error);
    throw error;
  }
};

/**
 * Get unread message count for a user
 * @param {UUID} userId - User ID
 * @returns {Promise<number>} Count of unread messages
 */
exports.getUnreadMessageCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('recipient_id', userId)
      .is('read_at', null);
    
    if (error) {
      throw error;
    }
    
    return count;
  } catch (error) {
    console.error('Error in getUnreadMessageCount:', error);
    throw error;
  }
};

/**
 * Create a text blast
 * @param {Object} blastData - Text blast data
 * @returns {Promise<Object>} Created text blast record
 */
exports.createTextBlast = async (blastData) => {
  try {
    const { data, error } = await supabase
      .from('text_blasts')
      .insert(blastData)
      .select();
    
    if (error) {
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Error in createTextBlast:', error);
    throw error;
  }
};

/**
 * Update text blast status
 * @param {UUID} id - Text blast ID
 * @param {String} status - New status
 * @param {Number} sentCount - Number of messages sent
 * @returns {Promise<Object>} Updated text blast record
 */
exports.updateTextBlastStatus = async (id, status, sentCount) => {
  try {
    const { data, error } = await supabase
      .from('text_blasts')
      .update({
        status,
        sent_count: sentCount,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select();
    
    if (error) {
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Error in updateTextBlastStatus:', error);
    throw error;
  }
};

/**
 * Get all text blasts
 * @param {Object} filters - Optional query filters
 * @param {String} filters.status - Filter by status
 * @param {UUID} filters.senderId - Filter by sender ID
 * @param {String} filters.dateFrom - Filter by date range start
 * @param {String} filters.dateTo - Filter by date range end
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of text blast records
 */
exports.getAllTextBlasts = async (filters = {}, pagination = { page: 0, pageSize: 10 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('text_blasts')
      .select('*, sender:sender_id(*)')
      .range(from, to)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.senderId) {
      query = query.eq('sender_id', filters.senderId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getAllTextBlasts:', error);
    throw error;
  }
};

/**
 * Get text blast by ID
 * @param {UUID} id - Text blast ID
 * @returns {Promise<Object>} Text blast record
 */
exports.getTextBlastById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('text_blasts')
      .select('*, sender:sender_id(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getTextBlastById:', error);
    throw error;
  }
};

/**
 * Create multiple messages in a batch
 * @param {Array} messages - Array of message objects
 * @returns {Promise<Object>} Result of the batch insert
 */
exports.createBatchMessages = async (messages) => {
  try {
    // Validate that each message has the required fields
    messages.forEach((message, index) => {
      if (!message.sender_id) {
        throw new Error(`Message at index ${index} is missing sender_id`);
      }
      
      if (!message.recipient_id) {
        throw new Error(`Message at index ${index} is missing recipient_id`);
      }
      
      if (!message.message_type) {
        throw new Error(`Message at index ${index} is missing message_type`);
      }
      
      if (!message.content) {
        throw new Error(`Message at index ${index} is missing content`);
      }
    });
    
    const now = new Date().toISOString();
    
    // Add timestamps to all messages
    const messagesWithTimestamps = messages.map(message => ({
      ...message,
      created_at: message.created_at || now,
      updated_at: message.updated_at || now,
      sent_at: message.sent_at || now
    }));
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messagesWithTimestamps)
      .select();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createBatchMessages:', error);
    throw error;
  }
};

/**
 * Get messages by blast ID
 * @param {UUID} blastId - Text blast ID
 * @returns {Promise<Array>} Array of message records
 */
exports.getMessagesByBlastId = async (blastId) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, recipient:recipient_id(*)')
      .eq('blast_id', blastId)
      .order('sent_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getMessagesByBlastId:', error);
    throw error;
  }
};

/**
 * Create a message template
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Created template record
 */
exports.createTemplate = async (templateData) => {
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .insert(templateData)
      .select();
    
    if (error) {
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Error in createTemplate:', error);
    throw error;
  }
};

/**
 * Get all templates
 * @param {Object} filters - Optional query filters
 * @param {String} filters.templateType - Filter by template type
 * @param {UUID} filters.userId - Filter by user ID
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of template records
 */
exports.getAllTemplates = async (filters = {}, pagination = { page: 0, pageSize: 10 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('message_templates')
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.templateType) {
      query = query.eq('template_type', filters.templateType);
    }
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getAllTemplates:', error);
    throw error;
  }
};

/**
 * Get template by ID
 * @param {UUID} id - Template ID
 * @returns {Promise<Object>} Template record
 */
exports.getTemplateById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getTemplateById:', error);
    throw error;
  }
};

/**
 * Update a template
 * @param {UUID} id - Template ID
 * @param {Object} templateData - Template data to update
 * @returns {Promise<Object>} Updated template record
 */
exports.updateTemplate = async (id, templateData) => {
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .update(templateData)
      .eq('id', id)
      .select();
    
    if (error) {
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Error in updateTemplate:', error);
    throw error;
  }
};

/**
 * Delete a template
 * @param {UUID} id - Template ID
 * @returns {Promise<Boolean>} True if successful
 */
exports.deleteTemplate = async (id) => {
  try {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteTemplate:', error);
    throw error;
  }
};

/**
 * Get messaging statistics
 * @param {String} dateFrom - Start date for statistics
 * @param {String} dateTo - End date for statistics
 * @param {UUID} userId - Filter by user ID
 * @returns {Promise<Object>} Messaging statistics
 */
exports.getMessagingStats = async (dateFrom, dateTo, userId) => {
  try {
    // Prepare query for messages
    let messageQuery = supabase
      .from('messages')
      .select('*');
    
    // Apply date filters if provided
    if (dateFrom) {
      messageQuery = messageQuery.gte('sent_at', dateFrom);
    }
    
    if (dateTo) {
      messageQuery = messageQuery.lte('sent_at', dateTo);
    }
    
    // Apply user filter if provided
    if (userId) {
      messageQuery = messageQuery.eq('sender_id', userId);
    }
    
    // Execute query
    const { data: messages, error: messageError } = await messageQuery;
    
    if (messageError) {
      throw messageError;
    }
    
    // Prepare query for text blasts
    let blastQuery = supabase
      .from('text_blasts')
      .select('*');
    
    // Apply date filters if provided
    if (dateFrom) {
      blastQuery = blastQuery.gte('created_at', dateFrom);
    }
    
    if (dateTo) {
      blastQuery = blastQuery.lte('created_at', dateTo);
    }
    
    // Apply user filter if provided
    if (userId) {
      blastQuery = blastQuery.eq('sender_id', userId);
    }
    
    // Execute query
    const { data: blasts, error: blastError } = await blastQuery;
    
    if (blastError) {
      throw blastError;
    }
    
    // Calculate statistics
    const totalMessages = messages.length;
    
    // Count messages by type
    const messagesByType = {};
    messages.forEach(message => {
      const type = message.message_type;
      messagesByType[type] = (messagesByType[type] || 0) + 1;
    });
    
    // Count messages by status
    const messagesByStatus = {};
    messages.forEach(message => {
      const status = message.status;
      messagesByStatus[status] = (messagesByStatus[status] || 0) + 1;
    });
    
    // Calculate response rate
    const messagesWithResponse = messages.filter(message => message.has_response).length;
    const responseRate = totalMessages > 0 ? (messagesWithResponse / totalMessages) * 100 : 0;
    
    // Calculate blast statistics
    const totalBlasts = blasts.length;
    const totalBlastRecipients = blasts.reduce((sum, blast) => sum + blast.recipient_count, 0);
    const totalBlastMessagesSent = blasts.reduce((sum, blast) => sum + (blast.sent_count || 0), 0);
    const blastDeliveryRate = totalBlastRecipients > 0 ? (totalBlastMessagesSent / totalBlastRecipients) * 100 : 0;
    
    // Compile statistics
    const stats = {
      totalMessages,
      messagesByType,
      messagesByStatus,
      responseRate,
      textBlasts: {
        totalBlasts,
        totalRecipients: totalBlastRecipients,
        totalMessagesSent: totalBlastMessagesSent,
        deliveryRate: blastDeliveryRate
      },
      dateRange: {
        from: dateFrom,
        to: dateTo
      }
    };
    
    return stats;
  } catch (error) {
    console.error('Error in getMessagingStats:', error);
    throw error;
  }
}; 