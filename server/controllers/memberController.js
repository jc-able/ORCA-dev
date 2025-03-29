/**
 * Member Controller
 * 
 * Handles operations specific to members
 * These extend the core person functionality with member-specific operations
 */

const personModel = require('../models/personModel');
const memberModel = require('../models/memberModel');
const relationshipModel = require('../models/relationshipModel');

/**
 * Convert an existing person to a member
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const convertToMember = async (req, res) => {
  try {
    const { personId } = req.params;
    const memberData = req.body;
    
    // Check if person exists
    const person = await personModel.getPersonById(personId);
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    // Update person to mark as member
    await personModel.updatePerson(personId, { is_member: true });
    
    // Create member extension
    const memberExtension = await memberModel.createMemberExtension({
      person_id: personId,
      ...memberData
    });
    
    res.status(201).json({ 
      success: true, 
      data: { 
        person: { ...person, is_member: true },
        member_extension: memberExtension
      }
    });
  } catch (error) {
    console.error('Error converting to member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get member extension by person ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getMemberExtension = async (req, res) => {
  try {
    const { personId } = req.params;
    
    // Check if person exists and is a member
    const person = await personModel.getPersonById(personId);
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    if (!person.is_member) {
      return res.status(400).json({ success: false, error: 'Person is not a member' });
    }
    
    // Get member extension
    const memberExtension = await memberModel.getMemberExtensionByPersonId(personId);
    
    if (!memberExtension) {
      return res.status(404).json({ success: false, error: 'Member extension not found' });
    }
    
    res.status(200).json({ success: true, data: memberExtension });
  } catch (error) {
    console.error('Error getting member extension:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update member extension
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateMemberExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const memberData = req.body;
    
    const updatedMemberExtension = await memberModel.updateMemberExtension(id, memberData);
    
    if (!updatedMemberExtension) {
      return res.status(404).json({ success: false, error: 'Member extension not found' });
    }
    
    res.status(200).json({ success: true, data: updatedMemberExtension });
  } catch (error) {
    console.error('Error updating member extension:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * List members with filtering and pagination
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const listMembers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, assigned_to, membership_status } = req.query;
    
    // Build filters object
    const filters = {};
    if (search) filters.search = search;
    if (assigned_to) filters.assigned_to = assigned_to;
    if (membership_status) filters.membership_status = membership_status;
    
    const result = await memberModel.listMembers(filters, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Error listing members:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get full member profile with all related data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getMemberProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await memberModel.getMemberProfile(id);
    
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('Error getting member profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Record a check-in for a member
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const recordCheckIn = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get member extension ID from person ID
    const memberExt = await memberModel.getMemberExtensionByPersonId(id);
    
    if (!memberExt) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    
    // Update check-in data
    const updated = await memberModel.trackCheckIn(memberExt.id);
    
    res.status(200).json({ 
      success: true, 
      data: updated,
      message: `Check-in recorded. New streak: ${updated.attendance_streak}`
    });
  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get member network visualization data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getMemberNetwork = async (req, res) => {
  try {
    const { id } = req.params;
    const { levels = 3 } = req.query;
    
    // Check if person exists and is a member
    const person = await personModel.getPersonById(id);
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    if (!person.is_member) {
      return res.status(400).json({ success: false, error: 'Person is not a member' });
    }
    
    // Get network visualization data
    const network = await relationshipModel.getReferralNetwork(id, parseInt(levels));
    
    res.status(200).json({ success: true, data: network });
  } catch (error) {
    console.error('Error getting member network:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get referrals made by a member
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getMemberReferrals = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Check if person exists and is a member
    const person = await personModel.getPersonById(id);
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    
    // Get referral relationships
    const referrals = await relationshipModel.getReferralRelationships(
      { referrerId: id },
      parseInt(page),
      parseInt(limit)
    );
    
    res.status(200).json({ success: true, ...referrals });
  } catch (error) {
    console.error('Error getting member referrals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get member's financial summary
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getMemberFinancials = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get member extension
    const memberExt = await memberModel.getMemberExtensionByPersonId(id);
    
    if (!memberExt) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    
    // Return financial summary
    const financials = {
      lifetimeValue: memberExt.lifetime_value || 0,
      currentMonthlySpend: memberExt.current_monthly_spend || 0,
      membershipType: memberExt.membership_type,
      paymentStatus: memberExt.payment_status,
      billingDay: memberExt.billing_day,
      joinDate: memberExt.join_date,
      membershipEndDate: memberExt.membership_end_date,
      referralRewardsEarned: memberExt.referral_rewards_earned || 0
    };
    
    res.status(200).json({ success: true, data: financials });
  } catch (error) {
    console.error('Error getting member financials:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get member activity and engagement metrics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getMemberEngagement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get member extension
    const memberExt = await memberModel.getMemberExtensionByPersonId(id);
    
    if (!memberExt) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    
    // Return engagement metrics
    const engagement = {
      checkInCount: memberExt.check_in_count || 0,
      lastCheckIn: memberExt.last_check_in,
      attendanceStreak: memberExt.attendance_streak || 0,
      classesAttended: memberExt.classes_attended || [],
      satisfactionScore: memberExt.satisfaction_score,
      churnRisk: memberExt.churn_risk || 'low',
      referralCount: memberExt.referral_count || 0,
      successfulReferrals: memberExt.successful_referrals || 0
    };
    
    res.status(200).json({ success: true, data: engagement });
  } catch (error) {
    console.error('Error getting member engagement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  convertToMember,
  getMemberExtension,
  updateMemberExtension,
  listMembers,
  getMemberProfile,
  recordCheckIn,
  getMemberNetwork,
  getMemberReferrals,
  getMemberFinancials,
  getMemberEngagement
}; 