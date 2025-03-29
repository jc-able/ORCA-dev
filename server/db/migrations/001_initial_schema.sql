-- ORCA Lead Management Software Database Schema
-- Initial Migration (v1.0)

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Will be hashed by Supabase Auth
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'salesperson',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb
);

-- Create the persons table (unified base model)
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  secondary_phone TEXT,
  address JSONB,
  dob DATE,
  gender TEXT,
  
  -- Contact preferences
  preferred_contact_method TEXT,
  preferred_contact_times JSONB,
  contact_frequency_preference TEXT,
  do_not_contact_until TIMESTAMPTZ,
  email_opt_in BOOLEAN DEFAULT TRUE,
  sms_opt_in BOOLEAN DEFAULT TRUE,
  
  -- Social profiles
  social_profiles JSONB DEFAULT '{}'::jsonb,
  
  -- Roles and status
  is_lead BOOLEAN DEFAULT FALSE,
  is_referral BOOLEAN DEFAULT FALSE,
  is_member BOOLEAN DEFAULT FALSE,
  active_status BOOLEAN DEFAULT TRUE,
  
  -- Source information
  acquisition_source TEXT,
  acquisition_campaign TEXT,
  acquisition_date TIMESTAMPTZ,
  utm_parameters JSONB,
  referral_source TEXT,
  
  -- Shared qualification data
  interest_level TEXT,
  goals TEXT,
  preferred_membership TEXT,
  interested_services TEXT[],
  preferred_schedule JSONB,
  special_requirements TEXT,
  
  -- Financial information
  budget_range TEXT,
  payment_preferences TEXT,
  price_sensitivity TEXT,
  
  -- Common fields
  profile_completeness INTEGER DEFAULT 0,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  -- Meta
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted TIMESTAMPTZ,
  next_scheduled_contact TIMESTAMPTZ,
  notes TEXT
);

-- Create the lead_extensions table
CREATE TABLE lead_extensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  
  -- Lead qualification data
  decision_authority TEXT,
  decision_timeline TEXT,
  previous_experience TEXT,
  competitor_considerations TEXT[],
  pain_points TEXT[],
  motivations TEXT[],
  objections JSONB[], -- [{objection: string, response: string, resolved: boolean}]
  readiness_score INTEGER, -- 1-10
  lead_temperature TEXT, -- hot, warm, cold
  
  -- Pipeline data
  lead_status TEXT DEFAULT 'new',
  status_history JSONB[], -- [{status: string, timestamp: timestamp, notes: string}]
  stage_duration_days JSONB, -- {stage_name: days_count}
  
  -- Activity data
  visit_completed BOOLEAN DEFAULT FALSE,
  visit_date TIMESTAMPTZ,
  trial_status TEXT,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  forms_completed JSONB,
  documents_shared JSONB[], -- [{name: string, url: string, shared_date: timestamp}]
  payment_info_collected BOOLEAN DEFAULT FALSE,
  
  -- Conversion tracking
  conversion_probability INTEGER, -- 0-100
  estimated_value DECIMAL,
  conversion_blockers TEXT[],
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the referral_extensions table
CREATE TABLE referral_extensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  
  -- Referral specific data
  relationship_to_referrer TEXT, -- friend, family, colleague, etc.
  relationship_strength TEXT, -- strong, medium, weak
  permission_level TEXT, -- explicit, implied, cold
  
  -- Referral journey
  referral_status TEXT DEFAULT 'submitted', -- submitted, contacted, appointment_scheduled, etc.
  status_history JSONB[], -- [{status: string, timestamp: timestamp, notes: string}]
  time_in_stage_days JSONB, -- {stage_name: days_count}
  
  -- Appointment data
  appointment_date TIMESTAMPTZ,
  appointment_status TEXT,
  google_calendar_event_id TEXT,
  
  -- Conversion tracking
  conversion_status TEXT,
  conversion_date TIMESTAMPTZ,
  conversion_probability INTEGER, -- 0-100
  
  -- Incentive tracking
  eligible_incentives JSONB[],
  incentives_awarded JSONB[], -- [{incentive_id: uuid, award_date: timestamp, status: string}]
  
  -- Marketing engagement
  marketing_materials_sent JSONB[], -- [{material_id: uuid, send_date: timestamp, opened: boolean}]
  campaign_enrollments TEXT[],
  nurture_sequence_status JSONB,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the member_extensions table
CREATE TABLE member_extensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  
  -- Membership data
  membership_type TEXT,
  membership_status TEXT,
  join_date TIMESTAMPTZ,
  membership_end_date TIMESTAMPTZ,
  billing_day INTEGER,
  
  -- Attendance and engagement
  check_in_count INTEGER DEFAULT 0,
  last_check_in TIMESTAMPTZ,
  attendance_streak INTEGER DEFAULT 0,
  classes_attended JSONB[], -- [{class_id: uuid, date: timestamp}]
  
  -- Financial
  lifetime_value DECIMAL,
  current_monthly_spend DECIMAL,
  payment_status TEXT,
  
  -- Retention and satisfaction
  satisfaction_score INTEGER, -- 1-10
  churn_risk TEXT, -- low, medium, high
  retention_actions JSONB[], -- [{action: string, date: timestamp, result: string}]
  
  -- Referral program
  referral_count INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  referral_rewards_earned DECIMAL DEFAULT 0,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the relationships table
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- The two people in the relationship
  person_a_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  person_b_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  
  -- Relationship type and direction
  relationship_type TEXT, -- referral, spouse, friend, trainer, etc.
  direction TEXT, -- a_to_b, b_to_a, bidirectional
  
  -- Referral specific (when type is referral)
  referral_date TIMESTAMPTZ,
  referral_channel TEXT, -- app, email, in-person, etc.
  referral_campaign TEXT,
  referral_link_id TEXT,
  
  -- Attribution
  is_primary_referrer BOOLEAN,
  attribution_percentage INTEGER DEFAULT 100, -- For split credit
  
  -- Status
  status TEXT DEFAULT 'active', -- active, inactive
  relationship_level INTEGER DEFAULT 1, -- 1 for direct, 2+ for indirect connections
  relationship_strength TEXT, -- strong, medium, weak
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  -- Constraints
  UNIQUE(person_a_id, person_b_id, relationship_type)
);

-- Create the interactions table
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who and what
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  interaction_type TEXT, -- email, sms, call, meeting, note, etc.
  
  -- Content
  subject TEXT,
  content TEXT,
  attachments JSONB[], -- [{name: string, url: string, type: string}]
  
  -- Status and tracking
  status TEXT DEFAULT 'completed',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Response tracking
  response_received BOOLEAN DEFAULT FALSE,
  response_date TIMESTAMPTZ,
  response_content TEXT,
  sentiment TEXT, -- positive, neutral, negative
  
  -- Association with campaigns
  campaign_id TEXT,
  template_id TEXT,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Create the messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Sender and recipient
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES persons(id),
  
  -- Message details
  message_type TEXT NOT NULL, -- 'email', 'sms', 'blast'
  subject TEXT,
  content TEXT NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- For group messages
  is_blast BOOLEAN DEFAULT FALSE,
  blast_id UUID,
  
  -- Personalization and campaign info
  template_id UUID,
  personalization_data JSONB,
  campaign_id TEXT,
  
  -- Response tracking
  has_response BOOLEAN DEFAULT FALSE,
  response_id UUID,
  
  -- Meta
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_persons_assigned_to ON persons(assigned_to);
CREATE INDEX idx_persons_is_lead ON persons(is_lead) WHERE is_lead = TRUE;
CREATE INDEX idx_persons_is_referral ON persons(is_referral) WHERE is_referral = TRUE;
CREATE INDEX idx_persons_is_member ON persons(is_member) WHERE is_member = TRUE;
CREATE INDEX idx_lead_extensions_person_id ON lead_extensions(person_id);
CREATE INDEX idx_lead_extensions_lead_status ON lead_extensions(lead_status);
CREATE INDEX idx_referral_extensions_person_id ON referral_extensions(person_id);
CREATE INDEX idx_referral_extensions_referral_status ON referral_extensions(referral_status);
CREATE INDEX idx_member_extensions_person_id ON member_extensions(person_id);
CREATE INDEX idx_relationships_person_a_id ON relationships(person_a_id);
CREATE INDEX idx_relationships_person_b_id ON relationships(person_b_id);
CREATE INDEX idx_interactions_person_id ON interactions(person_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_is_blast ON messages(is_blast) WHERE is_blast = TRUE;

-- Set up RLS (Row Level Security) for tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create basic policies (these would need to be customized based on your app's security needs)
CREATE POLICY users_policy ON users FOR ALL TO authenticated USING (role = 'admin' OR id = auth.uid());
CREATE POLICY persons_policy ON persons FOR ALL TO authenticated USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin' OR 
  assigned_to = auth.uid()
);

-- Trigger for updating the 'updated_at' field on all tables
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('users', 'persons', 'lead_extensions', 'referral_extensions', 
                       'member_extensions', 'relationships', 'interactions', 'messages')
  LOOP
    EXECUTE format('
      CREATE TRIGGER update_%I_timestamp
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    ', t, t);
  END LOOP;
END;
$$ LANGUAGE plpgsql; 