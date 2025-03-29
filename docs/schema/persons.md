# persons

Core table that stores all person records (leads, referrals, members).

## Columns

| Name | Type | Nullable | Default | Description |
|------|------|----------|---------|-------------|
| id | uuid | NO | extensions.uuid_generate_v4() | Unique identifier (UUID v4) |
| first_name | text | NO | NULL | Person's first name |
| last_name | text | NO | NULL | Person's last name |
| email | text | YES | NULL | Email address |
| phone | text | YES | NULL | Primary contact phone number |
| secondary_phone | text | YES | NULL | Alternative phone number |
| address | jsonb | YES | NULL | Structured address information |
| dob | date | YES | NULL | Date of birth |
| gender | text | YES | NULL | Gender identifier |
| preferred_contact_method | text | YES | NULL | Preferred way to be contacted |
| preferred_contact_times | jsonb | YES | NULL | Best times for contact |
| contact_frequency_preference | text | YES | NULL | How often to contact |
| do_not_contact_until | timestamp with time zone | YES | NULL | Temporary contact restriction |
| email_opt_in | boolean | YES | true | Email marketing consent flag |
| sms_opt_in | boolean | YES | true | SMS marketing consent flag |
| social_profiles | jsonb | YES | '{}'::jsonb | Links to social media profiles |
| is_lead | boolean | YES | false | Flag indicating if person is a lead |
| is_referral | boolean | YES | false | Flag indicating if person is a referral |
| is_member | boolean | YES | false | Flag indicating if person is a member |
| active_status | boolean | YES | true | Whether the record is active |
| acquisition_source | text | YES | NULL | How the person was acquired |
| acquisition_campaign | text | YES | NULL | Related marketing campaign |
| acquisition_date | timestamp with time zone | YES | NULL | When acquired |
| utm_parameters | jsonb | YES | NULL | Marketing tracking parameters |
| referral_source | text | YES | NULL | Source if referred |
| interest_level | text | YES | NULL | Level of interest |
| goals | text | YES | NULL | Personal/fitness goals |
| preferred_membership | text | YES | NULL | Preferred membership type |
| interested_services | text[] | YES | NULL | Services of interest |
| preferred_schedule | jsonb | YES | NULL | Schedule preferences |
| special_requirements | text | YES | NULL | Special needs/accommodations |
| budget_range | text | YES | NULL | Budget constraints |
| payment_preferences | text | YES | NULL | Payment method preferences |
| price_sensitivity | text | YES | NULL | Sensitivity to pricing |
| profile_completeness | integer | YES | 0 | Profile completion percentage |
| tags | text[] | YES | NULL | Categorization tags |
| custom_fields | jsonb | YES | '{}'::jsonb | Custom data fields |
| assigned_to | uuid | YES | NULL | Reference to user responsible |
| created_at | timestamp with time zone | YES | now() | Record creation timestamp |
| updated_at | timestamp with time zone | YES | now() | Last update timestamp |
| last_contacted | timestamp with time zone | YES | NULL | Last contact timestamp |
| next_scheduled_contact | timestamp with time zone | YES | NULL | Next planned contact |
| notes | text | YES | NULL | General notes about the person |

## Constraints

* **persons_pkey**: PRIMARY KEY (id)
* **persons_assigned_to_fkey**: FOREIGN KEY (assigned_to) REFERENCES users(id)

## Indexes

* **idx_persons_assigned_to**: ON persons (assigned_to)
* **idx_persons_is_lead**: ON persons (is_lead) WHERE (is_lead = true)
* **idx_persons_is_referral**: ON persons (is_referral) WHERE (is_referral = true)
* **idx_persons_is_member**: ON persons (is_member) WHERE (is_member = true)
* **idx_persons_phone**: ON persons (phone)
* **idx_persons_email**: ON persons (email)
* **idx_persons_last_contacted**: ON persons (last_contacted)
* **idx_persons_acquisition_source**: ON persons (acquisition_source)

## Relationships

### HasOne
* [lead_extensions](lead_extensions.md)
* [referral_extensions](referral_extensions.md)
* [member_extensions](member_extensions.md)

### BelongsTo
* [users](users.md)

### HasMany
* [relationships](relationships.md)
* [interactions](interactions.md)
* [messages](messages.md)

## Usage

This table is used in the following contexts:

* **Lead Management** - Storing and tracking leads
* **Referral System** - Managing referrals
* **Member Management** - Tracking active members
* **Communication** - Sending messages to contacts

## Implementation Notes

### Role Flags

The role flags (`is_lead`, `is_referral`, `is_member`) determine what extension tables will be associated with a person record:

- If `is_lead = true`, there should be a corresponding record in the `lead_extensions` table.
- If `is_referral = true`, there should be a corresponding record in the `referral_extensions` table.
- If `is_member = true`, there should be a corresponding record in the `member_extensions` table.

A person can have multiple roles simultaneously.

### Required Fields

Only `first_name` and `last_name` are required. Other fields should be populated as appropriate for the person's role.

### JSON Fields

Several fields use JSONB for flexible structured data:

- `address`: Standard structure is `{"street": "", "city": "", "state": "", "zip": "", "country": ""}`
- `preferred_contact_times`: Standard structure is `{"morning": boolean, "afternoon": boolean, "evening": boolean}`
- `social_profiles`: Standard structure is `{"facebook": "", "instagram": "", "linkedin": "", "twitter": ""}`
- `utm_parameters`: Standard structure is `{"utm_source": "", "utm_medium": "", "utm_campaign": "", "utm_term": "", "utm_content": ""}`
- `preferred_schedule`: Standard structure is `{"weekdays": boolean, "weekends": boolean, "mornings": boolean, "evenings": boolean}`
- `custom_fields`: Free-form structure for extending the schema without database changes

### API Integration

See [API Integration Guide](api_integration.md#persons-api) for more details on how to interact with this table through the API. 