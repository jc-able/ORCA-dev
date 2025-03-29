/**
 * Seed Data Script for ORCA Lead Management Software
 * 
 * This script populates the Supabase database with test data
 * Run with: node db/seed-data.js
 */
const supabase = require('../config/supabase');

// Sample user data
const users = [
  {
    id: 'test-admin-id', // In production, this would be a UUID from the auth system
    email: 'admin@example.com',
    password: '$2a$12$ScV7d5.4QcWY859S9RCdqOJpKohKgRZm5wX7LRzqNQtpA59d5gqeq', // hashed 'password123'
    first_name: 'Admin',
    last_name: 'User',
    phone: '(555) 111-1111',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'test-sales-id', // In production, this would be a UUID from the auth system
    email: 'sales@example.com',
    password: '$2a$12$ScV7d5.4QcWY859S9RCdqOJpKohKgRZm5wX7LRzqNQtpA59d5gqeq', // hashed 'password123'
    first_name: 'Sales',
    last_name: 'User',
    phone: '(555) 222-2222',
    role: 'salesperson',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Sample lead data
const leads = [
  {
    // Person data
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '(555) 123-4567',
    gender: 'Female',
    preferred_contact_method: 'Phone',
    email_opt_in: true,
    sms_opt_in: true,
    acquisition_source: 'Website',
    interest_level: 'High',
    goals: 'Weight loss and toning',
    preferred_membership: 'Premium',
    budget_range: '$50-100/month',
    is_lead: true,
    assigned_to: 'test-sales-id', // Assigned to the sales user
    
    // Lead extension
    lead_extension: {
      lead_status: 'Contacted',
      readiness_score: 8,
      lead_temperature: 'Hot',
      status_history: [
        {
          status: 'New',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Lead created from website form'
        },
        {
          status: 'Contacted',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Initial contact via email'
        }
      ],
      decision_timeline: '2-4 weeks',
      previous_experience: 'Has been member of other gyms before',
      motivations: ['Health improvement', 'Weight loss'],
      conversion_probability: 75
    }
  },
  {
    // Person data
    first_name: 'Robert',
    last_name: 'Johnson',
    email: 'robert.j@example.com',
    phone: '(555) 987-6543',
    gender: 'Male',
    preferred_contact_method: 'Email',
    email_opt_in: true,
    sms_opt_in: false,
    acquisition_source: 'Social Media',
    interest_level: 'Medium',
    goals: 'Strength training',
    preferred_membership: 'Basic',
    budget_range: '$30-50/month',
    is_lead: true,
    assigned_to: 'test-sales-id', // Assigned to the sales user
    
    // Lead extension
    lead_extension: {
      lead_status: 'New',
      readiness_score: 5,
      lead_temperature: 'Warm',
      status_history: [
        {
          status: 'New',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Lead created from Instagram ad'
        }
      ],
      decision_timeline: '1-2 months',
      previous_experience: 'Beginner, no previous gym membership',
      motivations: ['Build muscle', 'Improve fitness'],
      conversion_probability: 40
    }
  },
  {
    // Person data
    first_name: 'Michael',
    last_name: 'Williams',
    email: 'michael.w@example.com',
    phone: '(555) 456-7890',
    gender: 'Male',
    preferred_contact_method: 'Phone',
    email_opt_in: true,
    sms_opt_in: true,
    acquisition_source: 'Referral',
    referral_source: 'David Brown',
    interest_level: 'High',
    goals: 'Cross-training and cardio',
    preferred_membership: 'Premium',
    budget_range: '$75-125/month',
    is_lead: true,
    
    // Lead extension
    lead_extension: {
      lead_status: 'Appointment Scheduled',
      readiness_score: 9,
      lead_temperature: 'Hot',
      status_history: [
        {
          status: 'New',
          timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Lead created from member referral'
        },
        {
          status: 'Contacted',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Initial phone call'
        },
        {
          status: 'Appointment Scheduled',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Scheduled facility tour'
        }
      ],
      visit_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      decision_timeline: '1-2 weeks',
      previous_experience: 'Currently member at competitor gym',
      motivations: ['Better facilities', 'Group classes'],
      conversion_probability: 85
    }
  },
  {
    // Person data
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@example.com',
    phone: '(555) 234-5678',
    gender: 'Female',
    preferred_contact_method: 'SMS',
    email_opt_in: true,
    sms_opt_in: true,
    acquisition_source: 'Walk-in',
    interest_level: 'High',
    goals: 'Personal training and nutrition coaching',
    preferred_membership: 'Premium Plus',
    budget_range: '$100-200/month',
    is_lead: true,
    
    // Lead extension
    lead_extension: {
      lead_status: 'Proposal Made',
      readiness_score: 9,
      lead_temperature: 'Hot',
      status_history: [
        {
          status: 'New',
          timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Lead created from walk-in visit'
        },
        {
          status: 'Contacted',
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Initial contact at front desk'
        },
        {
          status: 'Appointment Scheduled',
          timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Scheduled consultation with trainer'
        },
        {
          status: 'Appointment Completed',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Completed consultation, very interested'
        },
        {
          status: 'Proposal Made',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Sent custom membership proposal'
        }
      ],
      visit_completed: true,
      visit_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      decision_timeline: 'Within 1 week',
      previous_experience: 'Previous personal training experience',
      motivations: ['Personalized training', 'Nutrition guidance'],
      conversion_probability: 90
    }
  },
  {
    // Person data
    first_name: 'David',
    last_name: 'Brown',
    email: 'david.brown@example.com',
    phone: '(555) 876-5432',
    gender: 'Male',
    preferred_contact_method: 'Email',
    email_opt_in: true,
    sms_opt_in: true,
    acquisition_source: 'Google Search',
    interest_level: 'High',
    goals: 'Functional fitness and recovery',
    preferred_membership: 'Elite',
    budget_range: '$150-250/month',
    is_lead: true,
    is_member: true,
    
    // Lead extension
    lead_extension: {
      lead_status: 'Won',
      readiness_score: 10,
      lead_temperature: 'Hot',
      status_history: [
        {
          status: 'New',
          timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Lead created from website inquiry'
        },
        {
          status: 'Contacted',
          timestamp: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Initial email contact'
        },
        {
          status: 'Appointment Scheduled',
          timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Scheduled facility tour'
        },
        {
          status: 'Appointment Completed',
          timestamp: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Tour completed, very interested'
        },
        {
          status: 'Proposal Made',
          timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Proposed Elite membership package'
        },
        {
          status: 'Won',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Signed up for Elite membership'
        }
      ],
      visit_completed: true,
      visit_date: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
      decision_timeline: 'Immediate',
      previous_experience: 'Extensive fitness background',
      motivations: ['Recovery tools', 'Premium amenities'],
      conversion_probability: 100
    }
  }
];

/**
 * Insert a user
 * @param {Object} user - User data
 */
async function insertUser(user) {
  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw checkError;
    }
    
    if (existingUser) {
      console.log(`User ${user.email} already exists, skipping`);
      return;
    }
    
    // Insert the user
    const { error: insertError } = await supabase
      .from('users')
      .insert(user);
    
    if (insertError) {
      throw insertError;
    }
    
    console.log(`Created user: ${user.first_name} ${user.last_name} (${user.email})`);
  } catch (error) {
    console.error('Error inserting user:', error);
    throw error;
  }
}

/**
 * Insert a lead with its extension
 * @param {Object} lead - Lead data with nested lead_extension
 */
async function insertLead(lead) {
  try {
    // Clone the lead and remove the lead_extension
    const leadData = { ...lead };
    const leadExtension = leadData.lead_extension;
    delete leadData.lead_extension;
    
    // Insert the person record
    const { data: person, error: personError } = await supabase
      .from('persons')
      .insert(leadData)
      .select()
      .single();
    
    if (personError) {
      throw personError;
    }
    
    console.log(`Created person: ${person.first_name} ${person.last_name}`);
    
    // Insert the lead extension
    if (leadExtension) {
      const leadExtensionData = {
        ...leadExtension,
        person_id: person.id
      };
      
      const { error: extensionError } = await supabase
        .from('lead_extensions')
        .insert(leadExtensionData);
      
      if (extensionError) {
        throw extensionError;
      }
      
      console.log(`Created lead extension for ${person.first_name} ${person.last_name}`);
    }
    
    return person;
  } catch (error) {
    console.error('Error inserting lead:', error);
    throw error;
  }
}

/**
 * Main function to seed the database
 */
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Insert users
    console.log('Seeding users...');
    for (const user of users) {
      await insertUser(user);
    }
    
    // Check if there's existing lead data
    const { data: existingPersons, error: checkError } = await supabase
      .from('persons')
      .select('id')
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingPersons && existingPersons.length > 0) {
      console.log('Database already has lead data. Skipping seed operation for leads.');
      return;
    }
    
    // Insert all leads
    console.log('Seeding leads...');
    for (const lead of leads) {
      await insertLead(lead);
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Execute the seed function
seedDatabase(); 