# ORCA Database Schema Documentation

This document provides a detailed overview of the ORCA application's database schema, designed according to the unified person model approach described in the project requirements.

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ persons : "assigned_to"
    persons ||--o| lead_extensions : "extension"
    persons ||--o| referral_extensions : "extension"
    persons ||--o| member_extensions : "extension"
    persons ||--o{ interactions : "has"
    persons ||--o{ messages : "receives"
    users ||--o{ interactions : "performs"
    users ||--o{ messages : "sends"
    persons ||--o{ relationships : "person_a"
    persons ||--o{ relationships : "person_b"
    
    users {
        uuid id PK
        text email
        text password
        text first_name
        text last_name
        text phone
        text role
        timestamp created_at
        timestamp updated_at
        timestamp last_login
        jsonb settings
    }
    
    persons {
        uuid id PK
        text first_name
        text last_name
        text email
        text phone
        text secondary_phone
        jsonb address
        date dob
        text gender
        text preferred_contact_method
        jsonb preferred_contact_times
        text contact_frequency_preference
        timestamp do_not_contact_until
        boolean email_opt_in
        boolean sms_opt_in
        jsonb social_profiles
        boolean is_lead
        boolean is_referral
        boolean is_member
        boolean active_status
        text acquisition_source
        text acquisition_campaign
        timestamp acquisition_date
        jsonb utm_parameters
        text referral_source
        text interest_level
        text goals
        text preferred_membership
        array interested_services
        jsonb preferred_schedule
        text special_requirements
        text budget_range
        text payment_preferences
        text price_sensitivity
        integer profile_completeness
        array tags
        jsonb custom_fields
        uuid assigned_to FK
        timestamp created_at
        timestamp updated_at
        timestamp last_contacted
        timestamp next_scheduled_contact
        text notes
    }
    
    lead_extensions {
        uuid id PK
        uuid person_id FK
        text decision_authority
        text decision_timeline
        text previous_experience
        array competitor_considerations
        array pain_points
        array motivations
        array objections
        integer readiness_score
        text lead_temperature
        text lead_status
        array status_history
        jsonb stage_duration_days
        boolean visit_completed
        timestamp visit_date
        text trial_status
        timestamp trial_start_date
        timestamp trial_end_date
        jsonb forms_completed
        array documents_shared
        boolean payment_info_collected
        integer conversion_probability
        numeric estimated_value
        array conversion_blockers
        timestamp created_at
        timestamp updated_at
    }
    
    referral_extensions {
        uuid id PK
        uuid person_id FK
        text relationship_to_referrer
        text relationship_strength
        text permission_level
        text referral_status
        array status_history
        jsonb time_in_stage_days
        timestamp appointment_date
        text appointment_status
        text google_calendar_event_id
        text conversion_status
        timestamp conversion_date
        integer conversion_probability
        array eligible_incentives
        array incentives_awarded
        array marketing_materials_sent
        array campaign_enrollments
        jsonb nurture_sequence_status
        timestamp created_at
        timestamp updated_at
    }
    
    member_extensions {
        uuid id PK
        uuid person_id FK
        text membership_type
        text membership_status
        timestamp join_date
        timestamp membership_end_date
        integer billing_day
        integer check_in_count
        timestamp last_check_in
        integer attendance_streak
        array classes_attended
        numeric lifetime_value
        numeric current_monthly_spend
        text payment_status
        integer satisfaction_score
        text churn_risk
        array retention_actions
        integer referral_count
        integer successful_referrals
        numeric referral_rewards_earned
        timestamp created_at
        timestamp updated_at
    }
    
    relationships {
        uuid id PK
        uuid person_a_id FK
        uuid person_b_id FK
        text relationship_type
        text direction
        timestamp referral_date
        text referral_channel
        text referral_campaign
        text referral_link_id
        boolean is_primary_referrer
        integer attribution_percentage
        text status
        integer relationship_level
        text relationship_strength
        timestamp created_at
        timestamp updated_at
        text notes
    }
    
    interactions {
        uuid id PK
        uuid person_id FK
        uuid user_id FK
        text interaction_type
        text subject
        text content
        array attachments
        text status
        timestamp scheduled_at
        timestamp completed_at
        integer duration_minutes
        boolean response_received
        timestamp response_date
        text response_content
        text sentiment
        text campaign_id
        text template_id
        timestamp created_at
        timestamp updated_at
        text notes
        jsonb custom_fields
    }
    
    messages {
        uuid id PK
        uuid sender_id FK
        uuid recipient_id FK
        text message_type
        text subject
        text content
        text status
        timestamp sent_at
        timestamp delivered_at
        timestamp read_at
        boolean is_blast
        uuid blast_id
        uuid template_id
        jsonb personalization_data
        text campaign_id
        boolean has_response
        uuid response_id
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
```

## Key Design Principles

### Unified Person Model
- All contacts (leads, referrals, members) are stored in the central `persons` table
- Role-based flags (`is_lead`, `is_referral`, `is_member`) determine the person's role(s)
- Extension tables contain role-specific data

### Extension Pattern
- Extension tables (`lead_extensions`, `referral_extensions`, `member_extensions`) store specialized data
- Each extension links to exactly one person via a foreign key relationship
- Extensions are only created when needed for the person's role(s)

### Relationship Tracking
- The `relationships` table models connections between people
- This supports the referral network visualization
- Multiple referrer relationships are possible through this structure
- Bidirectional relationships can be represented

## Foreign Key Relationships

1. **User to Person**
   - A user can be assigned to many persons
   - Each person can be assigned to one user (through `assigned_to`)

2. **Person to Extensions**
   - One person can have one lead extension
   - One person can have one referral extension
   - One person can have one member extension
   - All extension tables have a CASCADE delete relationship with their person

3. **Person to Relationships**
   - A person can have many relationships as either person_a or person_b
   - Self-referential relationship pattern allows network visualization

4. **Person to Interactions**
   - A person can have many interactions
   - A user can perform many interactions

5. **Person to Messages**
   - A user can send many messages
   - A person can receive many messages

## Common Data Patterns

### Status History Tracking
- Status changes are tracked in `status_history` arrays
- Each entry includes status, timestamp, and notes
- This allows tracking a person's journey through the pipeline

### JSONB Fields
- Complex data is stored in JSONB fields for flexibility
- Examples: address, preferences, custom fields
- Allows schema evolution without migrations for some data types

### Timestamps
- All major entities have created_at and updated_at timestamps
- Activity-specific timestamps track when actions occurred

## Query Optimization

The database is optimized for:

1. **Person Filtering**
   - Indexes on role flags (`is_lead`, `is_referral`, `is_member`)
   - Indexes on assignment and status fields

2. **Relationship Queries**
   - Composite indexes for relationship lookup
   - Optimization for network traversal

3. **Interaction Queries**
   - Indexes on person_id and scheduled_at
   - Allows efficient timeline views

## Database Views

While the physical schema uses the extension pattern, application code can use views for simplified access:

- `leads_view`: Combines person and lead_extension data
- `referrals_view`: Combines person and referral_extension data
- `members_view`: Combines person and member_extension data

These views make it easier to work with the unified model without repeated joins. 