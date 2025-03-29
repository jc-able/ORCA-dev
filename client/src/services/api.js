/**
 * API Service
 * 
 * This service handles all communication with the backend API
 * It provides methods for fetching, creating, updating, and deleting data
 */

import axios from 'axios';
import ErrorHandler, { ErrorTypes } from './errorHandler';
import { fetchLeadsData, fetchReferralNetwork } from './supabaseClient';
import { apiConfig, featureFlags, dbConfig } from '../utils/envHelper';
import { withApiKey } from '../utils/supabaseUtils';
import { supabase } from './supabaseClient';
import { 
  validatePerson, 
  validateLeadExtension, 
  validateReferralExtension,
  validateMemberExtension,
  validateRelationship,
  validateInteraction,
  validateMessage
} from '../utils/validationUtils';

// Create axios instance with default config
const api = axios.create({
  baseURL: apiConfig.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: apiConfig.timeout,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('orca_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For Supabase routes, ensure API key is included
    if (config.url?.includes('supabase') || config.baseURL?.includes('supabase')) {
      // Add Supabase anon key as apikey header
      if (dbConfig.supabaseKey && dbConfig.supabaseKey !== 'placeholder-key') {
        config.headers['apikey'] = dbConfig.supabaseKey;
        console.log('Added apikey header to request');
      } else {
        console.error('No valid Supabase API key available for request');
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific Supabase API key errors
    if (error.response?.data?.message === "No API key found in request" || 
        error.response?.data?.hint?.includes('apikey')) {
      console.error('Supabase API key error:', error.response.data);
      
      // If we have valid credentials but the request still failed, try adding the key directly
      if (dbConfig.hasValidCredentials()) {
        const originalRequest = error.config;
        
        // Only retry once to avoid infinite loops
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest.headers['apikey'] = dbConfig.supabaseKey;
          
          console.log('Retrying request with explicit API key');
          return axios(originalRequest);
        }
      }
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('orca_auth_token');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Wrapper for API requests that includes error handling
 * @param {Function} apiCall - The API call function to execute
 * @param {string} resource - The resource name for error context
 * @param {boolean} retryOnNetwork - Whether to retry on network errors
 * @returns {Promise} - The API response with standardized format
 */
const apiRequest = async (apiCall, resource, retryOnNetwork = true) => {
  try {
    // Retry network errors if enabled
    if (retryOnNetwork) {
      const response = await ErrorHandler.retryWithBackoff(apiCall, 2, 500);
      return { success: true, data: response.data };
    } else {
      const response = await apiCall();
      return { success: true, data: response.data };
    }
  } catch (error) {
    return ErrorHandler.handleApiError(error, resource);
  }
};

/**
 * API Services for Lead Management
 */
export const LeadAPI = {
  // Get all leads with optional filters
  getLeads: async (filters = {}, page = 1, limit = 20) => {
    try {
      // First try the API endpoint
      const personFilters = { 
        ...filters,
        is_lead: 'true' // API expects string 'true' rather than boolean true
      };
      
      const result = await apiRequest(
        () => api.get('/persons', { params: { ...personFilters, page, limit } }), 
        'leads'
      );
      
      if (result.success) {
        return result;
      } else if (featureFlags.enableDirectDbAccess) {
        // If API fails and direct DB access is enabled, fall back to direct Supabase query
        console.info("API call failed, falling back to direct Supabase query");
        const supabaseResult = await fetchLeadsData({ filters, page, limit });
        return { success: true, data: supabaseResult };
      } else {
        // If direct DB access is disabled, return the original error
        return result;
      }
    } catch (error) {
      console.error("API error fetching leads:", error);
      
      // Try direct DB access if enabled
      if (featureFlags.enableDirectDbAccess) {
        try {
          const supabaseResult = await fetchLeadsData({ filters, page, limit });
          return { success: true, data: supabaseResult };
        } catch (dbError) {
          console.error("Direct Supabase query also failed:", dbError);
        }
      }
      
      // Return an error response
      return { 
        success: false, 
        error: "Failed to fetch leads", 
        errorDetails: error 
      };
    }
  },

  // Get a specific lead by ID
  getLead: async (id) => {
    return apiRequest(
      () => api.get(`/persons/${id}`), 
      'lead'
    );
  },

  // Create a new lead
  createLead: async (leadData) => {
    try {
      // Validate person data first
      const personDataRaw = {
        first_name: leadData.first_name || leadData.person?.first_name,
        last_name: leadData.last_name || leadData.person?.last_name,
        email: leadData.email || leadData.person?.email,
        phone: leadData.phone || leadData.person?.phone,
        is_lead: true,
        assigned_to: leadData.assigned_to
      };
      
      const personValidation = validatePerson(personDataRaw);
      if (!personValidation.isValid) {
        return {
          success: false,
          error: "Invalid person data",
          validationErrors: personValidation.errors
        };
      }
      
      // Validate lead extension data if provided
      let leadExtensionValidation = { isValid: true, data: {} };
      if (leadData.lead_extensions && leadData.lead_extensions.length > 0) {
        leadExtensionValidation = validateLeadExtension(leadData.lead_extensions[0]);
        if (!leadExtensionValidation.isValid) {
          return {
            success: false,
            error: "Invalid lead extension data",
            validationErrors: leadExtensionValidation.errors
          };
        }
      }
      
      // First try the API endpoint
      const result = await apiRequest(
        () => api.post('/persons', { 
          ...personValidation.data, 
          is_lead: true,
          lead_extensions: leadExtensionValidation.isValid ? [leadExtensionValidation.data] : undefined
        }), 
        'lead'
      );
      
      if (result.success) {
        return result;
      } else if (featureFlags.enableDirectDbAccess) {
        // If API fails, fall back to direct Supabase query with our utility
        console.info("API call failed, falling back to direct Supabase query for lead creation");
        
        // Format data properly for direct Supabase insert
        const personData = {
          ...personValidation.data,
          is_lead: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Insert person with API key
        const { data: person, error: personError } = await withApiKey(() => 
          supabase
            .from('persons')
            .insert(personData)
            .select()
        );
        
        if (personError) {
          console.error("Error creating person:", personError);
          throw personError;
        }
        
        const personId = person[0].id;
        
        // Insert lead extension with API key
        const leadExtensionData = {
          person_id: personId,
          ...(leadExtensionValidation.data || {}),
          lead_status: leadExtensionValidation.data?.lead_status || 'New',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: extension, error: extensionError } = await withApiKey(() =>
          supabase
            .from('lead_extensions')
            .insert(leadExtensionData)
            .select()
        );
        
        if (extensionError) {
          console.error("Error creating lead extension:", extensionError);
          // We can still return the person data even if extension fails
        }
        
        const newLead = {
          ...person[0],
          lead_extensions: extension || [{ lead_status: 'New' }]
        };
        
        return { success: true, data: newLead };
      } else {
        // If direct DB access is disabled, return the original error
        return result;
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      return { 
        success: false, 
        error: "Failed to create lead", 
        errorDetails: error 
      };
    }
  },

  // Update an existing lead
  updateLead: async (id, leadData) => {
    try {
      // Validate the data first
      const personValidation = validatePerson(leadData);
      if (!personValidation.isValid) {
        return {
          success: false,
          error: "Invalid person data",
          validationErrors: personValidation.errors
        };
      }
      
      // Validate lead extension data if provided
      if (leadData.lead_extensions && leadData.lead_extensions.length > 0) {
        const leadExtensionValidation = validateLeadExtension(leadData.lead_extensions[0]);
        if (!leadExtensionValidation.isValid) {
          return {
            success: false,
            error: "Invalid lead extension data",
            validationErrors: leadExtensionValidation.errors
          };
        }
        // Update with validated data
        leadData.lead_extensions[0] = leadExtensionValidation.data;
      }
      
      return apiRequest(
        () => api.put(`/persons/${id}`, personValidation.data), 
        'lead'
      );
    } catch (error) {
      console.error("Error updating lead:", error);
      return {
        success: false,
        error: "Failed to update lead",
        errorDetails: error
      };
    }
  },

  // Delete a lead
  deleteLead: async (id) => {
    return apiRequest(
      () => api.delete(`/persons/${id}`), 
      'lead',
      false // Don't retry deletes automatically
    );
  },

  // Update lead status (stage in pipeline)
  updateLeadStatus: async (id, status) => {
    // Update lead_extensions directly
    return apiRequest(
      () => api.patch(`/persons/${id}`, { 
        lead_extensions: [{ lead_status: status }] 
      }), 
      'lead status'
    );
  }
};

/**
 * API Services for Referral Management
 */
export const ReferralAPI = {
  // Get all referrals with optional filters
  getReferrals: async (filters = {}, page = 1, limit = 20) => {
    const params = { page, limit, ...filters };
    return apiRequest(
      () => api.get('/referrals', { params }), 
      'referrals'
    );
  },

  // Get a specific referral by ID
  getReferral: async (id) => {
    return apiRequest(
      () => api.get(`/referrals/${id}`), 
      'referral'
    );
  },

  // Create a new referral
  createReferral: async (referralData) => {
    try {
      // Validate person data first
      const personDataRaw = {
        first_name: referralData.first_name || referralData.person?.first_name,
        last_name: referralData.last_name || referralData.person?.last_name,
        email: referralData.email || referralData.person?.email,
        phone: referralData.phone || referralData.person?.phone,
        is_referral: true
      };
      
      const personValidation = validatePerson(personDataRaw);
      if (!personValidation.isValid) {
        return {
          success: false,
          error: "Invalid person data",
          validationErrors: personValidation.errors
        };
      }
      
      // Validate referral extension data if provided
      let referralExtensionValidation = { isValid: true, data: {} };
      if (referralData.referral_extensions && referralData.referral_extensions.length > 0) {
        referralExtensionValidation = validateReferralExtension(referralData.referral_extensions[0]);
        if (!referralExtensionValidation.isValid) {
          return {
            success: false,
            error: "Invalid referral extension data",
            validationErrors: referralExtensionValidation.errors
          };
        }
      }
      
      // Use validated data for the API call
      return apiRequest(
        () => api.post('/referrals', {
          ...personValidation.data,
          referral_extensions: referralExtensionValidation.isValid ? [referralExtensionValidation.data] : undefined
        }), 
        'referral'
      );
    } catch (error) {
      console.error("Error creating referral:", error);
      return {
        success: false,
        error: "Failed to create referral",
        errorDetails: error
      };
    }
  },

  // Update an existing referral
  updateReferral: async (id, referralData) => {
    try {
      // Validate the data first
      const personValidation = validatePerson(referralData);
      if (!personValidation.isValid) {
        return {
          success: false,
          error: "Invalid person data",
          validationErrors: personValidation.errors
        };
      }
      
      // Validate referral extension data if provided
      if (referralData.referral_extensions && referralData.referral_extensions.length > 0) {
        const referralExtensionValidation = validateReferralExtension(referralData.referral_extensions[0]);
        if (!referralExtensionValidation.isValid) {
          return {
            success: false,
            error: "Invalid referral extension data",
            validationErrors: referralExtensionValidation.errors
          };
        }
        // Update with validated data
        referralData.referral_extensions[0] = referralExtensionValidation.data;
      }
      
      return apiRequest(
        () => api.put(`/referrals/${id}`, personValidation.data), 
        'referral'
      );
    } catch (error) {
      console.error("Error updating referral:", error);
      return {
        success: false,
        error: "Failed to update referral",
        errorDetails: error
      };
    }
  },

  // Generate a referral link
  generateReferralLink: async (referrerId, referrerName) => {
    return apiRequest(
      () => api.post('/persons/referral-link', { referrerId, referrerName }), 
      'referral link'
    );
  },

  // Get referral network for visualization
  getReferralNetwork: async (personId, levels = 3) => {
    try {
      // First try the API endpoint
      const result = await apiRequest(
        () => api.get(`/relationships/network/${personId}`, { params: { levels } }), 
        'referral network'
      );
      
      if (result.success) {
        return result;
      } else if (featureFlags.enableDirectDbAccess) {
        // If API fails and direct DB access is enabled, fall back to direct Supabase query
        console.info("API call failed, falling back to direct Supabase query for referral network");
        const networkData = await fetchReferralNetwork(personId, levels);
        return { success: true, data: networkData };
      } else {
        // If direct DB access is disabled, return the original error
        return result;
      }
    } catch (error) {
      console.error("API error fetching referral network:", error);
      
      // Try direct DB access if enabled
      if (featureFlags.enableDirectDbAccess) {
        try {
          const networkData = await fetchReferralNetwork(personId, levels);
          return { success: true, data: networkData };
        } catch (dbError) {
          console.error("Direct Supabase query for referral network also failed:", dbError);
        }
      }
      
      // Return an error response
      return { 
        success: false, 
        error: "Failed to fetch referral network", 
        errorDetails: error 
      };
    }
  }
};

/**
 * API Services for Member Management
 */
export const MemberAPI = {
  // Get all members with optional filters
  getMembers: async (filters = {}, page = 1, limit = 20) => {
    const params = { page, limit, ...filters };
    return apiRequest(
      () => api.get('/members', { params }), 
      'members'
    );
  },

  // Get a specific member by ID
  getMember: async (id) => {
    return apiRequest(
      () => api.get(`/members/${id}/profile`), 
      'member profile'
    );
  },

  // Convert a person to a member
  convertToMember: async (personId, memberData) => {
    try {
      // Validate member extension data
      const memberExtensionValidation = validateMemberExtension(memberData);
      if (!memberExtensionValidation.isValid) {
        return {
          success: false,
          error: "Invalid member data",
          validationErrors: memberExtensionValidation.errors
        };
      }
      
      return apiRequest(
        () => api.post(`/members/convert/${personId}`, memberExtensionValidation.data), 
        'member conversion'
      );
    } catch (error) {
      console.error("Error converting to member:", error);
      return {
        success: false,
        error: "Failed to convert to member",
        errorDetails: error
      };
    }
  },

  // Get member's referrals
  getMemberReferrals: async (id, page = 1, limit = 20) => {
    const params = { page, limit };
    return apiRequest(
      () => api.get(`/members/${id}/referrals`, { params }), 
      'member referrals'
    );
  },

  // Record a member check-in
  recordCheckIn: async (id) => {
    return apiRequest(
      () => api.post(`/members/${id}/check-in`), 
      'member check-in'
    );
  },

  // Get member financial summary
  getMemberFinancials: async (id) => {
    return apiRequest(
      () => api.get(`/members/${id}/financials`), 
      'member financials'
    );
  },

  // Get member engagement metrics
  getMemberEngagement: async (id) => {
    return apiRequest(
      () => api.get(`/members/${id}/engagement`), 
      'member engagement'
    );
  }
};

/**
 * API Services for Messaging
 */
export const MessagingAPI = {
  // Send an individual SMS
  sendSMS: async (recipientId, message) => {
    try {
      // Validate message data
      const messageData = {
        recipient_id: recipientId,
        message_type: 'sms',
        content: message
      };
      
      const messageValidation = validateMessage(messageData);
      if (!messageValidation.isValid) {
        return {
          success: false,
          error: "Invalid message data",
          validationErrors: messageValidation.errors
        };
      }
      
      return apiRequest(
        () => api.post('/messaging/sms', messageValidation.data), 
        'SMS message',
        false // Don't retry SMS sends automatically
      );
    } catch (error) {
      console.error("Error sending SMS:", error);
      return {
        success: false,
        error: "Failed to send SMS",
        errorDetails: error
      };
    }
  },

  // Send a text blast to multiple recipients
  sendTextBlast: async (recipientIds, message, options = {}) => {
    try {
      // Basic validation
      if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        return {
          success: false,
          error: "Invalid recipients",
          validationErrors: ["At least one recipient ID is required"]
        };
      }
      
      if (!message) {
        return {
          success: false,
          error: "Invalid message",
          validationErrors: ["Message content is required"]
        };
      }
      
      return apiRequest(
        () => api.post('/messaging/blast', { 
          recipientIds, 
          message, 
          ...options,
          message_type: 'sms',
          is_blast: true
        }), 
        'text blast',
        false // Don't retry blast sends automatically
      );
    } catch (error) {
      console.error("Error sending text blast:", error);
      return {
        success: false,
        error: "Failed to send text blast",
        errorDetails: error
      };
    }
  },

  // Send an email
  sendEmail: async (to, subject, body, options = {}) => {
    try {
      // Validate email data
      const messageData = {
        recipient_id: to,
        message_type: 'email',
        subject: subject,
        content: body
      };
      
      const messageValidation = validateMessage(messageData);
      if (!messageValidation.isValid) {
        return {
          success: false,
          error: "Invalid email data",
          validationErrors: messageValidation.errors
        };
      }
      
      return apiRequest(
        () => api.post('/messaging/email', { 
          to, 
          subject, 
          body, 
          ...options 
        }), 
        'email',
        false // Don't retry email sends automatically
      );
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: "Failed to send email",
        errorDetails: error
      };
    }
  },

  // Get message history for a person
  getMessageHistory: async (personId, page = 1, limit = 20) => {
    const params = { page, limit };
    return apiRequest(
      () => api.get(`/messaging/history/${personId}`, { params }), 
      'message history'
    );
  },

  // Get message templates
  getTemplates: async (type = 'all') => {
    return apiRequest(
      () => api.get('/messaging/templates', { params: { type } }), 
      'message templates'
    );
  }
};

/**
 * API Services for Relationships
 */
export const RelationshipAPI = {
  // Create a relationship between two people
  createRelationship: async (relationshipData) => {
    try {
      // Validate relationship data
      const relationshipValidation = validateRelationship(relationshipData);
      if (!relationshipValidation.isValid) {
        return {
          success: false,
          error: "Invalid relationship data",
          validationErrors: relationshipValidation.errors
        };
      }
      
      return apiRequest(
        () => api.post('/relationships', relationshipValidation.data), 
        'relationship'
      );
    } catch (error) {
      console.error("Error creating relationship:", error);
      return {
        success: false,
        error: "Failed to create relationship",
        errorDetails: error
      };
    }
  },

  // Create a referral relationship
  createReferralRelationship: async (referralData) => {
    try {
      // Basic validation
      if (!referralData.referrer_id) {
        return {
          success: false,
          error: "Invalid relationship data",
          validationErrors: ["Referrer ID is required"]
        };
      }
      
      if (!referralData.referred_id) {
        return {
          success: false,
          error: "Invalid relationship data",
          validationErrors: ["Referred ID is required"]
        };
      }
      
      // Prepare relationship data
      const relationshipData = {
        person_a_id: referralData.referrer_id,
        person_b_id: referralData.referred_id,
        relationship_type: 'referral',
        is_primary_referrer: true
      };
      
      // Validate relationship data
      const relationshipValidation = validateRelationship(relationshipData);
      if (!relationshipValidation.isValid) {
        return {
          success: false,
          error: "Invalid relationship data",
          validationErrors: relationshipValidation.errors
        };
      }
      
      return apiRequest(
        () => api.post('/relationships/referral', {
          ...referralData,
          relationship: relationshipValidation.data
        }), 
        'referral relationship'
      );
    } catch (error) {
      console.error("Error creating referral relationship:", error);
      return {
        success: false,
        error: "Failed to create referral relationship",
        errorDetails: error
      };
    }
  },

  // Get relationships for a person
  getRelationshipsForPerson: async (personId, options = {}) => {
    return apiRequest(
      () => api.get(`/relationships/person/${personId}`, { params: options }), 
      'person relationships'
    );
  },

  // Get referral relationships with filtering
  getReferralRelationships: async (filters = {}, page = 1, limit = 20) => {
    const params = { page, limit, ...filters };
    return apiRequest(
      () => api.get('/relationships/referrals', { params }), 
      'referral relationships'
    );
  },
  
  // Get referral network for visualization
  getReferralNetwork: async (personId, levels = 3) => {
    return apiRequest(
      () => api.get(`/relationships/network/${personId}`, { params: { levels } }), 
      'referral network'
    );
  }
};

/**
 * API Services for Person Management
 */
export const PersonAPI = {
  // Get all persons with optional filters
  getPersons: async (filters = {}, page = 1, limit = 20) => {
    const params = { page, limit, ...filters };
    return apiRequest(
      () => api.get('/persons', { params }), 
      'persons'
    );
  },

  // Get a specific person by ID
  getPerson: async (id) => {
    return apiRequest(
      () => api.get(`/persons/${id}`), 
      'person'
    );
  },

  // Create a new person
  createPerson: async (personData) => {
    try {
      // Validate person data
      const personValidation = validatePerson(personData);
      if (!personValidation.isValid) {
        return {
          success: false,
          error: "Invalid person data",
          validationErrors: personValidation.errors
        };
      }
      
      return apiRequest(
        () => api.post('/persons', personValidation.data), 
        'person'
      );
    } catch (error) {
      console.error("Error creating person:", error);
      return {
        success: false,
        error: "Failed to create person",
        errorDetails: error
      };
    }
  },

  // Update an existing person
  updatePerson: async (id, personData) => {
    try {
      // Validate person data
      const personValidation = validatePerson(personData);
      if (!personValidation.isValid) {
        return {
          success: false,
          error: "Invalid person data",
          validationErrors: personValidation.errors
        };
      }
      
      return apiRequest(
        () => api.put(`/persons/${id}`, personValidation.data), 
        'person'
      );
    } catch (error) {
      console.error("Error updating person:", error);
      return {
        success: false,
        error: "Failed to update person",
        errorDetails: error
      };
    }
  },

  // Delete a person
  deletePerson: async (id) => {
    return apiRequest(
      () => api.delete(`/persons/${id}`), 
      'person',
      false // Don't retry deletes automatically
    );
  },

  // Search persons
  searchPersons: async (query) => {
    return apiRequest(
      () => api.get(`/persons/search/${query}`), 
      'persons search'
    );
  },

  // Get person summary
  getPersonSummary: async (id) => {
    return apiRequest(
      () => api.get(`/persons/${id}/summary`), 
      'person summary'
    );
  }
};

export default {
  LeadAPI,
  ReferralAPI,
  MemberAPI,
  MessagingAPI,
  RelationshipAPI,
  PersonAPI
}; 