/**
 * TypeScript type definitions for the database schema
 * These types match the tables defined in the migrations
 */

// Schema Constraints
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

// User model
export interface User {
  id: string;
  email: string; // NOT NULL, UNIQUE constraint in SQL
  password: string; // NOT NULL constraint in SQL, only used during creation, not retrieved from DB 
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'admin' | 'salesperson'; // DEFAULT 'salesperson'::text in SQL
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
  last_login?: string;
  settings?: Record<string, any>; // DEFAULT '{}'::jsonb in SQL
}

// Person model (unified base model)
export interface Person {
  id: string;
  
  // Basic information
  first_name: string; // NOT NULL constraint in SQL
  last_name: string; // NOT NULL constraint in SQL
  email?: string;
  phone?: string;
  secondary_phone?: string;
  address?: Record<string, any>; // jsonb in SQL
  dob?: string; // date in SQL
  gender?: string;
  
  // Contact preferences
  preferred_contact_method?: string;
  preferred_contact_times?: Record<string, any>; // jsonb in SQL
  contact_frequency_preference?: string;
  do_not_contact_until?: string; // timestamp with time zone in SQL
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
  acquisition_date?: string; // timestamp with time zone in SQL
  utm_parameters?: Record<string, any>; // jsonb in SQL
  referral_source?: string;
  
  // Shared qualification data
  interest_level?: string;
  goals?: string;
  preferred_membership?: string;
  interested_services?: string[]; // text[] in SQL
  preferred_schedule?: Record<string, any>; // jsonb in SQL
  special_requirements?: string;
  
  // Financial information
  budget_range?: string;
  payment_preferences?: string;
  price_sensitivity?: string;
  
  // Common fields
  profile_completeness?: number; // DEFAULT 0 in SQL
  tags?: string[]; // text[] in SQL
  custom_fields?: Record<string, any>; // DEFAULT '{}'::jsonb in SQL
  
  // Meta
  assigned_to?: string; // foreign key to users(id)
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
  last_contacted?: string; // timestamp with time zone in SQL
  next_scheduled_contact?: string; // timestamp with time zone in SQL
  notes?: string;
}

// Lead extension model
export interface LeadExtension {
  id: string;
  person_id: string; // NOT NULL constraint in SQL, foreign key to persons(id) ON DELETE CASCADE
  
  // Lead qualification data
  decision_authority?: string;
  decision_timeline?: string;
  previous_experience?: string;
  competitor_considerations?: string[]; // text[] in SQL
  pain_points?: string[]; // text[] in SQL
  motivations?: string[]; // text[] in SQL
  objections?: any[]; // jsonb[] in SQL
  readiness_score?: number; // SQL CHECK constraint: readiness_score >= 1 AND readiness_score <= 10
  lead_temperature?: string; // Free-form text field in SQL
  
  // Pipeline data
  lead_status?: string; // DEFAULT 'new'::text in SQL
  status_history?: any[]; // jsonb[] in SQL
  stage_duration_days?: Record<string, number>; // jsonb in SQL
  
  // Activity data
  visit_completed?: boolean; // DEFAULT false in SQL
  visit_date?: string; // timestamp with time zone in SQL
  trial_status?: string;
  trial_start_date?: string; // timestamp with time zone in SQL
  trial_end_date?: string; // timestamp with time zone in SQL
  forms_completed?: Record<string, any>; // jsonb in SQL
  documents_shared?: any[]; // jsonb[] in SQL
  payment_info_collected?: boolean; // DEFAULT false in SQL
  
  // Conversion tracking
  conversion_probability?: number; // SQL CHECK constraint: conversion_probability >= 0 AND conversion_probability <= 100
  estimated_value?: number; // numeric in SQL
  conversion_blockers?: string[]; // text[] in SQL
  
  // Meta
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
}

// Referral extension model
export interface ReferralExtension {
  id: string;
  person_id: string; // NOT NULL constraint in SQL, foreign key to persons(id) ON DELETE CASCADE
  
  // Referral specific data
  relationship_to_referrer?: string;
  relationship_strength?: string; // Free-form text field in SQL
  permission_level?: string; // Free-form text field in SQL
  
  // Referral journey
  referral_status?: string; // DEFAULT 'submitted'::text in SQL
  status_history?: any[]; // jsonb[] in SQL
  time_in_stage_days?: Record<string, number>; // jsonb in SQL
  
  // Appointment data
  appointment_date?: string; // timestamp with time zone in SQL
  appointment_status?: string;
  google_calendar_event_id?: string;
  
  // Conversion tracking
  conversion_status?: string;
  conversion_date?: string; // timestamp with time zone in SQL
  conversion_probability?: number; // SQL CHECK constraint: conversion_probability >= 0 AND conversion_probability <= 100
  
  // Incentive tracking
  eligible_incentives?: any[]; // jsonb[] in SQL
  incentives_awarded?: any[]; // jsonb[] in SQL
  
  // Marketing engagement
  marketing_materials_sent?: any[]; // jsonb[] in SQL
  campaign_enrollments?: string[]; // text[] in SQL
  nurture_sequence_status?: Record<string, any>; // jsonb in SQL
  
  // Meta
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
}

// Member extension model
export interface MemberExtension {
  id: string;
  person_id: string; // NOT NULL constraint in SQL, foreign key to persons(id) ON DELETE CASCADE
  
  // Membership data
  membership_type?: string;
  membership_status?: string;
  join_date?: string; // timestamp with time zone in SQL
  membership_end_date?: string; // timestamp with time zone in SQL
  billing_day?: number; // SQL CHECK constraint: billing_day >= 1 AND billing_day <= 31
  
  // Attendance and engagement
  check_in_count?: number; // DEFAULT 0 in SQL
  last_check_in?: string; // timestamp with time zone in SQL
  attendance_streak?: number; // DEFAULT 0 in SQL
  classes_attended?: any[]; // jsonb[] in SQL
  
  // Financial
  lifetime_value?: number; // numeric in SQL
  current_monthly_spend?: number; // numeric in SQL
  payment_status?: string;
  
  // Retention and satisfaction
  satisfaction_score?: number; // SQL CHECK constraint: satisfaction_score >= 1 AND satisfaction_score <= 10
  churn_risk?: string; // Free-form text field in SQL
  retention_actions?: any[]; // jsonb[] in SQL
  
  // Referral program
  referral_count?: number; // DEFAULT 0 in SQL
  successful_referrals?: number; // DEFAULT 0 in SQL
  referral_rewards_earned?: number; // DEFAULT 0 in SQL, numeric in SQL
  
  // Meta
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
}

// Relationship model
export interface Relationship {
  id: string;
  
  // The two people in the relationship
  person_a_id: string; // NOT NULL constraint in SQL, foreign key to persons(id) ON DELETE CASCADE
  person_b_id: string; // NOT NULL constraint in SQL, foreign key to persons(id) ON DELETE CASCADE
  
  // Relationship type and direction
  relationship_type: string; // NOT NULL constraint in SQL
  direction?: string; // Free-form text field in SQL
  
  // Referral specific (when type is referral)
  referral_date?: string; // timestamp with time zone in SQL
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
}

// Interaction model
export interface Interaction {
  id: string;
  
  // Who and what
  person_id: string; // NOT NULL constraint in SQL, foreign key to persons(id) ON DELETE CASCADE
  user_id?: string; // Nullable in SQL, foreign key to users(id)
  interaction_type?: string;
  
  // Content
  subject?: string;
  content?: string;
  attachments?: any[]; // jsonb[] type in SQL
  
  // Status and tracking
  status?: string; // DEFAULT 'completed'::text in SQL
  scheduled_at?: string; // timestamp with time zone in SQL
  completed_at?: string; // timestamp with time zone in SQL
  duration_minutes?: number;
  
  // Response tracking
  response_received?: boolean; // DEFAULT false in SQL
  response_date?: string; // timestamp with time zone in SQL
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
}

// Message model
export interface Message {
  id: string;
  
  // Sender and recipient
  sender_id: string; // NOT NULL constraint in SQL, foreign key to users(id)
  recipient_id: string; // NOT NULL constraint in SQL, foreign key to persons(id)
  
  // Message details
  message_type: string; // NOT NULL constraint in SQL, free-form text in SQL
  subject?: string;
  content: string; // NOT NULL constraint in SQL
  
  // Status tracking
  status?: string; // DEFAULT 'sent'::text in SQL
  sent_at?: string; // DEFAULT now() in SQL, timestamp with time zone in SQL
  delivered_at?: string; // timestamp with time zone in SQL
  read_at?: string; // timestamp with time zone in SQL
  
  // For group messages
  is_blast?: boolean; // DEFAULT false in SQL
  blast_id?: string;
  
  // Personalization and campaign info
  template_id?: string;
  personalization_data?: Record<string, any>; // jsonb in SQL
  campaign_id?: string;
  
  // Response tracking
  has_response?: boolean; // DEFAULT false in SQL
  response_id?: string; // foreign key to messages(id) ON DELETE SET NULL
  
  // Meta
  metadata?: Record<string, any>; // DEFAULT '{}'::jsonb in SQL
  created_at?: string; // DEFAULT now() in SQL
  updated_at?: string; // DEFAULT now() in SQL
} 