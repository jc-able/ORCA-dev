/**
 * Messaging Routes
 * Handles messaging-related API endpoints (SMS, Email, Text Blast)
 */
const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all messaging routes
router.use(authMiddleware.protect);

// GET /api/messaging/messages - Get all messages
// POST /api/messaging/messages - Send a new message
router
  .route('/messages')
  .get(messagingController.getAllMessages)
  .post(messagingController.sendMessage);

// GET /api/messaging/messages/:id - Get message by ID
router.get('/messages/:id', messagingController.getMessageById);

// GET /api/messaging/conversation/:personId - Get conversation with a specific person
router.get('/conversation/:personId', messagingController.getConversation);

// SMS Routes
// POST /api/messaging/sms - Send an SMS
router.post('/sms', messagingController.sendSMS);

// Email Routes
// POST /api/messaging/email - Send an email
router.post('/email', messagingController.sendEmail);

// Text Blast Routes
// POST /api/messaging/blast - Send a text blast to multiple recipients
router.post('/blast', messagingController.sendTextBlast);

// GET /api/messaging/blast - Get all text blasts
router.get('/blast', messagingController.getAllTextBlasts);

// GET /api/messaging/blast/:id - Get text blast by ID
router.get('/blast/:id', messagingController.getTextBlastById);

// GET /api/messaging/templates - Get all message templates
// POST /api/messaging/templates - Create a new template
router
  .route('/templates')
  .get(messagingController.getAllTemplates)
  .post(messagingController.createTemplate);

// GET /api/messaging/templates/:id - Get template by ID
// PATCH /api/messaging/templates/:id - Update template
// DELETE /api/messaging/templates/:id - Delete template
router
  .route('/templates/:id')
  .get(messagingController.getTemplateById)
  .patch(messagingController.updateTemplate)
  .delete(messagingController.deleteTemplate);

// GET /api/messaging/stats - Get messaging statistics
router.get('/stats', authMiddleware.restrictTo('admin'), messagingController.getMessagingStats);

module.exports = router; 