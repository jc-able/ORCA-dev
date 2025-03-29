/**
 * Schema Definitions
 * 
 * This file contains JavaScript objects that represent the database schema
 * to be used as reference in client-side code. These definitions match
 * the server-side TypeScript interfaces and SQL schema.
 */

/**
 * Person Schema
 * Represents the unified base model for all contacts
 */
export const PersonSchema = {
  // Basic information
  id: 'uuid',
  first_name: 'text', // NOT NULL constraint in SQL
  last_name: 'text', // NOT NULL constraint in SQL
  email: 'text',
  phone: 'text',
  secondary_phone: 'text',
  address: 'jsonb',
  dob: 'date',
  gender: 'text',
  
  // Contact preferences
  preferred_contact_method: 'text',
  preferred_contact_times: 'jsonb',
  contact_frequency_preference: 'text',
  do_not_contact_until: 'timestamp',
  email_opt_in: 'boolean',
  sms_opt_in: 'boolean',
  social_profiles: 'jsonb',
  
  // Roles and status
  is_lead: 'boolean',
  is_referral: 'boolean',
  is_member: 'boolean',
  active_status: 'boolean',
  
  // Source information
  acquisition_source: 'text',
  acquisition_campaign: 'text',
  acquisition_date: 'timestamp',
  utm_parameters: 'jsonb',
  referral_source: 'text',
  
  // Qualification data
  interest_level: 'text',
  goals: 'text',
  preferred_membership: 'text',
  interested_services: 'text[]',
  preferred_schedule: 'jsonb',
  special_requirements: 'text',
  
  // Financial information
  budget_range: 'text',
  payment_preferences: 'text',
  price_sensitivity: 'text',
  
  // Common fields
  profile_completeness: 'integer',
  tags: 'text[]',
  custom_fields: 'jsonb',
  
  // Meta
  assigned_to: 'uuid',
  created_at: 'timestamp',
  updated_at: 'timestamp',
  last_contacted: 'timestamp',
  next_scheduled_contact: 'timestamp',
  notes: 'text'
};

/**
 * Lead Extension Schema
 * Represents the lead-specific extension data
 */
export const LeadExtensionSchema = {
  // Core fields
  id: 'uuid',
  person_id: 'uuid', // NOT NULL constraint in SQL
  
  // Qualification data
  decision_authority: 'text',
  decision_timeline: 'text',
  previous_experience: 'text',
  competitor_considerations: 'text[]',
  pain_points: 'text[]',
  motivations: 'text[]',
  objections: 'jsonb[]', // Array of objects
  readiness_score: 'integer', // SQL CHECK constraint: readiness_score >= 1 AND readiness_score <= 10
  lead_temperature: 'text', // Free-form text field in SQL
  
  // Pipeline data
  lead_status: 'text', // DEFAULT 'new'::text in SQL
  status_history: 'jsonb[]', // Array of objects
  stage_duration_days: 'jsonb', // Key-value pairs
  
  // Activity data
  visit_completed: 'boolean', // DEFAULT false in SQL
  visit_date: 'timestamp',
  trial_status: 'text',
  trial_start_date: 'timestamp',
  trial_end_date: 'timestamp',
  forms_completed: 'jsonb',
  documents_shared: 'jsonb[]', // Array of objects
  payment_info_collected: 'boolean', // DEFAULT false in SQL
  
  // Conversion tracking
  conversion_probability: 'integer', // SQL CHECK constraint: conversion_probability >= 0 AND conversion_probability <= 100
  estimated_value: 'numeric',
  conversion_blockers: 'text[]',
  
  // Meta
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp' // DEFAULT now() in SQL
};

/**
 * Referral Extension Schema
 * Represents the referral-specific extension data
 */
export const ReferralExtensionSchema = {
  // Core fields
  id: 'uuid',
  person_id: 'uuid', // NOT NULL constraint in SQL
  
  // Referral specific data
  relationship_to_referrer: 'text',
  relationship_strength: 'text', // Free-form text field in SQL
  permission_level: 'text', // Free-form text field in SQL
  
  // Referral journey
  referral_status: 'text', // DEFAULT 'submitted'::text in SQL
  status_history: 'jsonb[]', // Array of objects with status transitions
  time_in_stage_days: 'jsonb', // Key-value pairs of stages and durations
  
  // Appointment data
  appointment_date: 'timestamp',
  appointment_status: 'text',
  google_calendar_event_id: 'text',
  
  // Conversion tracking
  conversion_status: 'text',
  conversion_date: 'timestamp',
  conversion_probability: 'integer', // SQL CHECK constraint: conversion_probability >= 0 AND conversion_probability <= 100
  
  // Incentive tracking
  eligible_incentives: 'jsonb[]', // Array of available incentives
  incentives_awarded: 'jsonb[]', // Array of awarded incentives
  
  // Marketing engagement
  marketing_materials_sent: 'jsonb[]', // Array of materials with tracking info
  campaign_enrollments: 'text[]', // Array of campaign identifiers
  nurture_sequence_status: 'jsonb', // Status of nurture sequences
  
  // Meta
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp' // DEFAULT now() in SQL
};

/**
 * Member Extension Schema
 * Represents the member-specific extension data
 */
export const MemberExtensionSchema = {
  // Core fields
  id: 'uuid',
  person_id: 'uuid', // NOT NULL constraint in SQL
  
  // Membership data
  membership_type: 'text',
  membership_status: 'text',
  join_date: 'timestamp',
  membership_end_date: 'timestamp',
  billing_day: 'integer', // SQL CHECK constraint: billing_day >= 1 AND billing_day <= 31
  
  // Attendance and engagement
  check_in_count: 'integer', // DEFAULT 0 in SQL
  last_check_in: 'timestamp',
  attendance_streak: 'integer', // DEFAULT 0 in SQL
  classes_attended: 'jsonb[]', // Array of class attendance records
  
  // Financial
  lifetime_value: 'numeric',
  current_monthly_spend: 'numeric',
  payment_status: 'text',
  
  // Retention and satisfaction
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
 * Relationship Schema
 * Represents relationships between people
 */
export const RelationshipSchema = {
  // Core fields
  id: 'uuid',
  
  // The two people in the relationship
  person_a_id: 'uuid', // NOT NULL constraint in SQL
  person_b_id: 'uuid', // NOT NULL constraint in SQL
  
  // Relationship type and direction
  relationship_type: 'text', // NOT NULL constraint in SQL
  direction: 'text', // Free-form text field in SQL
  
  // Referral specific (when type is referral)
  referral_date: 'timestamp',
  referral_channel: 'text',
  referral_campaign: 'text',
  referral_link_id: 'text',
  
  // Attribution
  is_primary_referrer: 'boolean', // DEFAULT false in SQL
  attribution_percentage: 'integer', // SQL CHECK constraint: attribution_percentage >= 0 AND attribution_percentage <= 100, DEFAULT 100 in SQL
  
  // Status
  status: 'text', // DEFAULT 'active'::text in SQL, free-form text field in SQL
  relationship_level: 'integer', // SQL CHECK constraint: relationship_level >= 1, DEFAULT 1 in SQL
  relationship_strength: 'text', // Free-form text field in SQL
  
  // Meta
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp', // DEFAULT now() in SQL
  notes: 'text'
};

/**
 * Interaction Schema
 * Represents interactions with persons
 */
export const InteractionSchema = {
  // Core fields
  id: 'uuid',
  
  // Who and what
  person_id: 'uuid', // NOT NULL constraint in SQL
  user_id: 'uuid', // Nullable in SQL
  interaction_type: 'text',
  
  // Content
  subject: 'text',
  content: 'text',
  attachments: 'jsonb[]', // Array of JSON objects
  
  // Status and tracking
  status: 'text', // DEFAULT 'completed'::text in SQL
  scheduled_at: 'timestamp',
  completed_at: 'timestamp',
  duration_minutes: 'integer',
  
  // Response tracking
  response_received: 'boolean', // DEFAULT false in SQL
  response_date: 'timestamp',
  response_content: 'text',
  sentiment: 'text', // Free-form text field in SQL
  
  // Association with campaigns
  campaign_id: 'text',
  template_id: 'text',
  
  // Meta
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp', // DEFAULT now() in SQL
  notes: 'text',
  custom_fields: 'jsonb' // DEFAULT '{}'::jsonb in SQL
};

/**
 * Message Schema
 * Represents messages sent to persons
 */
export const MessageSchema = {
  // Core fields
  id: 'uuid',
  
  // Sender and recipient
  sender_id: 'uuid', // NOT NULL constraint in SQL
  recipient_id: 'uuid', // NOT NULL constraint in SQL
  
  // Message details
  message_type: 'text', // NOT NULL constraint in SQL, free-form text field in SQL
  subject: 'text',
  content: 'text', // NOT NULL constraint in SQL
  
  // Status tracking
  status: 'text', // DEFAULT 'sent'::text in SQL
  sent_at: 'timestamp', // DEFAULT now() in SQL
  delivered_at: 'timestamp',
  read_at: 'timestamp',
  
  // For group messages
  is_blast: 'boolean', // DEFAULT false in SQL
  blast_id: 'uuid',
  
  // Personalization and campaign info
  template_id: 'uuid',
  personalization_data: 'jsonb', // jsonb in SQL
  campaign_id: 'text',
  
  // Response tracking
  has_response: 'boolean', // DEFAULT false in SQL
  response_id: 'uuid',
  
  // Meta
  metadata: 'jsonb', // DEFAULT '{}'::jsonb in SQL
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp' // DEFAULT now() in SQL
};

/**
 * User Schema
 * Represents system users
 */
export const UserSchema = {
  // Core fields
  id: 'uuid', // DEFAULT extensions.uuid_generate_v4() in SQL
  email: 'text', // NOT NULL, UNIQUE constraint in SQL
  password: 'text', // NOT NULL constraint in SQL
  first_name: 'text',
  last_name: 'text',
  phone: 'text',
  role: 'text', // DEFAULT 'salesperson'::text in SQL
  
  // Meta
  created_at: 'timestamp', // DEFAULT now() in SQL
  updated_at: 'timestamp', // DEFAULT now() in SQL
  last_login: 'timestamp',
  settings: 'jsonb' // DEFAULT '{}'::jsonb in SQL
};

/**
 * Schema Constraints
 * 
 * These constants represent the constraints from the database schema
 * that need to be enforced in client-side validation
 */
export const SchemaConstraints = {
  LEAD_EXTENSION: {
    READINESS_SCORE_MIN: 1,
    READINESS_SCORE_MAX: 10,
    CONVERSION_PROBABILITY_MIN: 0,
    CONVERSION_PROBABILITY_MAX: 100
  },
  REFERRAL_EXTENSION: {
    CONVERSION_PROBABILITY_MIN: 0,
    CONVERSION_PROBABILITY_MAX: 100
  },
  MEMBER_EXTENSION: {
    BILLING_DAY_MIN: 1,
    BILLING_DAY_MAX: 31,
    SATISFACTION_SCORE_MIN: 1,
    SATISFACTION_SCORE_MAX: 10
  },
  RELATIONSHIP: {
    ATTRIBUTION_PERCENTAGE_MIN: 0,
    ATTRIBUTION_PERCENTAGE_MAX: 100,
    RELATIONSHIP_LEVEL_MIN: 1
  },
  DEFAULT_VALUES: {
    LEAD_STATUS: 'new',
    REFERRAL_STATUS: 'submitted',
    RELATIONSHIP_STATUS: 'active',
    RELATIONSHIP_LEVEL: 1,
    ATTRIBUTION_PERCENTAGE: 100,
    INTERACTION_STATUS: 'completed',
    MESSAGE_STATUS: 'sent',
    IS_BLAST: false,
    HAS_RESPONSE: false,
    RESPONSE_RECEIVED: false,
    VISIT_COMPLETED: false,
    PAYMENT_INFO_COLLECTED: false,
    CHECK_IN_COUNT: 0,
    ATTENDANCE_STREAK: 0,
    REFERRAL_COUNT: 0,
    SUCCESSFUL_REFERRALS: 0,
    REFERRAL_REWARDS_EARNED: 0,
    IS_PRIMARY_REFERRER: false,
    ROLE: 'salesperson'
  }
};

export default {
  PersonSchema,
  LeadExtensionSchema,
  ReferralExtensionSchema,
  MemberExtensionSchema,
  RelationshipSchema,
  InteractionSchema,
  MessageSchema,
  UserSchema,
  SchemaConstraints
}; 