/**
 * Lead Controller
 * Handles lead-related API requests and responses
 */
const leadModel = require('../models/leadModel');

/**
 * Get all leads with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllLeads = async (req, res, next) => {
  try {
    // Extract query parameters
    const { 
      page = 0, 
      pageSize = 10,
      leadStatus,
      searchTerm,
      assignedTo 
    } = req.query;
    
    // Prepare filters
    const filters = {
      leadStatus,
      searchTerm,
      assignedTo
    };
    
    // Prepare pagination
    const pagination = {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    };
    
    // Get leads
    const leads = await leadModel.getAllLeads(filters, pagination);
    
    // Return response
    res.status(200).json({
      status: 'success',
      results: leads.length,
      data: leads
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lead by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const lead = await leadModel.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({
        status: 'error',
        message: `Lead with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new lead
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createLead = async (req, res, next) => {
  try {
    // Extract data from request body
    const { 
      // Basic person data
      first_name, 
      last_name, 
      email, 
      phone,
      secondary_phone,
      address,
      dob,
      gender,
      preferred_contact_method,
      preferred_contact_times,
      contact_frequency_preference,
      do_not_contact_until,
      email_opt_in,
      sms_opt_in,
      social_profiles,
      acquisition_source,
      acquisition_campaign,
      acquisition_date,
      utm_parameters,
      referral_source,
      interest_level,
      goals,
      preferred_membership,
      interested_services,
      preferred_schedule,
      special_requirements,
      budget_range,
      payment_preferences,
      price_sensitivity,
      tags,
      custom_fields,
      assigned_to,
      notes,
      
      // Lead extension data
      decision_authority,
      decision_timeline,
      previous_experience,
      competitor_considerations,
      pain_points,
      motivations,
      objections,
      readiness_score,
      lead_temperature,
      lead_status,
      visit_completed,
      visit_date,
      trial_status,
      trial_start_date,
      trial_end_date,
      forms_completed,
      documents_shared,
      payment_info_collected,
      conversion_probability,
      estimated_value,
      conversion_blockers
    } = req.body;
    
    // Prepare person data
    const personData = {
      first_name,
      last_name,
      email,
      phone,
      secondary_phone,
      address,
      dob,
      gender,
      preferred_contact_method,
      preferred_contact_times,
      contact_frequency_preference,
      do_not_contact_until,
      email_opt_in,
      sms_opt_in,
      social_profiles,
      acquisition_source,
      acquisition_campaign,
      acquisition_date,
      utm_parameters,
      referral_source,
      interest_level,
      goals,
      preferred_membership,
      interested_services,
      preferred_schedule,
      special_requirements,
      budget_range,
      payment_preferences,
      price_sensitivity,
      tags,
      custom_fields,
      assigned_to,
      notes,
      is_lead: true
    };
    
    // Prepare lead extension data
    const leadExtensionData = {
      decision_authority,
      decision_timeline,
      previous_experience,
      competitor_considerations,
      pain_points,
      motivations,
      objections,
      readiness_score,
      lead_temperature,
      lead_status: lead_status || 'new',
      status_history: [{
        status: lead_status || 'new',
        timestamp: new Date().toISOString(),
        notes: 'Lead created'
      }],
      visit_completed,
      visit_date,
      trial_status,
      trial_start_date,
      trial_end_date,
      forms_completed,
      documents_shared,
      payment_info_collected,
      conversion_probability,
      estimated_value,
      conversion_blockers
    };
    
    // Create lead
    const newLead = await leadModel.createLead(personData, leadExtensionData);
    
    // Return response
    res.status(201).json({
      status: 'success',
      data: newLead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a lead
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Extract person and lead extension data from request body
    const {
      // Extract the same fields as in createLead
      // Person data
      first_name,
      last_name,
      // ... all other person fields

      // Lead extension data
      decision_authority,
      decision_timeline,
      // ... all other lead extension fields
    } = req.body;
    
    // Prepare person data
    const personData = {
      first_name,
      last_name,
      // ... all other person fields updated
    };
    
    // Prepare lead extension data
    const leadExtensionData = {
      decision_authority,
      decision_timeline,
      // ... all other lead extension fields updated
    };
    
    // Update lead
    const updatedLead = await leadModel.updateLead(id, personData, leadExtensionData);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update lead status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }
    
    // Update lead status
    const updatedLead = await leadModel.updateLeadStatus(id, status);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a lead
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete lead
    await leadModel.deleteLead(id);
    
    // Return response
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
}; 