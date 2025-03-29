# Database Constraints

This document lists all constraints in the ORCA database, organized by type.

## Primary Key Constraints

* **users.users_pkey**: PRIMARY KEY (id)
* **persons.persons_pkey**: PRIMARY KEY (id)
* **lead_extensions.lead_extensions_pkey**: PRIMARY KEY (id)
* **referral_extensions.referral_extensions_pkey**: PRIMARY KEY (id)
* **member_extensions.member_extensions_pkey**: PRIMARY KEY (id)
* **relationships.relationships_pkey**: PRIMARY KEY (id)
* **interactions.interactions_pkey**: PRIMARY KEY (id)
* **messages.messages_pkey**: PRIMARY KEY (id)

## Foreign Key Constraints

* **lead_extensions.lead_extensions_person_id_fkey**: FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
* **referral_extensions.referral_extensions_person_id_fkey**: FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
* **member_extensions.member_extensions_person_id_fkey**: FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
* **relationships.relationships_person_a_id_fkey**: FOREIGN KEY (person_a_id) REFERENCES persons(id) ON DELETE CASCADE
* **relationships.relationships_person_b_id_fkey**: FOREIGN KEY (person_b_id) REFERENCES persons(id) ON DELETE CASCADE
* **interactions.interactions_person_id_fkey**: FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
* **interactions.interactions_user_id_fkey**: FOREIGN KEY (user_id) REFERENCES users(id)
* **messages.messages_sender_id_fkey**: FOREIGN KEY (sender_id) REFERENCES users(id)
* **messages.messages_recipient_id_fkey**: FOREIGN KEY (recipient_id) REFERENCES persons(id)
* **messages.messages_response_id_fkey**: FOREIGN KEY (response_id) REFERENCES messages(id) ON DELETE SET NULL
* **persons.persons_assigned_to_fkey**: FOREIGN KEY (assigned_to) REFERENCES users(id)

## Unique Constraints

* **users.users_email_key**: UNIQUE (email)
* **relationships.relationships_person_a_id_person_b_id_relationship_type_key**: UNIQUE (person_a_id, person_b_id, relationship_type)

## Check Constraints

* **lead_extensions.ck_readiness_score**: CHECK ((readiness_score >= 1) AND (readiness_score <= 10))
* **lead_extensions.ck_conversion_probability**: CHECK ((conversion_probability >= 0) AND (conversion_probability <= 100))
* **referral_extensions.ck_referral_conversion_probability**: CHECK ((conversion_probability >= 0) AND (conversion_probability <= 100))
* **member_extensions.ck_billing_day**: CHECK ((billing_day >= 1) AND (billing_day <= 31))
* **member_extensions.ck_satisfaction_score**: CHECK ((satisfaction_score >= 1) AND (satisfaction_score <= 10))
* **relationships.ck_attribution_percentage**: CHECK ((attribution_percentage >= 0) AND (attribution_percentage <= 100))
* **relationships.ck_relationship_level**: CHECK (relationship_level >= 1)

## Not Null Constraints

* **persons.first_name**: NOT NULL
* **persons.last_name**: NOT NULL
* **users.email**: NOT NULL
* **users.password**: NOT NULL
* **relationships.relationship_type**: NOT NULL
* **messages.message_type**: NOT NULL
* **messages.content**: NOT NULL
* **messages.sender_id**: NOT NULL
* **messages.recipient_id**: NOT NULL

## Default Value Constraints

* **users.role**: DEFAULT 'salesperson'::text
* **users.created_at**: DEFAULT now()
* **users.updated_at**: DEFAULT now()
* **users.settings**: DEFAULT '{}'::jsonb
* **persons.is_lead**: DEFAULT false
* **persons.is_referral**: DEFAULT false
* **persons.is_member**: DEFAULT false
* **persons.active_status**: DEFAULT true
* **persons.email_opt_in**: DEFAULT true
* **persons.sms_opt_in**: DEFAULT true
* **persons.social_profiles**: DEFAULT '{}'::jsonb
* **persons.profile_completeness**: DEFAULT 0
* **persons.custom_fields**: DEFAULT '{}'::jsonb
* **persons.created_at**: DEFAULT now()
* **persons.updated_at**: DEFAULT now()
* **lead_extensions.lead_status**: DEFAULT 'new'::text
* **lead_extensions.created_at**: DEFAULT now()
* **lead_extensions.updated_at**: DEFAULT now()
* **referral_extensions.referral_status**: DEFAULT 'submitted'::text
* **referral_extensions.created_at**: DEFAULT now()
* **referral_extensions.updated_at**: DEFAULT now()
* **member_extensions.check_in_count**: DEFAULT 0
* **member_extensions.attendance_streak**: DEFAULT 0
* **member_extensions.referral_count**: DEFAULT 0
* **member_extensions.successful_referrals**: DEFAULT 0
* **member_extensions.referral_rewards_earned**: DEFAULT 0
* **member_extensions.created_at**: DEFAULT now()
* **member_extensions.updated_at**: DEFAULT now()
* **relationships.is_primary_referrer**: DEFAULT false
* **relationships.attribution_percentage**: DEFAULT 100
* **relationships.status**: DEFAULT 'active'::text
* **relationships.relationship_level**: DEFAULT 1
* **relationships.created_at**: DEFAULT now()
* **relationships.updated_at**: DEFAULT now()
* **interactions.status**: DEFAULT 'completed'::text
* **interactions.response_received**: DEFAULT false
* **interactions.created_at**: DEFAULT now()
* **interactions.updated_at**: DEFAULT now()
* **interactions.custom_fields**: DEFAULT '{}'::jsonb
* **messages.status**: DEFAULT 'sent'::text
* **messages.sent_at**: DEFAULT now()
* **messages.is_blast**: DEFAULT false
* **messages.has_response**: DEFAULT false
* **messages.metadata**: DEFAULT '{}'::jsonb
* **messages.created_at**: DEFAULT now()
* **messages.updated_at**: DEFAULT now()

## Validation Notes

These constraints are enforced at the database level. Application-level validation should be implemented to prevent constraint violations before data reaches the database.

Important validation rules:

* readiness_score must be between 1 and 10
* conversion_probability must be between 0 and 100
* relationship_level must be at least 1
* billing_day must be between 1 and 31
* satisfaction_score must be between 1 and 10
* attribution_percentage must be between 0 and 100

## Implementation in Code

The application code implements these constraints in the following ways:

1. **TypeScript interfaces** - Types defined in `server/db/schema/types.ts`
2. **Model validation** - Validation in model files at `server/models/*Model.js`
3. **Form validation** - Client-side validation in `client/src/components/*/Form.js`
4. **API validation** - API endpoint validation in `server/controllers/*Controller.js`
5. **Runtime validation** - Middleware validation in `server/middleware/schemaValidation.js`

## Best Practices for Developers

1. **Always validate input before database operations** - Use the validation utilities at `server/utils/schemaValidation.js` to validate data before insert/update operations.

2. **Handle constraint violation errors gracefully** - When catching database errors, check for specific error codes (23505 for unique constraint violations, 23514 for check constraint violations).

3. **Respect default values** - Be aware of default values when performing inserts and updates.

4. **Test with edge cases** - Test your code with values at the boundaries of constraints (e.g., readiness_score at 1 and 10).

5. **Document constraint implications** - When adding new features, document how they interact with existing constraints.

6. **Pre-validate composite constraints** - For unique constraints like relationships.relationships_person_a_id_person_b_id_relationship_type_key, perform a preliminary check before attempting an insert.

7. **Consider cascade behavior** - Be aware of ON DELETE CASCADE behavior when deleting records with foreign key constraints. 