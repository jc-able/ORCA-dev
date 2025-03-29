/**
 * Stripe API Configuration
 * 
 * Configuration for payment processing through Stripe
 */

const stripe = require('stripe');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Stripe API configuration
 * 
 * Environment variables needed:
 * - STRIPE_SECRET_KEY: The secret API key for Stripe
 * - STRIPE_PUBLISHABLE_KEY: The publishable API key for Stripe
 * - STRIPE_WEBHOOK_SECRET: The secret for verifying webhook events
 * 
 * For local development, create a .env file with these variables
 * In production, they will be set in the hosting platform (Vercel)
 */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'placeholder-secret-key';
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || 'placeholder-publishable-key';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'placeholder-webhook-secret';

// Log a warning if using fallback values
if (
  stripeSecretKey === 'placeholder-secret-key' || 
  stripePublishableKey === 'placeholder-publishable-key'
) {
  console.warn('Using fallback Stripe credentials. Please check your server .env file.');
}

// Initialize Stripe client
const stripeClient = stripe(stripeSecretKey);

/**
 * Create a Stripe customer
 * @param {Object} customerData - Customer data
 * @returns {Promise<Object>} Created customer
 */
const createCustomer = async (customerData) => {
  try {
    const { email, name, phone, metadata = {} } = customerData;
    
    // Basic validation
    if (!email && !name) {
      throw new Error('Either email or name is required');
    }
    
    // Create customer in Stripe
    const customer = await stripeClient.customers.create({
      email,
      name,
      phone,
      metadata
    });
    
    return {
      success: true,
      customerId: customer.id,
      customer
    };
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

/**
 * Create a subscription product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
const createProduct = async (productData) => {
  try {
    const { name, description, metadata = {} } = productData;
    
    // Basic validation
    if (!name) {
      throw new Error('Product name is required');
    }
    
    // Create product in Stripe
    const product = await stripeClient.products.create({
      name,
      description,
      metadata
    });
    
    return {
      success: true,
      productId: product.id,
      product
    };
  } catch (error) {
    console.error('Error creating Stripe product:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

/**
 * Create a subscription price
 * @param {Object} priceData - Price data
 * @returns {Promise<Object>} Created price
 */
const createPrice = async (priceData) => {
  try {
    const { 
      productId, 
      unitAmount, 
      currency = 'usd', 
      recurring = { interval: 'month' }, 
      metadata = {}
    } = priceData;
    
    // Basic validation
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    if (!unitAmount || unitAmount <= 0) {
      throw new Error('Unit amount must be greater than 0');
    }
    
    // Create price in Stripe
    const price = await stripeClient.prices.create({
      product: productId,
      unit_amount: unitAmount, // in cents
      currency,
      recurring,
      metadata
    });
    
    return {
      success: true,
      priceId: price.id,
      price
    };
  } catch (error) {
    console.error('Error creating Stripe price:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

/**
 * Create a subscription
 * @param {Object} subscriptionData - Subscription data
 * @returns {Promise<Object>} Created subscription
 */
const createSubscription = async (subscriptionData) => {
  try {
    const { 
      customerId, 
      priceId, 
      quantity = 1,
      paymentMethodId = null,
      metadata = {},
      trialDays = 0
    } = subscriptionData;
    
    // Basic validation
    if (!customerId || !priceId) {
      throw new Error('Customer ID and price ID are required');
    }
    
    // Create subscription object
    const subscriptionObj = {
      customer: customerId,
      items: [{ price: priceId, quantity }],
      metadata,
      expand: ['latest_invoice.payment_intent']
    };
    
    // Add trial period if specified
    if (trialDays > 0) {
      const trialEnd = Math.floor(Date.now() / 1000) + (trialDays * 24 * 60 * 60);
      subscriptionObj.trial_end = trialEnd;
    }
    
    // If payment method is provided, attach it to the customer and use it
    if (paymentMethodId) {
      await stripeClient.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      
      await stripeClient.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      
      subscriptionObj.default_payment_method = paymentMethodId;
    }
    
    // Create subscription in Stripe
    const subscription = await stripeClient.subscriptions.create(subscriptionObj);
    
    return {
      success: true,
      subscriptionId: subscription.id,
      subscription,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
    };
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

/**
 * Create a checkout session
 * @param {Object} checkoutData - Checkout session data
 * @returns {Promise<Object>} Created checkout session
 */
const createCheckoutSession = async (checkoutData) => {
  try {
    const { 
      priceId, 
      quantity = 1,
      customerId = null,
      metadata = {},
      successUrl,
      cancelUrl
    } = checkoutData;
    
    // Basic validation
    if (!priceId || !successUrl || !cancelUrl) {
      throw new Error('Price ID, success URL, and cancel URL are required');
    }
    
    // Create checkout session
    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity
        }
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata
    };
    
    // Add customer if provided
    if (customerId) {
      sessionParams.customer = customerId;
    }
    
    const session = await stripeClient.checkout.sessions.create(sessionParams);
    
    return {
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      session
    };
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

/**
 * Create a payment link
 * @param {Object} linkData - Payment link data
 * @returns {Promise<Object>} Created payment link
 */
const createPaymentLink = async (linkData) => {
  try {
    const { 
      priceId, 
      quantity = 1,
      metadata = {}
    } = linkData;
    
    // Basic validation
    if (!priceId) {
      throw new Error('Price ID is required');
    }
    
    // Create payment link
    const paymentLink = await stripeClient.paymentLinks.create({
      line_items: [
        {
          price: priceId,
          quantity
        }
      ],
      metadata
    });
    
    return {
      success: true,
      paymentLinkId: paymentLink.id,
      url: paymentLink.url,
      paymentLink
    };
  } catch (error) {
    console.error('Error creating Stripe payment link:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

/**
 * Verify and parse a webhook event
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Verified event or error
 */
const parseWebhookEvent = (payload, signature) => {
  try {
    // Verify signature
    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      stripeWebhookSecret
    );
    
    return {
      success: true,
      event
    };
  } catch (error) {
    console.error('Error verifying Stripe webhook:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get a customer's subscription and payment method details
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} Customer details
 */
const getCustomerDetails = async (customerId) => {
  try {
    // Basic validation
    if (!customerId) {
      throw new Error('Customer ID is required');
    }
    
    // Get customer
    const customer = await stripeClient.customers.retrieve(customerId, {
      expand: ['subscriptions', 'invoice_settings.default_payment_method']
    });
    
    // Get payment methods
    const paymentMethods = await stripeClient.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });
    
    return {
      success: true,
      customer,
      subscriptions: customer.subscriptions.data,
      paymentMethods: paymentMethods.data,
      defaultPaymentMethod: customer.invoice_settings.default_payment_method
    };
  } catch (error) {
    console.error('Error retrieving Stripe customer details:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

module.exports = {
  createCustomer,
  createProduct,
  createPrice,
  createSubscription,
  createCheckoutSession,
  createPaymentLink,
  parseWebhookEvent,
  getCustomerDetails,
  stripeClient,
  stripePublishableKey
}; 