# Entity Relationship Diagram

This document provides a visual representation of the Entity Relationship Diagram for the ORCA database.

## Database Schema Visualization

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

## Relationship Explanations

### One-to-Many Relationships

1. **User to Person (`assigned_to`)**: 
   - Each person can be assigned to one user
   - Each user can be assigned many persons

2. **Person to Interactions (`has`)**: 
   - Each person can have many interactions
   - Each interaction belongs to one person

3. **User to Interactions (`performs`)**: 
   - Each user can perform many interactions
   - Each interaction is performed by one user

4. **Person to Messages (`receives`)**: 
   - Each person can receive many messages
   - Each message is received by one person

5. **User to Messages (`sends`)**: 
   - Each user can send many messages
   - Each message is sent by one user

6. **Person to Relationships (`person_a` and `person_b`)**: 
   - Each person can participate in many relationships
   - Each relationship connects exactly two persons

### One-to-One Relationships

1. **Person to Lead Extension (`extension`)**: 
   - Each person can have one lead extension
   - Each lead extension belongs to one person

2. **Person to Referral Extension (`extension`)**: 
   - Each person can have one referral extension
   - Each referral extension belongs to one person

3. **Person to Member Extension (`extension`)**: 
   - Each person can have one member extension
   - Each member extension belongs to one person

## Key Design Patterns

1. **Unified Person Model**: All contacts (leads, referrals, members) are stored in the central `persons` table with flags to indicate their roles.

2. **Extension Pattern**: Role-specific data is stored in separate extension tables to keep the core persons table clean.

3. **Bidirectional Relationships**: The relationships table allows for complex network modeling with direction indicators.

4. **Comprehensive Time Tracking**: Almost all entities track creation, update, and activity timestamps for audit purposes. 