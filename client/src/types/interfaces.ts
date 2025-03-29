/**
 * TypeScript type definitions for client-side use
 * These types match the server-side TypeScript interfaces in server/db/schema/types.ts
 */

// Schema Constraints - Synced with server/db/schema/types.ts
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

// User interface
export interface User {
  id: string;
  email: string; // NOT NULL, UNIQUE constraint in SQL
  password?: string; // Only used during creation, not retrieved from DB
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'admin' | 'salesperson'; // DEFAULT 'salesperson'::text in SQL
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
  last_login?: string;
  settings?: Record<string, any>; // DEFAULT '{}'::jsonb in SQL
}

// Person interface (unified base model)
export interface Person {
  id: string;
  
  // Basic information
  first_name: string; // NOT NULL constraint in SQL
  last_name: string; // NOT NULL constraint in SQL
  email?: string;
  phone?: string;
  secondary_phone?: string;
  address?: Record<string, any>;
  dob?: string;
  gender?: string;
  
  // Contact preferences
  preferred_contact_method?: string;
  preferred_contact_times?: Record<string, any>;
  contact_frequency_preference?: string;
  do_not_contact_until?: string;
  email_opt_in?: boolean; // DEFAULT true in SQL
  sms_opt_in?: boolean; // DEFAULT true in SQL
  
  // Social profiles
  social_profiles?: Record<string, string>; // DEFAULT '{}'::jsonb in SQL
  
  // Roles and status
  is_lead?: boolean; // DEFAULT false in SQL
  is_referral?: boolean; // DEFAULT false in SQL
  is_member?: boolean; // DEFAULT false in SQL
  active_status?: boolean; // DEFAULT true in SQL
  
  // Source information
  acquisition_source?: string;
  acquisition_campaign?: string;
  acquisition_date?: string;
  utm_parameters?: Record<string, any>;
  referral_source?: string;
  
  // Shared qualification data
  interest_level?: string;
  goals?: string;
  preferred_membership?: string;
  interested_services?: string[];
  preferred_schedule?: Record<string, any>;
  special_requirements?: string;
  
  // Financial information
  budget_range?: string;
  payment_preferences?: string;
  price_sensitivity?: string;
  
  // Common fields
  profile_completeness?: number; // DEFAULT 0 in SQL
  tags?: string[];
  custom_fields?: Record<string, any>; // DEFAULT '{}'::jsonb in SQL
  
  // Meta
  assigned_to?: string;
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
  last_contacted?: string;
  next_scheduled_contact?: string;
  notes?: string;
  
  // Extension relationships
  lead_extensions?: LeadExtension[];
  referral_extensions?: ReferralExtension[];
  member_extensions?: MemberExtension[];
}

// Lead extension interface
export interface LeadExtension {
  id: string;
  person_id: string; // NOT NULL constraint in SQL
  
  // Lead qualification data
  decision_authority?: string;
  decision_timeline?: string;
  previous_experience?: string;
  competitor_considerations?: string[];
  pain_points?: string[];
  motivations?: string[];
  objections?: any[]; // jsonb[] in SQL - Array of objects
  readiness_score?: number; // SQL CHECK constraint: readiness_score >= 1 AND readiness_score <= 10
  lead_temperature?: string; // Free-form text field in SQL
  
  // Pipeline data
  lead_status?: string; // DEFAULT 'new'::text in SQL
  status_history?: any[]; // jsonb[] in SQL - Array of objects
  stage_duration_days?: Record<string, number>; // jsonb in SQL - Key-value pairs
  
  // Activity data
  visit_completed?: boolean; // DEFAULT false in SQL
  visit_date?: string;
  trial_status?: string;
  trial_start_date?: string;
  trial_end_date?: string;
  forms_completed?: Record<string, any>; // jsonb in SQL
  documents_shared?: any[]; // jsonb[] in SQL - Array of objects
  payment_info_collected?: boolean; // DEFAULT false in SQL
  
  // Conversion tracking
  conversion_probability?: number; // SQL CHECK constraint: conversion_probability >= 0 AND conversion_probability <= 100
  estimated_value?: number; // numeric in SQL
  conversion_blockers?: string[];
  
  // Meta
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
}

// Referral extension interface
export interface ReferralExtension {
  id: string;
  person_id: string; // NOT NULL constraint in SQL
  
  // Referral specific data
  relationship_to_referrer?: string;
  relationship_strength?: string; // Free-form text field in SQL
  permission_level?: string; // Free-form text field in SQL
  
  // Referral journey
  referral_status?: string; // DEFAULT 'submitted'::text in SQL
  status_history?: any[]; // jsonb[] in SQL - Array of objects
  time_in_stage_days?: Record<string, number>; // jsonb in SQL - Key-value pairs
  
  // Appointment data
  appointment_date?: string;
  appointment_status?: string;
  google_calendar_event_id?: string;
  
  // Conversion tracking
  conversion_status?: string;
  conversion_date?: string;
  conversion_probability?: number; // SQL CHECK constraint: conversion_probability >= 0 AND conversion_probability <= 100
  
  // Incentive tracking
  eligible_incentives?: any[]; // jsonb[] in SQL - Array of objects
  incentives_awarded?: any[]; // jsonb[] in SQL - Array of objects
  
  // Marketing engagement
  marketing_materials_sent?: any[]; // jsonb[] in SQL - Array of objects
  campaign_enrollments?: string[]; // text[] in SQL - Array of strings
  nurture_sequence_status?: Record<string, any>; // jsonb in SQL - Object
  
  // Meta
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
}

// Member extension interface
export interface MemberExtension {
  id: string;
  person_id: string; // NOT NULL constraint in SQL
  
  // Membership data
  membership_type?: string;
  membership_status?: string;
  join_date?: string;
  membership_end_date?: string;
  billing_day?: number; // SQL CHECK constraint: billing_day >= 1 AND billing_day <= 31
  
  // Attendance and engagement
  check_in_count?: number; // DEFAULT 0 in SQL
  last_check_in?: string;
  attendance_streak?: number; // DEFAULT 0 in SQL
  classes_attended?: any[]; // jsonb[] in SQL - Array of objects
  
  // Financial
  lifetime_value?: number; // numeric in SQL
  current_monthly_spend?: number; // numeric in SQL
  payment_status?: string;
  
  // Retention and satisfaction
  satisfaction_score?: number; // SQL CHECK constraint: satisfaction_score >= 1 AND satisfaction_score <= 10
  churn_risk?: string; // Free-form text field in SQL
  retention_actions?: any[]; // jsonb[] in SQL - Array of objects
  
  // Referral program
  referral_count?: number; // DEFAULT 0 in SQL
  successful_referrals?: number; // DEFAULT 0 in SQL
  referral_rewards_earned?: number; // DEFAULT 0 in SQL, numeric in SQL
  
  // Meta
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
}

// Relationship interface
export interface Relationship {
  id: string;
  
  // The two people in the relationship
  person_a_id: string; // NOT NULL constraint in SQL
  person_b_id: string; // NOT NULL constraint in SQL
  
  // Relationship type and direction
  relationship_type: string; // NOT NULL constraint in SQL
  direction?: string; // Free-form text field in SQL
  
  // Referral specific (when type is referral)
  referral_date?: string;
  referral_channel?: string;
  referral_campaign?: string;
  referral_link_id?: string;
  
  // Attribution
  is_primary_referrer?: boolean; // DEFAULT false in SQL
  attribution_percentage?: number; // SQL CHECK constraint: attribution_percentage >= 0 AND attribution_percentage <= 100, DEFAULT 100 in SQL
  
  // Status
  status?: string; // DEFAULT 'active'::text in SQL, free-form text field in SQL
  relationship_level?: number; // SQL CHECK constraint: relationship_level >= 1, DEFAULT 1 in SQL
  relationship_strength?: string; // Free-form text field in SQL
  
  // Meta
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
  notes?: string;
  
  // Related entities (populated by API)
  person_a?: Person;
  person_b?: Person;
}

// Interaction interface
export interface Interaction {
  id: string;
  
  // Who and what
  person_id: string; // NOT NULL constraint in SQL
  user_id?: string; // Nullable in SQL
  interaction_type?: string;
  
  // Content
  subject?: string;
  content?: string;
  attachments?: any[]; // jsonb[] type in SQL - Array of objects
  
  // Status and tracking
  status?: string; // DEFAULT 'completed'::text in SQL
  scheduled_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  
  // Response tracking
  response_received?: boolean; // DEFAULT false in SQL
  response_date?: string;
  response_content?: string;
  sentiment?: string; // Free-form text field in SQL
  
  // Association with campaigns
  campaign_id?: string;
  template_id?: string;
  
  // Meta
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
  notes?: string;
  custom_fields?: Record<string, any>; // DEFAULT '{}'::jsonb in SQL
  
  // Related entities (populated by API)
  person?: Person;
  user?: User;
}

// Message interface
export interface Message {
  id: string;
  
  // Sender and recipient
  sender_id: string; // NOT NULL constraint in SQL
  recipient_id: string; // NOT NULL constraint in SQL
  
  // Message details
  message_type: string; // NOT NULL constraint in SQL, free-form text in SQL
  subject?: string;
  content: string; // NOT NULL constraint in SQL
  
  // Status tracking
  status?: string; // DEFAULT 'sent'::text in SQL
  sent_at?: string; // DEFAULT now() in SQL
  delivered_at?: string;
  read_at?: string;
  
  // For group messages
  is_blast?: boolean; // DEFAULT false in SQL
  blast_id?: string;
  
  // Personalization and campaign info
  template_id?: string;
  personalization_data?: Record<string, any>; // jsonb in SQL
  campaign_id?: string;
  
  // Response tracking
  has_response?: boolean; // DEFAULT false in SQL
  response_id?: string;
  
  // Meta
  metadata?: Record<string, any>; // DEFAULT '{}'::jsonb in SQL
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
  
  // Related entities (populated by API)
  sender?: User;
  recipient?: Person;
  response?: Message;
} 