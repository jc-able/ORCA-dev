/**
 * Test Data Generator Script
 * This script generates and inserts test data into the Supabase database
 */
const supabase = require('../config/supabase');
const { generateTestDataset } = require('./testDataGenerator');

/**
 * Insert test data into Supabase
 * @param {Object} options - Options for generating test data
 * @returns {Promise<Object>} - Test data that was inserted
 */
const insertTestData = async (options = {}) => {
  try {
    console.log('Generating test data...');
    const testData = generateTestDataset({
      users: options.users || 2,
      leads: options.leads || 10,
      referrals: options.referrals || 5,
      interactionsPerPerson: options.interactionsPerPerson || 3,
      messagesPerPerson: options.messagesPerPerson || 3
    });
    
    console.log(`Generated test data:
      - ${testData.users.length} users
      - ${testData.leads.length} leads
      - ${testData.referrals.length} referrals
      - ${testData.interactions.length} interactions
      - ${testData.messages.length} messages
    `);

    // Insert users
    console.log('Inserting users...');
    const { error: usersError } = await supabase
      .from('users')
      .insert(testData.users);
    
    if (usersError) {
      throw new Error(`Error inserting users: ${usersError.message}`);
    }

    // Insert persons
    console.log('Inserting persons...');
    const personsWithoutExtensions = testData.persons.map(person => {
      const { lead_extensions, referral_extensions, ...personData } = person;
      return personData;
    });
    
    const { error: personsError } = await supabase
      .from('persons')
      .insert(personsWithoutExtensions);
    
    if (personsError) {
      throw new Error(`Error inserting persons: ${personsError.message}`);
    }

    // Insert lead extensions
    console.log('Inserting lead extensions...');
    const leadExtensions = testData.leads
      .filter(lead => lead.lead_extensions && lead.lead_extensions.length > 0)
      .map(lead => lead.lead_extensions[0]);
    
    if (leadExtensions.length > 0) {
      const { error: leadExtensionsError } = await supabase
        .from('lead_extensions')
        .insert(leadExtensions);
      
      if (leadExtensionsError) {
        throw new Error(`Error inserting lead extensions: ${leadExtensionsError.message}`);
      }
    }

    // Insert referral extensions
    console.log('Inserting referral extensions...');
    const referralExtensions = testData.referrals
      .filter(referral => referral.referral_extensions && referral.referral_extensions.length > 0)
      .map(referral => referral.referral_extensions[0]);
    
    if (referralExtensions.length > 0) {
      const { error: referralExtensionsError } = await supabase
        .from('referral_extensions')
        .insert(referralExtensions);
      
      if (referralExtensionsError) {
        throw new Error(`Error inserting referral extensions: ${referralExtensionsError.message}`);
      }
    }

    // Insert interactions
    console.log('Inserting interactions...');
    const { error: interactionsError } = await supabase
      .from('interactions')
      .insert(testData.interactions);
    
    if (interactionsError) {
      throw new Error(`Error inserting interactions: ${interactionsError.message}`);
    }

    // Insert messages
    console.log('Inserting messages...');
    const { error: messagesError } = await supabase
      .from('messages')
      .insert(testData.messages);
    
    if (messagesError) {
      throw new Error(`Error inserting messages: ${messagesError.message}`);
    }

    console.log('Test data inserted successfully!');
    return testData;
  } catch (error) {
    console.error('Error inserting test data:', error);
    throw error;
  }
};

// If this script is run directly, execute the test data insertion
if (require.main === module) {
  insertTestData()
    .then(data => {
      console.log('Successfully inserted test data');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to insert test data:', error);
      process.exit(1);
    });
}

module.exports = { insertTestData }; 