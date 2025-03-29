/**
 * Message Model Tests
 */
const messageModel = require('../../models/messageModel');
const { generateMessage } = require('../../utils/testDataGenerator');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../../config/supabase');

// Mock Supabase
jest.mock('../../config/supabase', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis()
}));

describe('Message Model', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });
  
  describe('getAllMessages', () => {
    it('should retrieve all messages without filters', async () => {
      // Mock data
      const senderId = uuidv4();
      const recipientId = uuidv4();
      const mockMessages = [
        generateMessage(senderId, recipientId),
        generateMessage(senderId, recipientId)
      ];
      
      // Setup the mock return value
      supabase.range.mockImplementation(() => ({
        data: mockMessages,
        error: null
      }));
      
      // Call the function
      const result = await messageModel.getAllMessages();
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.order).toHaveBeenCalledWith('sent_at', { ascending: false });
      expect(supabase.range).toHaveBeenCalledWith(0, 49);
      expect(result).toEqual(mockMessages);
    });
    
    it('should apply filters correctly', async () => {
      // Mock data
      const senderId = uuidv4();
      const recipientId = uuidv4();
      const messageType = 'sms';
      const mockMessages = [
        generateMessage(senderId, recipientId, { message_type: messageType, sent_at: new Date().toISOString() })
      ];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockMessages,
        error: null
      }));
      
      // Call with filters
      const filters = {
        senderId,
        recipientId,
        messageType,
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };
      
      await messageModel.getAllMessages(filters);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('sender_id', senderId);
      expect(supabase.eq).toHaveBeenCalledWith('recipient_id', recipientId);
      expect(supabase.eq).toHaveBeenCalledWith('message_type', messageType);
      expect(supabase.gte).toHaveBeenCalledWith('sent_at', filters.startDate);
      expect(supabase.lte).toHaveBeenCalledWith('sent_at', filters.endDate);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.range.mockImplementation(() => ({
        data: null,
        error: new Error('Database error')
      }));
      
      // Call and expect rejection
      await expect(messageModel.getAllMessages()).rejects.toThrow('Database error');
    });
  });
  
  describe('getMessageById', () => {
    it('should retrieve a message by ID', async () => {
      // Mock data
      const senderId = uuidv4();
      const recipientId = uuidv4();
      const mockMessage = generateMessage(senderId, recipientId);
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: mockMessage,
        error: null
      }));
      
      // Call the function
      const result = await messageModel.getMessageById(mockMessage.id);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', mockMessage.id);
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockMessage);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.single.mockImplementation(() => ({
        data: null,
        error: new Error('Message not found')
      }));
      
      // Call and expect rejection
      await expect(messageModel.getMessageById('invalid-id')).rejects.toThrow('Message not found');
    });
  });
  
  describe('getConversation', () => {
    it('should retrieve a conversation between two people', async () => {
      // Mock data
      const senderId = uuidv4();
      const recipientId = uuidv4();
      const mockMessages = [
        generateMessage(senderId, recipientId),
        generateMessage(recipientId, senderId)
      ];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockMessages,
        error: null
      }));
      
      // Call the function
      const result = await messageModel.getConversation(senderId, recipientId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.order).toHaveBeenCalledWith('sent_at', { ascending: false });
      expect(result).toEqual(mockMessages);
    });
  });
  
  describe('createMessage', () => {
    it('should create a new message', async () => {
      // Mock data
      const messageData = {
        sender_id: uuidv4(),
        recipient_id: uuidv4(),
        message_type: 'sms',
        content: 'Test message content'
      };
      
      const createdMessage = {
        id: uuidv4(),
        ...messageData,
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: createdMessage,
        error: null
      }));
      
      // Call the function
      const result = await messageModel.createMessage(messageData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        sender_id: messageData.sender_id,
        recipient_id: messageData.recipient_id,
        message_type: messageData.message_type,
        content: messageData.content
      }));
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(createdMessage);
    });
    
    it('should reject if required fields are missing', async () => {
      // Call with missing required fields
      const messageData = {
        sender_id: uuidv4(),
        // Missing recipient_id, message_type, and content
      };
      
      // Call and expect rejection
      await expect(messageModel.createMessage(messageData))
        .rejects.toThrow('sender_id, recipient_id, message_type, and content are required');
    });
  });
  
  describe('updateMessage', () => {
    it('should update an existing message', async () => {
      // Mock data
      const messageId = uuidv4();
      const updateData = {
        status: 'delivered',
        delivered_at: new Date().toISOString()
      };
      
      const updatedMessage = {
        id: messageId,
        sender_id: uuidv4(),
        recipient_id: uuidv4(),
        message_type: 'sms',
        content: 'Test message content',
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: updatedMessage,
        error: null
      }));
      
      // Call the function
      const result = await messageModel.updateMessage(messageId, updateData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.update).toHaveBeenCalledWith(updateData);
      expect(supabase.eq).toHaveBeenCalledWith('id', messageId);
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(updatedMessage);
    });
  });
  
  describe('deleteMessage', () => {
    it('should delete a message', async () => {
      // Mock data
      const messageId = uuidv4();
      
      // Setup the mock
      supabase.delete.mockImplementation(() => ({
        error: null
      }));
      
      // Call the function
      const result = await messageModel.deleteMessage(messageId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', messageId);
      expect(result).toBe(true);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.delete.mockImplementation(() => ({
        error: new Error('Delete failed')
      }));
      
      // Call and expect rejection
      await expect(messageModel.deleteMessage('invalid-id')).rejects.toThrow('Delete failed');
    });
  });
  
  describe('markMessageAsRead', () => {
    it('should mark a message as read', async () => {
      // Mock data
      const messageId = uuidv4();
      const readAt = new Date().toISOString();
      
      const updatedMessage = {
        id: messageId,
        status: 'read',
        read_at: readAt
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: updatedMessage,
        error: null
      }));
      
      // Call the function
      const result = await messageModel.markMessageAsRead(messageId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'read',
        read_at: expect.any(String)
      }));
      expect(supabase.eq).toHaveBeenCalledWith('id', messageId);
      expect(result).toEqual(updatedMessage);
    });
  });
  
  describe('createTextBlast', () => {
    it('should create a text blast with multiple messages', async () => {
      // Mock data
      const senderId = uuidv4();
      const recipientIds = [uuidv4(), uuidv4(), uuidv4()];
      const blastData = {
        sender_id: senderId,
        recipients: recipientIds,
        message_type: 'sms',
        content: 'Blast message content',
        personalization: {
          greeting: 'Hello, {{first_name}}!'
        }
      };
      
      const blastId = uuidv4();
      const createdMessages = recipientIds.map(recipientId => ({
        id: uuidv4(),
        sender_id: senderId,
        recipient_id: recipientId,
        message_type: 'sms',
        content: 'Blast message content',
        is_blast: true,
        blast_id: blastId,
        personalization_data: blastData.personalization,
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      // Setup the mock
      supabase.select.mockImplementation(() => ({
        data: createdMessages,
        error: null
      }));
      
      // Call the function
      const result = await messageModel.createTextBlast(blastData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(createdMessages);
    });
    
    it('should reject if required fields are missing', async () => {
      // Call with missing required fields
      const blastData = {
        sender_id: uuidv4(),
        // Missing recipients, message_type, and content
      };
      
      // Call and expect rejection
      await expect(messageModel.createTextBlast(blastData))
        .rejects.toThrow('sender_id, recipients, message_type, and content are required');
    });
  });
  
  describe('getUnreadMessageCount', () => {
    it('should get the count of unread messages for a recipient', async () => {
      // Mock data
      const recipientId = uuidv4();
      const unreadCount = 5;
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: Array(unreadCount).fill({}),
        count: unreadCount,
        error: null
      }));
      
      // Call the function
      const result = await messageModel.getUnreadMessageCount(recipientId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('recipient_id', recipientId);
      expect(supabase.eq).toHaveBeenCalledWith('status', 'delivered');
      expect(result).toBe(unreadCount);
    });
  });
}); 