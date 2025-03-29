-- ORCA Lead Management Software - Current Database Schema
-- This file contains the verified and current database schema used in production

CREATE TABLE public.interactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  person_id uuid NOT NULL,
  user_id uuid NULL,
  interaction_type text NULL,
  subject text NULL,
  content text NULL,
  attachments jsonb[] NULL,
  status text NULL DEFAULT 'completed'::text,
  scheduled_at timestamp with time zone NULL,
  completed_at timestamp with time zone NULL,
  duration_minutes integer NULL,
  response_received boolean NULL DEFAULT false,
  response_date timestamp with time zone NULL,
  response_content text NULL,
  sentiment text NULL,
  campaign_id text NULL,
  template_id text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  notes text NULL,
  custom_fields jsonb NULL DEFAULT '{}'::jsonb,
  CONSTRAINT interactions_pkey PRIMARY KEY (id),
  CONSTRAINT interactions_person_id_fkey FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  CONSTRAINT interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_interactions_person_id ON public.interactions USING btree (person_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_interaction_type ON public.interactions USING btree (interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_scheduled_at ON public.interactions USING btree (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interactions_completed_at ON public.interactions USING btree (completed_at);
CREATE INDEX IF NOT EXISTS idx_interactions_campaign_id ON public.interactions USING btree (campaign_id);

CREATE TABLE public.lead_extensions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  person_id uuid NOT NULL,
  decision_authority text NULL,
  decision_timeline text NULL,
  previous_experience text NULL,
  competitor_considerations text[] NULL,
  pain_points text[] NULL,
  motivations text[] NULL,
  objections jsonb[] NULL,
  readiness_score integer NULL,
  lead_temperature text NULL,
  lead_status text NULL DEFAULT 'new'::text,
  status_history jsonb[] NULL,
  stage_duration_days jsonb NULL,
  visit_completed boolean NULL DEFAULT false,
  visit_date timestamp with time zone NULL,
  trial_status text NULL,
  trial_start_date timestamp with time zone NULL,
  trial_end_date timestamp with time zone NULL,
  forms_completed jsonb NULL,
  documents_shared jsonb[] NULL,
  payment_info_collected boolean NULL DEFAULT false,
  conversion_probability integer NULL,
  estimated_value numeric NULL,
  conversion_blockers text[] NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT lead_extensions_pkey PRIMARY KEY (id),
  CONSTRAINT lead_extensions_person_id_fkey FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  CONSTRAINT ck_conversion_probability CHECK (((conversion_probability >= 0) AND (conversion_probability <= 100))),
  CONSTRAINT ck_readiness_score CHECK (((readiness_score >= 1) AND (readiness_score <= 10)))
);
CREATE INDEX IF NOT EXISTS idx_lead_extensions_person_id ON public.lead_extensions USING btree (person_id);
CREATE INDEX IF NOT EXISTS idx_lead_extensions_lead_status ON public.lead_extensions USING btree (lead_status);
CREATE INDEX IF NOT EXISTS idx_lead_extensions_visit_completed ON public.lead_extensions USING btree (visit_completed);
CREATE INDEX IF NOT EXISTS idx_lead_extensions_trial_status ON public.lead_extensions USING btree (trial_status);
CREATE INDEX IF NOT EXISTS idx_lead_extensions_conversion_probability ON public.lead_extensions USING btree (conversion_probability);

CREATE TABLE public.member_extensions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  person_id uuid NOT NULL,
  membership_type text NULL,
  membership_status text NULL,
  join_date timestamp with time zone NULL,
  membership_end_date timestamp with time zone NULL,
  billing_day integer NULL,
  check_in_count integer NULL DEFAULT 0,
  last_check_in timestamp with time zone NULL,
  attendance_streak integer NULL DEFAULT 0,
  classes_attended jsonb[] NULL,
  lifetime_value numeric NULL,
  current_monthly_spend numeric NULL,
  payment_status text NULL,
  satisfaction_score integer NULL,
  churn_risk text NULL,
  retention_actions jsonb[] NULL,
  referral_count integer NULL DEFAULT 0,
  successful_referrals integer NULL DEFAULT 0,
  referral_rewards_earned numeric NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT member_extensions_pkey PRIMARY KEY (id),
  CONSTRAINT member_extensions_person_id_fkey FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  CONSTRAINT ck_billing_day CHECK (((billing_day >= 1) AND (billing_day <= 31))),
  CONSTRAINT ck_satisfaction_score CHECK (((satisfaction_score >= 1) AND (satisfaction_score <= 10)))
);
CREATE INDEX IF NOT EXISTS idx_member_extensions_person_id ON public.member_extensions USING btree (person_id);
CREATE INDEX IF NOT EXISTS idx_member_extensions_membership_status ON public.member_extensions USING btree (membership_status);
CREATE INDEX IF NOT EXISTS idx_member_extensions_membership_type ON public.member_extensions USING btree (membership_type);
CREATE INDEX IF NOT EXISTS idx_member_extensions_join_date ON public.member_extensions USING btree (join_date);
CREATE INDEX IF NOT EXISTS idx_member_extensions_churn_risk ON public.member_extensions USING btree (churn_risk);

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  message_type text NOT NULL,
  subject text NULL,
  content text NOT NULL,
  status text NULL DEFAULT 'sent'::text,
  sent_at timestamp with time zone NULL DEFAULT now(),
  delivered_at timestamp with time zone NULL,
  read_at timestamp with time zone NULL,
  is_blast boolean NULL DEFAULT false,
  blast_id uuid NULL,
  template_id uuid NULL,
  personalization_data jsonb NULL,
  campaign_id text NULL,
  has_response boolean NULL DEFAULT false,
  response_id uuid NULL,
  metadata jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES persons(id),
  CONSTRAINT messages_response_id_fkey FOREIGN KEY (response_id) REFERENCES messages(id) ON DELETE SET NULL,
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages USING btree (recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_blast ON public.messages USING btree (is_blast) WHERE (is_blast = true);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages USING btree (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON public.messages USING btree (message_type);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages USING btree (sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON public.messages USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_has_response ON public.messages USING btree (has_response);
CREATE INDEX IF NOT EXISTS idx_messages_blast_id ON public.messages USING btree (blast_id);

CREATE TABLE public.persons (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NULL,
  phone text NULL,
  secondary_phone text NULL,
  address jsonb NULL,
  dob date NULL,
  gender text NULL,
  preferred_contact_method text NULL,
  preferred_contact_times jsonb NULL,
  contact_frequency_preference text NULL,
  do_not_contact_until timestamp with time zone NULL,
  email_opt_in boolean NULL DEFAULT true,
  sms_opt_in boolean NULL DEFAULT true,
  social_profiles jsonb NULL DEFAULT '{}'::jsonb,
  is_lead boolean NULL DEFAULT false,
  is_referral boolean NULL DEFAULT false,
  is_member boolean NULL DEFAULT false,
  active_status boolean NULL DEFAULT true,
  acquisition_source text NULL,
  acquisition_campaign text NULL,
  acquisition_date timestamp with time zone NULL,
  utm_parameters jsonb NULL,
  referral_source text NULL,
  interest_level text NULL,
  goals text NULL,
  preferred_membership text NULL,
  interested_services text[] NULL,
  preferred_schedule jsonb NULL,
  special_requirements text NULL,
  budget_range text NULL,
  payment_preferences text NULL,
  price_sensitivity text NULL,
  profile_completeness integer NULL DEFAULT 0,
  tags text[] NULL,
  custom_fields jsonb NULL DEFAULT '{}'::jsonb,
  assigned_to uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  last_contacted timestamp with time zone NULL,
  next_scheduled_contact timestamp with time zone NULL,
  notes text NULL,
  CONSTRAINT persons_pkey PRIMARY KEY (id),
  CONSTRAINT persons_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_persons_assigned_to ON public.persons USING btree (assigned_to);
CREATE INDEX IF NOT EXISTS idx_persons_is_lead ON public.persons USING btree (is_lead) WHERE (is_lead = true);
CREATE INDEX IF NOT EXISTS idx_persons_is_referral ON public.persons USING btree (is_referral) WHERE (is_referral = true);
CREATE INDEX IF NOT EXISTS idx_persons_is_member ON public.persons USING btree (is_member) WHERE (is_member = true);
CREATE INDEX IF NOT EXISTS idx_persons_phone ON public.persons USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_persons_email ON public.persons USING btree (email);
CREATE INDEX IF NOT EXISTS idx_persons_last_contacted ON public.persons USING btree (last_contacted);
CREATE INDEX IF NOT EXISTS idx_persons_acquisition_source ON public.persons USING btree (acquisition_source);

CREATE TABLE public.referral_extensions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  person_id uuid NOT NULL,
  relationship_to_referrer text NULL,
  relationship_strength text NULL,
  permission_level text NULL,
  referral_status text NULL DEFAULT 'submitted'::text,
  status_history jsonb[] NULL,
  time_in_stage_days jsonb NULL,
  appointment_date timestamp with time zone NULL,
  appointment_status text NULL,
  google_calendar_event_id text NULL,
  conversion_status text NULL,
  conversion_date timestamp with time zone NULL,
  conversion_probability integer NULL,
  eligible_incentives jsonb[] NULL,
  incentives_awarded jsonb[] NULL,
  marketing_materials_sent jsonb[] NULL,
  campaign_enrollments text[] NULL,
  nurture_sequence_status jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT referral_extensions_pkey PRIMARY KEY (id),
  CONSTRAINT referral_extensions_person_id_fkey FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  CONSTRAINT ck_referral_conversion_probability CHECK (((conversion_probability >= 0) AND (conversion_probability <= 100)))
);
CREATE INDEX IF NOT EXISTS idx_referral_extensions_person_id ON public.referral_extensions USING btree (person_id);
CREATE INDEX IF NOT EXISTS idx_referral_extensions_referral_status ON public.referral_extensions USING btree (referral_status);
CREATE INDEX IF NOT EXISTS idx_referral_extensions_appointment_date ON public.referral_extensions USING btree (appointment_date);
CREATE INDEX IF NOT EXISTS idx_referral_extensions_conversion_status ON public.referral_extensions USING btree (conversion_status);

CREATE TABLE public.relationships (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  person_a_id uuid NOT NULL,
  person_b_id uuid NOT NULL,
  relationship_type text NOT NULL,
  direction text NULL,
  referral_date timestamp with time zone NULL,
  referral_channel text NULL,
  referral_campaign text NULL,
  referral_link_id text NULL,
  is_primary_referrer boolean NULL DEFAULT false,
  attribution_percentage integer NULL DEFAULT 100,
  status text NULL DEFAULT 'active'::text,
  relationship_level integer NULL DEFAULT 1,
  relationship_strength text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  notes text NULL,
  CONSTRAINT relationships_pkey PRIMARY KEY (id),
  CONSTRAINT relationships_person_a_id_person_b_id_relationship_type_key UNIQUE (person_a_id, person_b_id, relationship_type),
  CONSTRAINT relationships_person_a_id_fkey FOREIGN KEY (person_a_id) REFERENCES persons(id) ON DELETE CASCADE,
  CONSTRAINT relationships_person_b_id_fkey FOREIGN KEY (person_b_id) REFERENCES persons(id) ON DELETE CASCADE,
  CONSTRAINT ck_attribution_percentage CHECK (((attribution_percentage >= 0) AND (attribution_percentage <= 100))),
  CONSTRAINT ck_relationship_level CHECK ((relationship_level >= 1))
);
CREATE INDEX IF NOT EXISTS idx_relationships_person_a_id ON public.relationships USING btree (person_a_id);
CREATE INDEX IF NOT EXISTS idx_relationships_person_b_id ON public.relationships USING btree (person_b_id);
CREATE INDEX IF NOT EXISTS idx_relationships_relationship_type ON public.relationships USING btree (relationship_type);

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  email text NOT NULL,
  password text NOT NULL,
  first_name text NULL,
  last_name text NULL,
  phone text NULL,
  role text NULL DEFAULT 'salesperson'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  last_login timestamp with time zone NULL,
  settings jsonb NULL DEFAULT '{}'::jsonb,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING btree (role); 