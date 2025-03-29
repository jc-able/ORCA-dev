/**
 * Telnyx API Configuration
 * 
 * Configuration for Telnyx integration for SMS messaging
 */

const telnyx = require('telnyx');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Telnyx API key and configuration
 * 
 * Environment variables needed:
 * - TELNYX_API_KEY: The API key for Telnyx
 * - TELNYX_MESSAGING_PROFILE_ID: The messaging profile ID
 * - TELNYX_NUMBER: The phone number to send from
 * 
 * For local development, create a .env file with these variables
 * In production, they will be set in the hosting platform (Vercel)
 */
const telnyxApiKey = process.env.TELNYX_API_KEY || 'placeholder-api-key';
const telnyxMessagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID || 'placeholder-profile-id';
const telnyxNumber = process.env.TELNYX_NUMBER || '+15555555555';

// Log a warning if using fallback values
if (
  telnyxApiKey === 'placeholder-api-key' || 
  telnyxMessagingProfileId === 'placeholder-profile-id' || 
  telnyxNumber === '+15555555555'
) {
  console.warn('Using fallback Telnyx credentials. Please check your server .env file.');
}

// Initialize Telnyx client
const telnyxClient = telnyx(telnyxApiKey);

/**
 * Send SMS using Telnyx API
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} message - Message content
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Message sending result
 */
const sendSMS = async (to, message, options = {}) => {
  try {
    // Normalize phone number to E.164 format if not already
    const normalizedTo = to.startsWith('+') ? to : `+${to}`;
    
    // Basic validation
    if (!normalizedTo.match(/^\+\d{10,15}$/)) {
      throw new Error('Invalid phone number format. Must be E.164 format (e.g., +15555555555)');
    }
    
    if (!message || message.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }
    
    // Send message using Telnyx
    const messageResponse = await telnyxClient.messages.create({
      from: options.from || telnyxNumber,
      to: normalizedTo,
      text: message,
      messaging_profile_id: options.messagingProfileId || telnyxMessagingProfileId,
      // Optional webhook URL for delivery status
      webhook_url: options.webhookUrl,
      // Optional webhook failover URL
      webhook_failover_url: options.webhookFailoverUrl
    });
    
    return {
      success: true,
      messageId: messageResponse.data.id,
      to: normalizedTo,
      status: messageResponse.data.status,
      details: messageResponse.data
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

/**
 * Send bulk SMS using Telnyx API
 * @param {Array<string>} recipients - Array of recipient phone numbers (E.164 format)
 * @param {string} message - Message content
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Bulk sending results
 */
const sendBulkSMS = async (recipients, message, options = {}) => {
  try {
    // Basic validation
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients must be a non-empty array');
    }
    
    if (!message || message.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }
    
    // Process in batches of 50 to avoid rate limits
    const batchSize = options.batchSize || 50;
    const results = [];
    const errors = [];
    
    // Process in sequential batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // Process each recipient in the batch
      const batchPromises = batch.map(async (recipient) => {
        try {
          const result = await sendSMS(recipient, message, options);
          results.push(result);
          return result;
        } catch (error) {
          const errorResult = {
            success: false,
            to: recipient,
            error: error.message,
            details: error
          };
          errors.push(errorResult);
          return errorResult;
        }
      });
      
      await Promise.all(batchPromises);
      
      // If there are more batches, add a small delay to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return {
      success: errors.length === 0,
      total: recipients.length,
      successful: results.filter(r => r.success).length,
      failed: errors.length,
      results,
      errors
    };
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  telnyxClient,
  telnyxNumber,
  telnyxMessagingProfileId
}; 