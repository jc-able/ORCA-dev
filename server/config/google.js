/**
 * Google API Configuration
 * 
 * Configuration for Google Calendar and Gmail API integrations
 */

const { google } = require('googleapis');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Google API credentials
 * 
 * Environment variables needed:
 * - GOOGLE_CLIENT_ID: OAuth client ID
 * - GOOGLE_CLIENT_SECRET: OAuth client secret
 * - GOOGLE_REDIRECT_URI: OAuth redirect URI
 * - GOOGLE_API_KEY: API key for public endpoints
 * 
 * For local development, create a .env file with these variables
 * In production, they will be set in the hosting platform (Vercel)
 */
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder-client-secret',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/auth/google-callback',
  apiKey: process.env.GOOGLE_API_KEY || 'placeholder-api-key'
};

// Log a warning if using fallback values
if (
  googleConfig.clientId === 'placeholder-client-id' || 
  googleConfig.clientSecret === 'placeholder-client-secret' || 
  googleConfig.apiKey === 'placeholder-api-key'
) {
  console.warn('Using fallback Google API credentials. Please check your server .env file.');
}

/**
 * Create a Google OAuth client
 * @returns {Object} OAuth2 client
 */
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    googleConfig.redirectUri
  );
};

/**
 * Get an OAuth URL for user authorization
 * @param {string} userId - User ID for state parameter
 * @returns {string} Authorization URL
 */
const getGoogleAuthUrl = (userId) => {
  const oauth2Client = createOAuth2Client();
  
  // Generate a URL that asks for permissions for both Calendar and Gmail
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get a refresh token
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose'
    ],
    // Pass the user ID in the state parameter to associate the tokens with the user
    state: userId
  });
};

/**
 * Exchange an authorization code for tokens
 * @param {string} code - Authorization code
 * @returns {Promise<Object>} Tokens object
 */
const getGoogleTokens = async (code) => {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error getting Google tokens:', error);
    throw error;
  }
};

/**
 * Create an authenticated Google Calendar client
 * @param {Object} tokens - OAuth tokens
 * @returns {Object} Calendar client
 */
const getCalendarClient = (tokens) => {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);
    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.error('Error creating Calendar client:', error);
    throw error;
  }
};

/**
 * Create an authenticated Gmail client
 * @param {Object} tokens - OAuth tokens
 * @returns {Object} Gmail client
 */
const getGmailClient = (tokens) => {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);
    return google.gmail({ version: 'v1', auth: oauth2Client });
  } catch (error) {
    console.error('Error creating Gmail client:', error);
    throw error;
  }
};

/**
 * Get available time slots from a user's calendar
 * @param {Object} tokens - OAuth tokens
 * @param {Object} options - Options for finding availability
 * @returns {Promise<Array>} Available time slots
 */
const getAvailableTimeSlots = async (tokens, options) => {
  try {
    const { 
      startDate, 
      endDate, 
      durationMinutes = 60, 
      timezone = 'America/New_York', 
      workHoursStart = 9, 
      workHoursEnd = 17,
      calendarId = 'primary'
    } = options;
    
    // Basic validation
    if (!startDate || !endDate) {
      throw new Error('Start and end dates are required');
    }
    
    // Create a Calendar client
    const calendar = getCalendarClient(tokens);
    
    // Get busy times
    const busyTimesResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        timeZone: timezone,
        items: [{ id: calendarId }]
      }
    });
    
    const busySlots = busyTimesResponse.data.calendars[calendarId].busy || [];
    
    // Calculate available slots
    const availableSlots = [];
    let currentDay = new Date(startDate);
    const endDay = new Date(endDate);
    
    // Process each day in the range
    while (currentDay <= endDay) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDay.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Set start and end time for the current day
        const dayStart = new Date(currentDay);
        dayStart.setHours(workHoursStart, 0, 0, 0);
        
        const dayEnd = new Date(currentDay);
        dayEnd.setHours(workHoursEnd, 0, 0, 0);
        
        // Check each potential time slot
        let slotStart = new Date(dayStart);
        
        while (slotStart < dayEnd) {
          // Calculate slot end time
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + durationMinutes);
          
          // Check if this slot overlaps with any busy times
          const isOverlapping = busySlots.some(busySlot => {
            const busyStart = new Date(busySlot.start);
            const busyEnd = new Date(busySlot.end);
            return (slotStart < busyEnd && slotEnd > busyStart);
          });
          
          // If not overlapping, add to available slots
          if (!isOverlapping && slotEnd <= dayEnd) {
            availableSlots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString()
            });
          }
          
          // Move to next potential slot (30-minute increments)
          slotStart = new Date(slotStart);
          slotStart.setMinutes(slotStart.getMinutes() + 30);
        }
      }
      
      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
      currentDay = new Date(currentDay);
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw error;
  }
};

/**
 * Create a calendar event
 * @param {Object} tokens - OAuth tokens
 * @param {Object} eventDetails - Event details
 * @returns {Promise<Object>} Created event
 */
const createCalendarEvent = async (tokens, eventDetails) => {
  try {
    const { 
      summary, 
      description, 
      startDateTime, 
      endDateTime, 
      attendees = [],
      location = '',
      timezone = 'America/New_York',
      calendarId = 'primary',
      sendInvites = true
    } = eventDetails;
    
    // Basic validation
    if (!summary || !startDateTime || !endDateTime) {
      throw new Error('Event summary, start time, and end time are required');
    }
    
    // Create a Calendar client
    const calendar = getCalendarClient(tokens);
    
    // Create the event
    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: timezone
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: timezone
      },
      attendees: attendees.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 } // 30 minutes before
        ]
      }
    };
    
    const createdEvent = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: sendInvites ? 'all' : 'none'
    });
    
    return createdEvent.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

/**
 * Send an email using Gmail API
 * @param {Object} tokens - OAuth tokens
 * @param {Object} emailDetails - Email details
 * @returns {Promise<Object>} Sent message
 */
const sendEmail = async (tokens, emailDetails) => {
  try {
    const { 
      to, 
      subject, 
      body, 
      cc = [], 
      bcc = [],
      attachments = []
    } = emailDetails;
    
    // Basic validation
    if (!to || !subject || !body) {
      throw new Error('To, subject, and body are required');
    }
    
    // Create a Gmail client
    const gmail = getGmailClient(tokens);
    
    // Build email content
    const emailLines = [];
    emailLines.push(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
    
    if (cc.length > 0) {
      emailLines.push(`Cc: ${cc.join(', ')}`);
    }
    
    if (bcc.length > 0) {
      emailLines.push(`Bcc: ${bcc.join(', ')}`);
    }
    
    emailLines.push(`Subject: ${subject}`);
    emailLines.push('Content-Type: text/html; charset=utf-8');
    emailLines.push('MIME-Version: 1.0');
    emailLines.push('');
    emailLines.push(body);
    
    // Convert to base64 encoded string
    const email = emailLines.join('\r\n').trim();
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // Send the email
    const sentMessage = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    return sentMessage.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  getGoogleAuthUrl,
  getGoogleTokens,
  getCalendarClient,
  getGmailClient,
  getAvailableTimeSlots,
  createCalendarEvent,
  sendEmail,
  googleConfig
}; 