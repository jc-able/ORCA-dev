/**
 * Firebase Configuration
 * 
 * Configuration for Firebase services, primarily Dynamic Links
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Firebase configuration for Dynamic Links
 * 
 * Environment variables needed:
 * - FIREBASE_API_KEY: The web API key for Firebase project
 * - FIREBASE_DYNAMIC_LINKS_DOMAIN: The Dynamic Links domain (e.g., orca.page.link)
 * - FIREBASE_PROJECT_ID: The Firebase project ID
 * 
 * For local development, create a .env file with these variables
 * In production, they will be set in the hosting platform (Vercel)
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'placeholder-api-key',
  dynamicLinksDomain: process.env.FIREBASE_DYNAMIC_LINKS_DOMAIN || 'orca.page.link',
  projectId: process.env.FIREBASE_PROJECT_ID || 'placeholder-project-id'
};

// Log a warning if using fallback values
if (
  firebaseConfig.apiKey === 'placeholder-api-key' || 
  firebaseConfig.projectId === 'placeholder-project-id'
) {
  console.warn('Using fallback Firebase credentials. Please check your server .env file.');
}

/**
 * Create a dynamic link for referrals
 * @param {Object} options - Options for the dynamic link
 * @param {string} options.referrerId - ID of the referring person
 * @param {string} options.referrerName - Name of the referring person
 * @param {string} options.campaign - Optional campaign identifier
 * @param {string} options.source - Source of the referral
 * @param {Object} options.customParams - Additional custom parameters
 * @returns {Promise<Object>} Created dynamic link
 */
const createReferralLink = async (options) => {
  try {
    const { 
      referrerId, 
      referrerName, 
      campaign = 'default', 
      source = 'app',
      customParams = {}
    } = options;
    
    // Basic validation
    if (!referrerId) {
      throw new Error('Referrer ID is required');
    }
    
    // Base URL to redirect to
    const baseUrl = process.env.CLIENT_URL || 'https://orca-lead-management.vercel.app';
    const referralUrl = `${baseUrl}/referral?referrer=${referrerId}`;
    
    // Build the dynamic link request
    const dynamicLinkRequest = {
      dynamicLinkInfo: {
        domainUriPrefix: `https://${firebaseConfig.dynamicLinksDomain}`,
        link: referralUrl,
        androidInfo: {
          androidPackageName: 'com.orca.leadmanagement',
          androidFallbackLink: referralUrl
        },
        iosInfo: {
          iosBundleId: 'com.orca.leadmanagement',
          iosFallbackLink: referralUrl
        },
        socialMetaTagInfo: {
          socialTitle: `${referrerName} invited you to connect`,
          socialDescription: 'Click to view this referral from ORCA Lead Management',
          socialImageLink: `${baseUrl}/images/referral-share.png`
        },
        navigationInfo: {
          enableForcedRedirect: true
        }
      },
      suffix: {
        option: 'SHORT'
      }
    };
    
    // Add UTM parameters
    const utmParams = new URLSearchParams({
      utm_source: source,
      utm_medium: 'referral',
      utm_campaign: campaign,
      utm_content: referrerId,
      ...customParams
    });
    
    // Append UTM parameters to the link
    dynamicLinkRequest.dynamicLinkInfo.link += `&${utmParams.toString()}`;
    
    // Create the dynamic link using Firebase API
    const response = await axios.post(
      `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${firebaseConfig.apiKey}`,
      dynamicLinkRequest
    );
    
    return {
      success: true,
      shortLink: response.data.shortLink,
      previewLink: response.data.previewLink,
      referrerId,
      campaign,
      source
    };
  } catch (error) {
    console.error('Error creating Firebase Dynamic Link:', error);
    return {
      success: false,
      error: error.message,
      details: error.response ? error.response.data : error
    };
  }
};

/**
 * Parse a dynamic link to extract parameters
 * @param {string} url - The dynamic link URL
 * @returns {Object} Extracted parameters
 */
const parseReferralLink = (url) => {
  try {
    const parsedUrl = new URL(url);
    const params = new URLSearchParams(parsedUrl.search);
    
    return {
      success: true,
      referrerId: params.get('referrer'),
      campaign: params.get('utm_campaign') || 'default',
      source: params.get('utm_source') || 'unknown',
      medium: params.get('utm_medium'),
      content: params.get('utm_content'),
      params: Object.fromEntries(params.entries())
    };
  } catch (error) {
    console.error('Error parsing dynamic link:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createReferralLink,
  parseReferralLink,
  firebaseConfig
}; 