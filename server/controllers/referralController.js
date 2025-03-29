/**
 * Referral Controller
 * Handles referral-related API requests and responses
 */
const referralModel = require('../models/referralModel');
const personModel = require('../models/personModel');
const { v4: uuidv4 } = require('uuid');
const firebase = require('firebase-admin');
const { google } = require('googleapis');

/**
 * Get all referrals with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllReferrals = async (req, res, next) => {
  try {
    // Extract query parameters
    const { 
      page = 0, 
      pageSize = 10,
      referralStatus,
      searchTerm,
      assignedTo,
      referrerId,
      dateFrom,
      dateTo
    } = req.query;
    
    // Prepare filters
    const filters = {
      referralStatus,
      searchTerm,
      assignedTo,
      referrerId,
      dateFrom,
      dateTo
    };
    
    // Prepare pagination
    const pagination = {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    };
    
    // Get referrals
    const referrals = await referralModel.getAllReferrals(filters, pagination);
    
    // Return response
    res.status(200).json({
      status: 'success',
      results: referrals.length,
      data: referrals
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getReferralById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const referral = await referralModel.getReferralById(id);
    
    if (!referral) {
      return res.status(404).json({
        status: 'error',
        message: `Referral with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: referral
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new referral
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createReferral = async (req, res, next) => {
  try {
    // Extract person and referral extension data from request body
    const {
      // Person data
      first_name,
      last_name,
      email,
      phone,
      // ... other person fields
      
      // Referral extension data
      relationship_to_referrer,
      relationship_strength,
      permission_level,
      referral_status,
      appointment_date,
      // ... other referral extension fields
      
      // Relationship data
      referrer_id,
      referral_channel,
      referral_campaign,
      referral_link_id
    } = req.body;
    
    // Prepare person data
    const personData = {
      first_name,
      last_name,
      email,
      phone,
      // Set required flags for a referral
      is_referral: true,
      acquisition_source: 'Referral',
      // ... other person fields
    };
    
    // Prepare referral extension data
    const referralExtensionData = {
      relationship_to_referrer,
      relationship_strength,
      permission_level,
      referral_status: referral_status || 'submitted',
      appointment_date,
      // ... other referral extension fields
    };
    
    // Prepare relationship data
    const relationshipData = {
      referrer_id,
      referral_channel,
      referral_campaign,
      referral_link_id
    };
    
    // Create referral
    const newReferral = await referralModel.createReferral(
      personData, 
      referralExtensionData,
      relationshipData
    );
    
    // Return response
    res.status(201).json({
      status: 'success',
      data: newReferral
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a referral
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateReferral = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Extract person and referral extension data from request body
    const {
      // Person data
      first_name,
      last_name,
      email,
      phone,
      // ... other person fields
      
      // Referral extension data
      relationship_to_referrer,
      relationship_strength,
      permission_level,
      referral_status,
      appointment_date,
      // ... other referral extension fields
    } = req.body;
    
    // Prepare person data
    const personData = {
      first_name,
      last_name,
      email,
      phone,
      // ... other person fields
    };
    
    // Prepare referral extension data
    const referralExtensionData = {
      relationship_to_referrer,
      relationship_strength,
      permission_level,
      referral_status,
      appointment_date,
      // ... other referral extension fields
    };
    
    // Update referral
    const updatedReferral = await referralModel.updateReferral(
      id, 
      personData, 
      referralExtensionData
    );
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: updatedReferral
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a referral
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteReferral = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete referral
    await referralModel.deleteReferral(id);
    
    // Return response
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a new referral link for a member
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.generateReferralLink = async (req, res, next) => {
  try {
    const { memberId, campaignId } = req.body;
    
    if (!memberId) {
      return res.status(400).json({
        status: 'error',
        message: 'Member ID is required'
      });
    }
    
    // Check if member exists
    const member = await personModel.getPersonById(memberId);
    
    if (!member || !member.is_member) {
      return res.status(404).json({
        status: 'error',
        message: `Member with ID ${memberId} not found or is not a member`
      });
    }
    
    // Generate a unique ID for this referral link
    const linkId = uuidv4();
    
    // In a real implementation, we would use Firebase Dynamic Links
    // For now, create a mock link
    const linkData = {
      id: linkId,
      memberId,
      campaignId,
      created_at: new Date().toISOString(),
      url: `https://orca.app/r/${linkId}?ref=${memberId}${campaignId ? `&campaign=${campaignId}` : ''}`
    };
    
    // Save the link in the database
    const newLink = await referralModel.createReferralLink(linkData);
    
    // Return response
    res.status(201).json({
      status: 'success',
      data: newLink
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral link details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getReferralLinkById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const link = await referralModel.getReferralLinkById(id);
    
    if (!link) {
      return res.status(404).json({
        status: 'error',
        message: `Referral link with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: link
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral network for a person
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getReferralNetwork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { depth = 2 } = req.query; // How many levels deep to fetch
    
    // Get the network
    const network = await referralModel.getReferralNetwork(id, parseInt(depth, 10));
    
    if (!network) {
      return res.status(404).json({
        status: 'error',
        message: `Person with ID ${id} not found or has no referral network`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: network
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule an appointment for a referral
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.scheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      appointmentDate,
      duration = 60, // in minutes
      notes,
      salesPersonId
    } = req.body;
    
    if (!appointmentDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Appointment date is required'
      });
    }
    
    // In a real implementation, we would use Google Calendar API
    // For now, create a mock appointment
    const appointmentData = {
      referralId: id,
      appointmentDate,
      duration,
      notes,
      salesPersonId,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    
    // Save the appointment in the database
    const appointment = await referralModel.scheduleAppointment(id, appointmentData);
    
    // Update referral status
    await referralModel.updateReferralStatus(id, 'appointment_scheduled');
    
    // Return response
    res.status(201).json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointment details for a referral
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAppointmentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const appointment = await referralModel.getAppointmentByReferralId(id);
    
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: `No appointment found for referral with ID ${id}`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update appointment details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      appointmentDate,
      duration,
      notes,
      status
    } = req.body;
    
    // Prepare appointment data
    const appointmentData = {
      appointmentDate,
      duration,
      notes,
      status,
      updated_at: new Date().toISOString()
    };
    
    // Update the appointment
    const updatedAppointment = await referralModel.updateAppointment(id, appointmentData);
    
    if (!updatedAppointment) {
      return res.status(404).json({
        status: 'error',
        message: `No appointment found for referral with ID ${id}`
      });
    }
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: updatedAppointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an appointment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Cancel the appointment
    await referralModel.cancelAppointment(id, reason);
    
    // Return response
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Convert a referral to a member
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.convertToMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      membershipType,
      membershipStatus,
      joinDate = new Date().toISOString(),
      billingDay,
      paymentStatus,
      // ... other member fields
    } = req.body;
    
    // Prepare member extension data
    const memberExtensionData = {
      membership_type: membershipType,
      membership_status: membershipStatus || 'active',
      join_date: joinDate,
      billing_day: billingDay,
      payment_status: paymentStatus || 'pending',
      // ... other member fields
    };
    
    // Convert referral to member
    const convertedMember = await referralModel.convertToMember(id, memberExtensionData);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: convertedMember
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getReferralStats = async (req, res, next) => {
  try {
    const { 
      dateFrom, 
      dateTo,
      salesPersonId
    } = req.query;
    
    // Get statistics
    const stats = await referralModel.getReferralStats(dateFrom, dateTo, salesPersonId);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
}; 