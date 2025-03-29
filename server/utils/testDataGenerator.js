/**
 * Test Data Generator
 * Provides utilities to generate realistic test data for all models
 */
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a random person record
 * @param {Object} overrides - Optional fields to override defaults
 * @returns {Object} - Person record
 */
const generatePerson = (overrides = {}) => {
  const firstName = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily'][Math.floor(Math.random() * 6)];
  const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis'][Math.floor(Math.random() * 6)];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@example.com`;
  
  return {
    id: uuidv4(),
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    secondary_phone: Math.random() > 0.7 ? `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : null,
    address: {
      street: `${Math.floor(Math.random() * 9000) + 1000} Main St`,
      city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
      state: ['NY', 'CA', 'IL', 'TX', 'AZ'][Math.floor(Math.random() * 5)],
      zip: `${Math.floor(Math.random() * 90000) + 10000}`
    },
    dob: new Date(1970 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    gender: ['Male', 'Female', 'Non-binary'][Math.floor(Math.random() * 3)],
    preferred_contact_method: ['Email', 'Phone', 'SMS'][Math.floor(Math.random() * 3)],
    preferred_contact_times: {
      morning: Math.random() > 0.5,
      afternoon: Math.random() > 0.5,
      evening: Math.random() > 0.5
    },
    contact_frequency_preference: ['Daily', 'Weekly', 'Monthly'][Math.floor(Math.random() * 3)],
    email_opt_in: Math.random() > 0.2,
    sms_opt_in: Math.random() > 0.3,
    social_profiles: {
      facebook: Math.random() > 0.5 ? `https://facebook.com/${firstName.toLowerCase()}${lastName.toLowerCase()}` : null,
      instagram: Math.random() > 0.6 ? `https://instagram.com/${firstName.toLowerCase()}${lastName.toLowerCase()}` : null,
      twitter: Math.random() > 0.7 ? `https://twitter.com/${firstName.toLowerCase()}${lastName.toLowerCase()}` : null
    },
    is_lead: false,
    is_referral: false,
    is_member: false,
    active_status: true,
    acquisition_source: ['Website', 'Referral', 'Walk-in', 'Social Media', 'Event'][Math.floor(Math.random() * 5)],
    acquisition_campaign: Math.random() > 0.7 ? ['Summer Special', 'New Year Deal', 'Friends & Family'][Math.floor(Math.random() * 3)] : null,
    acquisition_date: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
    utm_parameters: Math.random() > 0.7 ? {
      utm_source: ['google', 'facebook', 'instagram'][Math.floor(Math.random() * 3)],
      utm_medium: ['cpc', 'social', 'email'][Math.floor(Math.random() * 3)],
      utm_campaign: ['summer2023', 'fall2023', 'spring2023'][Math.floor(Math.random() * 3)]
    } : null,
    referral_source: null,
    interest_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    goals: ['Weight loss', 'Muscle gain', 'Overall fitness', 'Stress reduction'][Math.floor(Math.random() * 4)],
    preferred_membership: ['Basic', 'Premium', 'Family', 'Corporate'][Math.floor(Math.random() * 4)],
    interested_services: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
      ['Personal Training', 'Group Classes', 'Nutrition Coaching', 'Massage Therapy'][Math.floor(Math.random() * 4)]
    ),
    preferred_schedule: {
      weekdays: Math.random() > 0.5,
      weekends: Math.random() > 0.5,
      mornings: Math.random() > 0.5,
      evenings: Math.random() > 0.5
    },
    special_requirements: Math.random() > 0.8 ? 'Has knee injury, requires low-impact exercises' : null,
    budget_range: ['$50-100', '$100-200', '$200-300', '$300+'][Math.floor(Math.random() * 4)],
    payment_preferences: ['Credit Card', 'Bank Transfer', 'Cash'][Math.floor(Math.random() * 3)],
    price_sensitivity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    profile_completeness: Math.floor(Math.random() * 100),
    tags: Array.from({ length: Math.floor(Math.random() * 3) }, () => 
      ['VIP', 'Needs Follow-up', 'Hot Lead', 'Interested in PT', 'Price Sensitive'][Math.floor(Math.random() * 5)]
    ),
    custom_fields: {},
    assigned_to: null,
    created_at: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
    updated_at: new Date().toISOString(),
    last_contacted: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString() : null,
    next_scheduled_contact: Math.random() > 0.5 ? new Date(Date.now() + Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)).toISOString() : null,
    notes: Math.random() > 0.6 ? 'Seems very interested in our premium offerings. Follow up about family plan.' : null,
    ...overrides
  };
};

/**
 * Generate a lead extension record
 * @param {UUID} personId - Person ID to associate with this lead extension
 * @param {Object} overrides - Optional fields to override defaults
 * @returns {Object} - Lead extension record
 */
const generateLeadExtension = (personId, overrides = {}) => {
  return {
    id: uuidv4(),
    person_id: personId,
    decision_authority: ['Sole Decision Maker', 'Shared Decision', 'Needs Approval'][Math.floor(Math.random() * 3)],
    decision_timeline: ['Within a week', '1-2 weeks', '1 month', '3+ months'][Math.floor(Math.random() * 4)],
    previous_experience: Math.random() > 0.5 ? 'Has been a member at GoodLife Fitness for 2 years' : null,
    competitor_considerations: Math.random() > 0.5 ? 
      Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => 
        ['Planet Fitness', 'LA Fitness', 'Gold\'s Gym', 'Local gym'][Math.floor(Math.random() * 4)]
      ) : [],
    pain_points: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
      ['Cost', 'Location', 'Equipment', 'Classes schedule', 'Crowded facility'][Math.floor(Math.random() * 5)]
    ),
    motivations: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
      ['Weight loss', 'Improved health', 'Social aspect', 'Stress relief', 'Doctor recommended'][Math.floor(Math.random() * 5)]
    ),
    objections: Array.from({ length: Math.floor(Math.random() * 2) }, () => ({
      objection: ['Too expensive', 'Location inconvenient', 'Unsure about commitment'][Math.floor(Math.random() * 3)],
      response: 'Discussed flexible payment options and trial period',
      resolved: Math.random() > 0.5
    })),
    readiness_score: Math.floor(Math.random() * 10) + 1,
    lead_temperature: ['hot', 'warm', 'cold'][Math.floor(Math.random() * 3)],
    lead_status: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'][Math.floor(Math.random() * 7)],
    status_history: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
      status: ['new', 'contacted', 'qualified'][i],
      timestamp: new Date(Date.now() - (3 - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Status updated via system'
    })),
    stage_duration_days: {
      new: Math.floor(Math.random() * 10),
      contacted: Math.floor(Math.random() * 15),
      qualified: Math.floor(Math.random() * 7)
    },
    visit_completed: Math.random() > 0.5,
    visit_date: Math.random() > 0.5 ? new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString() : null,
    trial_status: ['none', 'scheduled', 'active', 'completed'][Math.floor(Math.random() * 4)],
    trial_start_date: Math.random() > 0.5 ? new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)).toISOString() : null,
    trial_end_date: Math.random() > 0.5 ? new Date(Date.now() + Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)).toISOString() : null,
    forms_completed: {
      waiver: Math.random() > 0.5,
      health_questionnaire: Math.random() > 0.6,
      membership_application: Math.random() > 0.4
    },
    documents_shared: Array.from({ length: Math.floor(Math.random() * 2) }, () => ({
      name: ['Membership Brochure', 'Class Schedule', 'Pricing Sheet'][Math.floor(Math.random() * 3)],
      url: 'https://example.com/document.pdf',
      shared_date: new Date(Date.now() - Math.floor(Math.random() * 20 * 24 * 60 * 60 * 1000)).toISOString()
    })),
    payment_info_collected: Math.random() > 0.3,
    conversion_probability: Math.floor(Math.random() * 101),
    estimated_value: Math.floor(Math.random() * 2000) + 500,
    conversion_blockers: Math.random() > 0.5 ? 
      Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => 
        ['Price', 'Location', 'Schedule', 'Competition'][Math.floor(Math.random() * 4)]
      ) : [],
    created_at: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
};

/**
 * Generate a referral extension record
 * @param {UUID} personId - Person ID to associate with this referral extension
 * @param {Object} overrides - Optional fields to override defaults
 * @returns {Object} - Referral extension record
 */
const generateReferralExtension = (personId, overrides = {}) => {
  return {
    id: uuidv4(),
    person_id: personId,
    relationship_to_referrer: ['Friend', 'Family', 'Coworker', 'Acquaintance'][Math.floor(Math.random() * 4)],
    relationship_strength: ['strong', 'medium', 'weak'][Math.floor(Math.random() * 3)],
    permission_level: ['explicit', 'implied', 'cold'][Math.floor(Math.random() * 3)],
    referral_status: ['submitted', 'contacted', 'appointment_scheduled', 'appointment_completed', 'converted', 'lost'][Math.floor(Math.random() * 6)],
    status_history: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
      status: ['submitted', 'contacted', 'appointment_scheduled'][i],
      timestamp: new Date(Date.now() - (3 - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Status updated via system'
    })),
    time_in_stage_days: {
      submitted: Math.floor(Math.random() * 5),
      contacted: Math.floor(Math.random() * 10),
      appointment_scheduled: Math.floor(Math.random() * 7)
    },
    appointment_date: Math.random() > 0.5 ? new Date(Date.now() + Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)).toISOString() : null,
    appointment_status: ['none', 'scheduled', 'completed', 'cancelled', 'no_show'][Math.floor(Math.random() * 5)],
    google_calendar_event_id: Math.random() > 0.5 ? `event_${Math.random().toString(36).substring(2, 10)}` : null,
    conversion_status: ['none', 'in_progress', 'converted', 'lost'][Math.floor(Math.random() * 4)],
    conversion_date: Math.random() > 0.7 ? new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString() : null,
    conversion_probability: Math.floor(Math.random() * 101),
    eligible_incentives: Array.from({ length: Math.floor(Math.random() * 2) }, () => ({
      incentive_id: uuidv4(),
      name: ['Free Month', 'Personal Training Session', 'Merchandise'][Math.floor(Math.random() * 3)],
      value: Math.floor(Math.random() * 200) + 50
    })),
    incentives_awarded: Math.random() > 0.7 ? Array.from({ length: 1 }, () => ({
      incentive_id: uuidv4(),
      award_date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      status: ['pending', 'awarded', 'redeemed'][Math.floor(Math.random() * 3)]
    })) : [],
    marketing_materials_sent: Array.from({ length: Math.floor(Math.random() * 2) }, () => ({
      material_id: uuidv4(),
      name: ['Welcome Brochure', 'Facilities Guide', 'Class Schedule'][Math.floor(Math.random() * 3)],
      send_date: new Date(Date.now() - Math.floor(Math.random() * 20 * 24 * 60 * 60 * 1000)).toISOString(),
      opened: Math.random() > 0.5
    })),
    campaign_enrollments: Math.random() > 0.6 ? 
      Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => 
        ['Summer Referral', 'Member Get Member', 'Holiday Special'][Math.floor(Math.random() * 3)]
      ) : [],
    nurture_sequence_status: Math.random() > 0.5 ? {
      sequence_name: 'Referral Nurture',
      current_step: Math.floor(Math.random() * 5) + 1,
      last_action_date: new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)).toISOString(),
      next_action_date: new Date(Date.now() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
    } : null,
    created_at: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
};

/**
 * Generate an interaction record
 * @param {UUID} personId - Person ID associated with this interaction
 * @param {UUID} userId - User ID who performed the interaction
 * @param {Object} overrides - Optional fields to override defaults
 * @returns {Object} - Interaction record
 */
const generateInteraction = (personId, userId, overrides = {}) => {
  const interactionType = ['email', 'sms', 'call', 'meeting', 'note', 'visit'][Math.floor(Math.random() * 6)];
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
  
  return {
    id: uuidv4(),
    person_id: personId,
    user_id: userId,
    interaction_type: interactionType,
    subject: {
      'email': 'Follow-up on your membership inquiry',
      'sms': 'Quick question about your visit',
      'call': 'Membership options discussion',
      'meeting': 'Facility tour',
      'note': 'Internal notes about lead',
      'visit': 'Gym visit notes'
    }[interactionType] || 'Interaction',
    content: {
      'email': 'Thank you for your interest in our gym. I wanted to follow up on the membership options we discussed.',
      'sms': 'Hi there! Just checking if you have any questions after your visit yesterday?',
      'call': 'Discussed various membership tiers and answered questions about class schedules.',
      'meeting': 'Gave a tour of the facilities. Showed particular interest in the weight room and yoga studio.',
      'note': 'Seems very interested but concerned about the price. Consider offering a discount.',
      'visit': 'Came in for a tour. Seemed impressed with the facilities.'
    }[interactionType] || 'Interaction content',
    attachments: interactionType === 'email' ? [
      {
        name: 'Membership_Details.pdf',
        url: 'https://example.com/documents/membership.pdf',
        type: 'application/pdf'
      }
    ] : [],
    status: ['scheduled', 'in_progress', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
    scheduled_at: Math.random() > 0.5 ? pastDate.toISOString() : null,
    completed_at: Math.random() > 0.7 ? new Date(pastDate.getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString() : null,
    duration_minutes: Math.random() > 0.5 ? Math.floor(Math.random() * 60) + 5 : null,
    response_received: Math.random() > 0.6,
    response_date: Math.random() > 0.6 ? new Date(pastDate.getTime() + Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000)).toISOString() : null,
    response_content: Math.random() > 0.6 ? 'Thanks for the information. I\'ll review and get back to you soon.' : null,
    sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
    campaign_id: Math.random() > 0.7 ? `campaign_${Math.random().toString(36).substring(2, 10)}` : null,
    template_id: Math.random() > 0.7 ? `template_${Math.random().toString(36).substring(2, 10)}` : null,
    created_at: pastDate.toISOString(),
    updated_at: now.toISOString(),
    notes: Math.random() > 0.5 ? 'Follow up in one week if no response' : null,
    custom_fields: {},
    ...overrides
  };
};

/**
 * Generate a message record
 * @param {UUID} senderId - User ID sending the message
 * @param {UUID} recipientId - Person ID receiving the message
 * @param {Object} overrides - Optional fields to override defaults
 * @returns {Object} - Message record
 */
const generateMessage = (senderId, recipientId, overrides = {}) => {
  const messageType = ['email', 'sms', 'blast'][Math.floor(Math.random() * 3)];
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
  const deliveredDate = Math.random() > 0.9 ? null : new Date(pastDate.getTime() + Math.floor(Math.random() * 60 * 1000));
  const readDate = Math.random() > 0.7 ? null : new Date(deliveredDate.getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000));
  
  return {
    id: uuidv4(),
    sender_id: senderId,
    recipient_id: recipientId,
    message_type: messageType,
    subject: messageType === 'email' ? 'Information about your membership inquiry' : null,
    content: {
      'email': 'Thank you for your interest in our gym. Here are the membership details you requested.',
      'sms': 'Hi! Just a reminder about your appointment tomorrow at 2pm. Looking forward to seeing you!',
      'blast': 'Join us this weekend for our special open house event! Bring a friend and get a free personal training session.'
    }[messageType] || 'Message content',
    status: ['sending', 'sent', 'delivered', 'failed'][Math.floor(Math.random() * 4)],
    sent_at: pastDate.toISOString(),
    delivered_at: deliveredDate ? deliveredDate.toISOString() : null,
    read_at: readDate ? readDate.toISOString() : null,
    is_blast: messageType === 'blast',
    blast_id: messageType === 'blast' ? uuidv4() : null,
    template_id: Math.random() > 0.5 ? uuidv4() : null,
    personalization_data: Math.random() > 0.5 ? {
      first_name: 'John',
      appointment_time: '2:00 PM',
      membership_type: 'Premium'
    } : null,
    campaign_id: Math.random() > 0.7 ? `campaign_${Math.random().toString(36).substring(2, 10)}` : null,
    has_response: Math.random() > 0.7,
    response_id: Math.random() > 0.7 ? uuidv4() : null,
    metadata: {},
    created_at: pastDate.toISOString(),
    updated_at: now.toISOString(),
    ...overrides
  };
};

/**
 * Generate a full test lead with person and lead extension
 * @param {UUID} assignedTo - User ID to assign the lead to
 * @param {Object} overrides - Optional fields to override defaults
 * @returns {Object} - Complete lead object
 */
const generateTestLead = (assignedTo, overrides = {}) => {
  const person = generatePerson({
    is_lead: true,
    assigned_to: assignedTo,
    ...overrides.person
  });
  
  const leadExtension = generateLeadExtension(person.id, overrides.leadExtension);
  
  return {
    ...person,
    lead_extensions: [leadExtension]
  };
};

/**
 * Generate a full test referral with person and referral extension
 * @param {UUID} assignedTo - User ID to assign the referral to
 * @param {Object} overrides - Optional fields to override defaults
 * @returns {Object} - Complete referral object
 */
const generateTestReferral = (assignedTo, overrides = {}) => {
  const person = generatePerson({
    is_referral: true,
    assigned_to: assignedTo,
    ...overrides.person
  });
  
  const referralExtension = generateReferralExtension(person.id, overrides.referralExtension);
  
  return {
    ...person,
    referral_extensions: [referralExtension]
  };
};

/**
 * Generate a complete test dataset with users, persons, leads, referrals, etc.
 * @param {Number} counts - Object with counts for each entity type
 * @returns {Object} - Complete test dataset
 */
const generateTestDataset = (counts = {
  users: 2,
  leads: 10,
  referrals: 5,
  interactionsPerPerson: 3,
  messagesPerPerson: 3
}) => {
  // Create users
  const users = Array.from({ length: counts.users }, (_, i) => ({
    id: uuidv4(),
    email: `user${i + 1}@example.com`,
    password: '$2a$10$HA1mSVKDYdJhBhBNA1YVj.OXLfz/JxE5V6QEItKkC2X1HtF2I2c1e', // hashed 'password123'
    first_name: ['Sarah', 'Michael'][i],
    last_name: ['Johnson', 'Davis'][i],
    phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    role: i === 0 ? 'admin' : 'salesperson',
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    last_login: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
    settings: {
      theme: 'dark',
      notifications: {
        email: true,
        sms: false,
        app: true
      }
    }
  }));
  
  // Create leads
  const leads = Array.from({ length: counts.leads }, () => 
    generateTestLead(users[Math.floor(Math.random() * users.length)].id)
  );
  
  // Create referrals
  const referrals = Array.from({ length: counts.referrals }, () => 
    generateTestReferral(users[Math.floor(Math.random() * users.length)].id)
  );
  
  // Combine all persons
  const persons = [...leads, ...referrals];
  
  // Create interactions
  const interactions = persons.flatMap(person => 
    Array.from({ length: counts.interactionsPerPerson }, () => 
      generateInteraction(
        person.id, 
        users[Math.floor(Math.random() * users.length)].id
      )
    )
  );
  
  // Create messages
  const messages = persons.flatMap(person => 
    Array.from({ length: counts.messagesPerPerson }, () => 
      generateMessage(
        users[Math.floor(Math.random() * users.length)].id,
        person.id
      )
    )
  );
  
  return {
    users,
    persons,
    leads,
    referrals,
    interactions,
    messages
  };
};

module.exports = {
  generatePerson,
  generateLeadExtension,
  generateReferralExtension,
  generateInteraction,
  generateMessage,
  generateTestLead,
  generateTestReferral,
  generateTestDataset
}; 