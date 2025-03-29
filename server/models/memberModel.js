/**
 * Member Extension Model
 * 
 * Handles operations related to member extensions in the database
 * The member extension model extends the person model with member-specific data
 */

const supabase = require('../config/supabase');
const { errorHandler } = require('../utils/errorHandler');
const personModel = require('./personModel');

/**
 * Standard fields for the member_extensions table, matching Supabase database structure
 * Used for validation and documentation purposes
 */
exports.memberExtensionFields = {
  // Core fields
  id: 'uuid',
  person_id: 'uuid', // NOT NULL constraint in SQL
  
  // Membership data
  membership_type: 'text',
  membership_status: 'text',
  join_date: 'timestamp',
  membership_end_date: 'timestamp',
  billing_day: 'integer', // SQL CHECK constraint: billing_day >= 1 AND billing_day <= 31
  
  // Attendance data
  check_in_count: 'integer', // DEFAULT 0 in SQL
  last_check_in: 'timestamp',
  attendance_streak: 'integer', // DEFAULT 0 in SQL
  classes_attended: 'jsonb[]', // Array of class attendance records
  
  // Financial data
  lifetime_value: 'numeric',
  current_monthly_spend: 'numeric',
  payment_status: 'text',
  
  // Retention data
  satisfaction_score: 'integer', // SQL CHECK constraint: satisfaction_score >= 1 AND satisfaction_score <= 10
  churn_risk: 'text', // Free-form text field in SQL
  retention_actions: 'jsonb[]', // Array of retention efforts
  
  // Referral program
  referral_count: 'integer', // DEFAULT 0 in SQL
  successful_referrals: 'integer', // DEFAULT 0 in SQL
  referral_rewards_earned: 'numeric', // DEFAULT 0 in SQL
  
  // Meta
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp' // DEFAULT now() in SQL
};

/**
 * Create a new member extension
 * @param {Object} memberData - Member extension data
 * @returns {Promise<Object>} Created member extension
 */
const createMemberExtension = async (memberData) => {
  try {
    const { data, error } = await supabase
      .from('member_extensions')
      .insert(memberData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw errorHandler('MemberModel.createMemberExtension', error);
  }
};

/**
 * Get member extension by person ID
 * @param {string} personId - Person ID
 * @returns {Promise<Object>} Member extension data
 */
const getMemberExtensionByPersonId = async (personId) => {
  try {
    const { data, error } = await supabase
      .from('member_extensions')
      .select('*')
      .eq('person_id', personId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned" - not an error for us
    return data || null;
  } catch (error) {
    throw errorHandler('MemberModel.getMemberExtensionByPersonId', error);
  }
};

/**
 * Update member extension
 * @param {string} id - Member extension ID
 * @param {Object} memberData - Updated member data
 * @returns {Promise<Object>} Updated member extension
 */
const updateMemberExtension = async (id, memberData) => {
  try {
    const { data, error } = await supabase
      .from('member_extensions')
      .update(memberData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw errorHandler('MemberModel.updateMemberExtension', error);
  }
};

/**
 * Delete member extension
 * @param {string} id - Member extension ID
 * @returns {Promise<boolean>} Success status
 */
const deleteMemberExtension = async (id) => {
  try {
    const { error } = await supabase
      .from('member_extensions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    throw errorHandler('MemberModel.deleteMemberExtension', error);
  }
};

/**
 * List members with filtering
 * @param {Object} filters - Query filters
 * @param {number} page - Page number for pagination
 * @param {number} limit - Results per page
 * @returns {Promise<Object>} Paginated members list
 */
const listMembers = async (filters = {}, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    
    // Start with the persons table that have is_member flag
    let query = supabase
      .from('persons')
      .select(`
        *,
        member_extensions(*)
      `)
      .eq('is_member', true)
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    
    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    
    if (filters.membership_status) {
      query = query.eq('member_extensions.membership_status', filters.membership_status);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Also get total count for pagination
    const { count, error: countError } = await supabase
      .from('persons')
      .select('*', { count: 'exact', head: true })
      .eq('is_member', true);
      
    if (countError) throw countError;
    
    return {
      members: data || [],
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    throw errorHandler('MemberModel.listMembers', error);
  }
};

/**
 * Get full member profile with all related data
 * @param {string} id - Person ID
 * @returns {Promise<Object>} Complete member profile
 */
const getMemberProfile = async (id) => {
  try {
    // Get person data with member extension
    const { data: member, error } = await supabase
      .from('persons')
      .select(`
        *,
        member_extensions(*),
        assigned_to:users(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .eq('is_member', true)
      .single();
    
    if (error) throw error;
    
    // Get relationships (referrals made by this member)
    const { data: referrals, error: referralsError } = await supabase
      .from('relationships')
      .select(`
        *,
        referred_person:persons!person_b_id(id, first_name, last_name, email, phone)
      `)
      .eq('person_a_id', id)
      .eq('relationship_type', 'referral');
    
    if (referralsError) throw referralsError;
    
    // Get interactions
    const { data: interactions, error: interactionsError } = await supabase
      .from('interactions')
      .select('*')
      .eq('person_id', id)
      .order('created_at', { ascending: false });
    
    if (interactionsError) throw interactionsError;
    
    return {
      ...member,
      referrals: referrals || [],
      interactions: interactions || []
    };
  } catch (error) {
    throw errorHandler('MemberModel.getMemberProfile', error);
  }
};

/**
 * Track a check-in for a member
 * @param {string} memberId - Member extension ID
 * @returns {Promise<Object>} Updated member extension
 */
const trackCheckIn = async (memberId) => {
  try {
    // First get current check-in data
    const { data: member, error: fetchError } = await supabase
      .from('member_extensions')
      .select('check_in_count, last_check_in, attendance_streak')
      .eq('id', memberId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Calculate new values
    const lastCheckIn = new Date(member.last_check_in || 0);
    const today = new Date();
    
    // Check if last check-in was yesterday (for streak)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isConsecutiveDay = 
      lastCheckIn.getFullYear() === yesterday.getFullYear() &&
      lastCheckIn.getMonth() === yesterday.getMonth() &&
      lastCheckIn.getDate() === yesterday.getDate();
    
    let attendanceStreak = member.attendance_streak || 0;
    
    // If consecutive day, increase streak, otherwise reset to 1
    if (isConsecutiveDay) {
      attendanceStreak++;
    } else if (!member.last_check_in) {
      // First check-in
      attendanceStreak = 1;
    } else {
      // Not consecutive, reset streak
      attendanceStreak = 1;
    }
    
    // Update check-in data
    const { data, error } = await supabase
      .from('member_extensions')
      .update({
        check_in_count: (member.check_in_count || 0) + 1,
        last_check_in: new Date().toISOString(),
        attendance_streak: attendanceStreak
      })
      .eq('id', memberId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw errorHandler('MemberModel.trackCheckIn', error);
  }
};

/**
 * Get all members with filtering options
 * @param {Object} filters - Optional query filters
 * @param {String} filters.membershipType - Filter by membership type
 * @param {String} filters.membershipStatus - Filter by membership status
 * @param {String} filters.paymentStatus - Filter by payment status
 * @param {String} filters.churnRisk - Filter by churn risk level
 * @param {String} filters.searchTerm - Search by name, email, or phone
 * @param {UUID} filters.assignedTo - Filter by assigned user
 * @param {Boolean} filters.hasReferrals - Filter for members who have made referrals
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of member records
 */
exports.getAllMembers = async (filters = {}, pagination = { page: 0, pageSize: 10 }) => {
  try {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    // Query to get members with all extensions
    let query = supabase
      .from('persons')
      .select(`
        *,
        member_extensions (*)
      `)
      .eq('is_member', true)
      .range(from, to);
    
    // Apply person table filters
    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }
    
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    let filteredMembers = data;
    
    // Apply member_extensions table filters
    if (filters.membershipType) {
      filteredMembers = filteredMembers.filter(member => 
        member.member_extensions && 
        member.member_extensions.length > 0 && 
        member.member_extensions[0].membership_type === filters.membershipType
      );
    }
    
    if (filters.membershipStatus) {
      filteredMembers = filteredMembers.filter(member => 
        member.member_extensions && 
        member.member_extensions.length > 0 && 
        member.member_extensions[0].membership_status === filters.membershipStatus
      );
    }
    
    if (filters.paymentStatus) {
      filteredMembers = filteredMembers.filter(member => 
        member.member_extensions && 
        member.member_extensions.length > 0 && 
        member.member_extensions[0].payment_status === filters.paymentStatus
      );
    }
    
    if (filters.churnRisk) {
      filteredMembers = filteredMembers.filter(member => 
        member.member_extensions && 
        member.member_extensions.length > 0 && 
        member.member_extensions[0].churn_risk === filters.churnRisk
      );
    }
    
    if (filters.hasReferrals !== undefined) {
      filteredMembers = filteredMembers.filter(member => {
        const hasReferrals = member.member_extensions && 
                             member.member_extensions.length > 0 && 
                             (member.member_extensions[0].referral_count || 0) > 0;
        return filters.hasReferrals ? hasReferrals : !hasReferrals;
      });
    }
    
    return filteredMembers;
  } catch (error) {
    console.error('Error in getAllMembers:', error);
    throw error;
  }
};

/**
 * Get member by ID
 * @param {UUID} id - Member ID (person_id)
 * @returns {Promise<Object>} Member record
 */
exports.getMemberById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('persons')
      .select(`
        *,
        member_extensions (*),
        relationships (
          *,
          referred_person:person_b_id (id, first_name, last_name, email, phone, is_member)
        )
      `)
      .eq('id', id)
      .eq('is_member', true)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getMemberById:', error);
    throw error;
  }
};

/**
 * Create a new member
 * @param {Object} personData - Core person data
 * @param {Object} memberExtensionData - Member-specific data
 * @returns {Promise<Object>} Created member
 */
exports.createMember = async (personData, memberExtensionData = {}) => {
  try {
    // Ensure member flag is set
    const memberPersonData = {
      ...personData,
      is_member: true
    };
    
    // Set default membership status if not provided
    const memberExtData = {
      ...memberExtensionData,
      membership_status: memberExtensionData.membership_status || 'active',
      join_date: memberExtensionData.join_date || new Date().toISOString(),
      check_in_count: memberExtensionData.check_in_count || 0,
      referral_count: memberExtensionData.referral_count || 0,
      successful_referrals: memberExtensionData.successful_referrals || 0,
      referral_rewards_earned: memberExtensionData.referral_rewards_earned || 0
    };
    
    // Create person with member extension
    return await personModel.createPerson(memberPersonData, { memberExtension: memberExtData });
  } catch (error) {
    console.error('Error in createMember:', error);
    throw error;
  }
};

/**
 * Update a member
 * @param {UUID} id - Member ID (person_id)
 * @param {Object} personData - Core person data to update
 * @param {Object} memberExtensionData - Member-specific data to update
 * @returns {Promise<Object>} Updated member
 */
exports.updateMember = async (id, personData = {}, memberExtensionData = {}) => {
  try {
    // Update the member
    return await personModel.updatePerson(id, personData, { memberExtension: memberExtensionData });
  } catch (error) {
    console.error('Error in updateMember:', error);
    throw error;
  }
};

/**
 * Delete a member
 * @param {UUID} id - Member ID (person_id)
 * @returns {Promise<Boolean>} True if successful
 */
exports.deleteMember = async (id) => {
  try {
    return await personModel.deletePerson(id);
  } catch (error) {
    console.error('Error in deleteMember:', error);
    throw error;
  }
};

/**
 * Record a check-in for a member
 * @param {UUID} id - Member ID (person_id)
 * @param {Date} checkInDate - Date of check-in (defaults to now)
 * @returns {Promise<Object>} Updated member
 */
exports.recordCheckIn = async (id, checkInDate = new Date().toISOString()) => {
  try {
    // Get current member data
    const member = await exports.getMemberById(id);
    
    if (!member || !member.member_extensions || member.member_extensions.length === 0) {
      throw new Error(`Member with ID ${id} not found or has no member extension`);
    }
    
    const extension = member.member_extensions[0];
    
    // Calculate new check-in count
    const checkInCount = (extension.check_in_count || 0) + 1;
    
    // Calculate streak
    const lastCheckIn = extension.last_check_in ? new Date(extension.last_check_in) : null;
    const currentCheckIn = new Date(checkInDate);
    let streak = extension.attendance_streak || 0;
    
    if (lastCheckIn) {
      // Check if this is a consecutive day (allowing for 1 day gap)
      const dayDiff = Math.floor((currentCheckIn - lastCheckIn) / (1000 * 60 * 60 * 24));
      
      if (dayDiff <= 2) { // Same day or consecutive day
        streak += 1;
      } else { // Streak broken
        streak = 1;
      }
    } else {
      // First check-in
      streak = 1;
    }
    
    // Add to classes_attended if class_id is provided
    let classesAttended = extension.classes_attended || [];
    
    // Update member extension
    const memberExtensionData = {
      check_in_count: checkInCount,
      last_check_in: checkInDate,
      attendance_streak: streak,
      classes_attended: classesAttended
    };
    
    return await exports.updateMember(id, {}, memberExtensionData);
  } catch (error) {
    console.error('Error in recordCheckIn:', error);
    throw error;
  }
};

/**
 * Get members with referrals
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of members with referral data
 */
exports.getMembersWithReferrals = async (pagination = { page: 0, pageSize: 10 }) => {
  try {
    return await exports.getAllMembers({ hasReferrals: true }, pagination);
  } catch (error) {
    console.error('Error in getMembersWithReferrals:', error);
    throw error;
  }
};

/**
 * Get referrals made by a member
 * @param {UUID} memberId - Member ID
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of referrals made by the member
 */
exports.getMemberReferrals = async (memberId, pagination = { page: 0, pageSize: 10 }) => {
  try {
    // Get all relationships where member is the referrer
    const { data: relationships, error: relError } = await supabase
      .from('relationships')
      .select(`
        *,
        referred_person:person_b_id (
          *,
          referral_extensions (*),
          lead_extensions (*),
          member_extensions (*)
        )
      `)
      .eq('person_a_id', memberId)
      .eq('relationship_type', 'referral')
      .order('created_at', { ascending: false });
    
    if (relError) {
      throw relError;
    }
    
    // Apply pagination manually
    const { page, pageSize } = pagination;
    const start = page * pageSize;
    const end = start + pageSize;
    
    return relationships.slice(start, end).map(rel => ({
      relationship: {
        id: rel.id,
        referral_date: rel.referral_date,
        referral_channel: rel.referral_channel,
        referral_campaign: rel.referral_campaign,
        is_primary_referrer: rel.is_primary_referrer,
        status: rel.status
      },
      person: rel.referred_person
    }));
  } catch (error) {
    console.error('Error in getMemberReferrals:', error);
    throw error;
  }
};

/**
 * Record a referral for a member
 * @param {UUID} memberId - Member ID who made the referral
 * @param {UUID} referralId - Person ID who was referred
 * @param {Object} relationshipData - Additional relationship data
 * @returns {Promise<Object>} Updated member with referral stats
 */
exports.recordReferral = async (memberId, referralId, relationshipData = {}) => {
  try {
    // Create the relationship first
    const relationship = {
      person_a_id: memberId,
      person_b_id: referralId,
      relationship_type: 'referral',
      direction: 'a_to_b',
      referral_date: relationshipData.referral_date || new Date().toISOString(),
      referral_channel: relationshipData.referral_channel || 'direct',
      referral_campaign: relationshipData.referral_campaign,
      referral_link_id: relationshipData.referral_link_id,
      is_primary_referrer: true,
      status: 'active'
    };
    
    // Create the relationship
    const { error: relError } = await supabase
      .from('relationships')
      .insert(relationship);
    
    if (relError) {
      throw relError;
    }
    
    // Update the member's referral count
    const member = await exports.getMemberById(memberId);
    
    if (!member || !member.member_extensions || member.member_extensions.length === 0) {
      throw new Error(`Member with ID ${memberId} not found or has no member extension`);
    }
    
    const extension = member.member_extensions[0];
    const referralCount = (extension.referral_count || 0) + 1;
    
    // Update member extension
    const memberExtensionData = {
      referral_count: referralCount
    };
    
    return await exports.updateMember(memberId, {}, memberExtensionData);
  } catch (error) {
    console.error('Error in recordReferral:', error);
    throw error;
  }
};

/**
 * Get member statistics
 * @param {Object} filters - Optional filters like date range
 * @returns {Promise<Object>} Member statistics
 */
exports.getMemberStats = async (filters = {}) => {
  try {
    let query = supabase
      .from('member_extensions')
      .select('membership_type, membership_status, churn_risk, payment_status');
    
    // Apply date filters if provided
    if (filters.startDate && filters.endDate) {
      query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Count by membership type
    const countByType = data.reduce((acc, member) => {
      const type = member.membership_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Count by membership status
    const countByStatus = data.reduce((acc, member) => {
      const status = member.membership_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Count by churn risk
    const countByChurnRisk = data.reduce((acc, member) => {
      const risk = member.churn_risk || 'unknown';
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {});
    
    // Count by payment status
    const countByPaymentStatus = data.reduce((acc, member) => {
      const status = member.payment_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Get total member count
    const totalMembers = data.length;
    
    // Get active member count
    const activeMembers = data.filter(member => member.membership_status === 'active').length;
    
    // Calculate active rate
    const activeRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;
    
    return {
      total: totalMembers,
      active: activeMembers,
      activeRate: activeRate.toFixed(2) + '%',
      byType: countByType,
      byStatus: countByStatus,
      byChurnRisk: countByChurnRisk,
      byPaymentStatus: countByPaymentStatus
    };
  } catch (error) {
    console.error('Error in getMemberStats:', error);
    throw error;
  }
};

module.exports = {
  createMemberExtension,
  getMemberExtensionByPersonId,
  updateMemberExtension,
  deleteMemberExtension,
  listMembers,
  getMemberProfile,
  trackCheckIn,
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  recordCheckIn,
  getMembersWithReferrals,
  getMemberReferrals,
  recordReferral,
  getMemberStats
}; 