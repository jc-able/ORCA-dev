# API Integration Guide

This document provides detailed information on how to interact with the ORCA database through our API endpoints.

## Authentication

All API requests require authentication via JWT token except for login and registration endpoints.

### Authentication Headers

```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user and get JWT token |
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/logout` | POST | Invalidate current JWT token |
| `/api/auth/refresh` | POST | Refresh JWT token |

## Common Response Format

All API responses follow a consistent format:

```json
{
  "status": "success" | "error",
  "data": { ... } | null,
  "message": "Success/error message" | null,
  "errors": [ ... ] | null
}
```

## Error Handling

HTTP status codes are used to indicate the status of the request:

- 200: Success
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Persons API

Base endpoint: `/api/persons`

### GET /api/persons

Get all persons with optional filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | Number | Page number (default: 0) |
| pageSize | Number | Items per page (default: 10) |
| isLead | Boolean | Filter by lead status |
| isReferral | Boolean | Filter by referral status |
| isMember | Boolean | Filter by member status |
| searchTerm | String | Search by name, email, or phone |
| assignedTo | UUID | Filter by assigned user |

**Response Fields:**

```json
{
  "id": "UUID",
  "first_name": "String (required)",
  "last_name": "String (required)",
  "email": "String",
  "phone": "String",
  "secondary_phone": "String",
  "address": {
    "street": "String",
    "city": "String",
    "state": "String",
    "zip": "String",
    "country": "String"
  },
  "dob": "Date (YYYY-MM-DD)",
  "gender": "String",
  "preferred_contact_method": "email | phone | sms",
  "preferred_contact_times": {
    "morning": "Boolean",
    "afternoon": "Boolean",
    "evening": "Boolean"
  },
  "contact_frequency_preference": "daily | weekly | monthly",
  "do_not_contact_until": "Timestamp",
  "email_opt_in": "Boolean (default: true)",
  "sms_opt_in": "Boolean (default: true)",
  "social_profiles": {
    "facebook": "String",
    "instagram": "String",
    "linkedin": "String",
    "twitter": "String"
  },
  "is_lead": "Boolean (default: false)",
  "is_referral": "Boolean (default: false)",
  "is_member": "Boolean (default: false)",
  "active_status": "Boolean (default: true)",
  "acquisition_source": "String",
  "acquisition_campaign": "String",
  "acquisition_date": "Timestamp",
  "utm_parameters": {
    "utm_source": "String",
    "utm_medium": "String",
    "utm_campaign": "String",
    "utm_term": "String",
    "utm_content": "String"
  },
  "referral_source": "String",
  "interest_level": "high | medium | low",
  "goals": "String",
  "preferred_membership": "String",
  "interested_services": ["String"],
  "preferred_schedule": {
    "weekdays": "Boolean",
    "weekends": "Boolean",
    "mornings": "Boolean",
    "evenings": "Boolean"
  },
  "special_requirements": "String",
  "budget_range": "String",
  "payment_preferences": "String",
  "price_sensitivity": "high | medium | low",
  "profile_completeness": "Number (0-100, default: 0)",
  "tags": ["String"],
  "custom_fields": "JSON Object",
  "assigned_to": "UUID",
  "created_at": "Timestamp",
  "updated_at": "Timestamp",
  "last_contacted": "Timestamp",
  "next_scheduled_contact": "Timestamp",
  "notes": "String"
}
```

### GET /api/persons/:id

Get person by ID.

**Response:** Same as above for a single person object.

### POST /api/persons

Create a new person.

**Request Body:** Same as the response fields above, with required fields marked.

**Response:** Created person object.

### PUT /api/persons/:id

Update an existing person.

**Request Body:** Same as the response fields above, with fields to update.

**Response:** Updated person object.

## Leads API

Base endpoint: `/api/leads`

### GET /api/leads

Get all leads with optional filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | Number | Page number (default: 0) |
| pageSize | Number | Items per page (default: 10) |
| leadStatus | String | Filter by lead status |
| searchTerm | String | Search by name, email, or phone |
| assignedTo | UUID | Filter by assigned user |

**Response Fields:**

All fields from the Persons API plus:

```json
{
  "lead_extension": {
    "id": "UUID",
    "person_id": "UUID (required)",
    "decision_authority": "String",
    "decision_timeline": "String",
    "previous_experience": "String",
    "competitor_considerations": ["String"],
    "pain_points": ["String"],
    "motivations": ["String"],
    "objections": [{
      "objection": "String",
      "response": "String",
      "resolved": "Boolean"
    }],
    "readiness_score": "Number (1-10)",
    "lead_temperature": "hot | warm | cold",
    "lead_status": "new | contacted | appointment_scheduled | appointment_completed | proposal_made | negotiation | won | lost | nurturing (default: new)",
    "status_history": [{
      "status": "String",
      "timestamp": "Timestamp",
      "notes": "String"
    }],
    "stage_duration_days": {
      "new": "Number",
      "contacted": "Number"
      // other stages...
    },
    "visit_completed": "Boolean (default: false)",
    "visit_date": "Timestamp",
    "trial_status": "not_started | active | completed | canceled",
    "trial_start_date": "Timestamp",
    "trial_end_date": "Timestamp",
    "forms_completed": {
      "membership_application": "Boolean",
      "health_questionnaire": "Boolean",
      "liability_waiver": "Boolean"
    },
    "documents_shared": [{
      "name": "String",
      "url": "String",
      "shared_date": "Timestamp"
    }],
    "payment_info_collected": "Boolean (default: false)",
    "conversion_probability": "Number (0-100)",
    "estimated_value": "Number",
    "conversion_blockers": ["String"],
    "created_at": "Timestamp",
    "updated_at": "Timestamp"
  }
}
```

### GET /api/leads/:id

Get lead by ID.

**Response:** Person object with lead extension.

### POST /api/leads

Create a new lead.

**Request Body:** Combination of person fields and lead extension fields.

**Response:** Created lead object.

### PUT /api/leads/:id

Update an existing lead.

**Request Body:** Fields to update from either person or lead extension.

**Response:** Updated lead object.

## Referrals API

Base endpoint: `/api/referrals`

### GET /api/referrals

Get all referrals with optional filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | Number | Page number (default: 0) |
| pageSize | Number | Items per page (default: 10) |
| referralStatus | String | Filter by referral status |
| searchTerm | String | Search by name, email, or phone |
| referrerId | UUID | Filter by referrer ID |

**Response Fields:**

All fields from the Persons API plus:

```json
{
  "referral_extension": {
    "id": "UUID",
    "person_id": "UUID (required)",
    "relationship_to_referrer": "String",
    "relationship_strength": "strong | medium | weak",
    "permission_level": "full | limited | none",
    "referral_status": "submitted | contacted | appointment_scheduled | appointment_completed | converted | lost (default: submitted)",
    "status_history": [{
      "status": "String",
      "timestamp": "Timestamp",
      "notes": "String"
    }],
    "time_in_stage_days": {
      "submitted": "Number",
      "contacted": "Number"
      // other stages...
    },
    "appointment_date": "Timestamp",
    "appointment_status": "scheduled | completed | missed | rescheduled | canceled",
    "google_calendar_event_id": "String",
    "conversion_status": "not_converted | in_progress | converted | lost",
    "conversion_date": "Timestamp",
    "conversion_probability": "Number (0-100)",
    "eligible_incentives": [{
      "incentive_id": "String",
      "name": "String",
      "value": "Number",
      "type": "cash | discount | free_service"
    }],
    "incentives_awarded": [{
      "incentive_id": "String",
      "award_date": "Timestamp",
      "status": "pending | awarded | redeemed"
    }],
    "marketing_materials_sent": [{
      "name": "String",
      "url": "String",
      "sent_date": "Timestamp"
    }],
    "campaign_enrollments": ["String"],
    "nurture_sequence_status": {
      "sequence_id": "String",
      "current_step": "Number",
      "next_contact_date": "Timestamp"
    },
    "created_at": "Timestamp",
    "updated_at": "Timestamp"
  },
  "relationships": [{
    "id": "UUID",
    "person_a_id": "UUID",
    "person_b_id": "UUID",
    "relationship_type": "String (required)",
    "direction": "a_to_b | b_to_a | bidirectional",
    "referral_date": "Timestamp",
    "referral_channel": "String",
    "referral_campaign": "String",
    "referral_link_id": "String",
    "is_primary_referrer": "Boolean (default: false)",
    "attribution_percentage": "Number (0-100, default: 100)",
    "status": "active | inactive (default: active)",
    "relationship_level": "Number (>= 1, default: 1)",
    "relationship_strength": "strong | medium | weak",
    "created_at": "Timestamp",
    "updated_at": "Timestamp",
    "notes": "String"
  }]
}
```

### GET /api/referrals/:id

Get referral by ID.

**Response:** Person object with referral extension and relationships.

### POST /api/referrals

Create a new referral.

**Request Body:** Combination of person fields, referral extension fields, and relationships.

**Response:** Created referral object.

### PUT /api/referrals/:id

Update an existing referral.

**Request Body:** Fields to update from either person or referral extension.

**Response:** Updated referral object.

## Other API Endpoints

The ORCA API includes additional endpoints for:

- Member management (`/api/members`)
- Interactions (`/api/interactions`)
- Messages (`/api/messages`)
- Relationships (`/api/relationships`)
- Users (`/api/users`)

Each of these endpoints follows the same RESTful pattern as the Persons, Leads, and Referrals APIs, with appropriate fields for each entity type.

## Filtering and Pagination

All list endpoints support pagination and filtering using query parameters:

```
GET /api/leads?page=0&pageSize=10&leadStatus=new&assignedTo=123e4567-e89b-12d3-a456-426614174000
```

## Transactions and Data Integrity

The API ensures data integrity by:

1. Using database transactions for operations that affect multiple tables
2. Validating input data against schema constraints
3. Returning appropriate error codes and messages for constraint violations
4. Implementing row-level security to enforce access control

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- 100 requests per minute for authenticated users
- 10 requests per minute for login/registration endpoints

## Development Integration

For development purposes, the API can be accessed at:

```
https://api.orca-lead.dev/api
```

For production use, the API is available at:

```
https://api.orca-lead.com/api
```

## API Versioning

The current API version is v1, which is implicitly included in the base path. Future versions will be explicitly versioned:

```
/api/v2/leads
``` 