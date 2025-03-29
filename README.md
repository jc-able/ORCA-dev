# ORCA Lead Management Software

ORCA is a comprehensive lead management tool designed to provide salespeople in membership-based businesses (gyms and similar community organizations) with a comprehensive tool to manage leads, communicate with them, track their progress, and leverage referrals through a streamlined appointment scheduling system and text blast functionality. The key feature of ORCA is the referral system which allows the salesperson to manage sales leads, Members (converted leads), Member referrals (leads invited and linked to member and salesperson), and personal refferal (leads invited and linked to salesperson). This allows the salesperson to maximize sales by efficiently utilizing the power of a referral system.

## Features

### User Management
- Role-based authentication (Admin and Salesperson)
- Secure login and registration

### Lead Management
- Comprehensive lead information forms
- Lead pipeline with customizable stages
- Drag-and-drop organization
- Filtering and sorting capabilities

### Communication Tools
- Email integration with Google Workspace/Gmail
- SMS messaging via Telnyx
- Text blast functionality for bulk messaging
- Message template management

### Referral System
- Referral link generation and tracking
- Referral form for information collection
- Appointment scheduling with Google Calendar integration
- Referral network visualization
- Multiple referrer support

## Technology Stack

### Frontend
- **React.js** with JavaScript
- **Material-UI** for component library
- **D3.js** for data visualization
- **React Router** for navigation
- **React Context API** for state management
- **Formik & Yup** for form validation

### Backend
- **Node.js** with Express
- **Supabase** for database and authentication
- **Firebase** for dynamic links
- **Telnyx API** for SMS communication
- **Google APIs** for email and calendar integration
- **Stripe** for payment processing

### Infrastructure
- **Vercel** for hosting

## Project Structure

```
project/
├── client/          # React frontend
│   ├── public/      # Static assets
│   └── src/         # Source code
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── hooks/          # Custom React hooks
│       ├── contexts/       # State management contexts
│       ├── services/       # API service integrations
│       ├── utils/          # Utility functions
│       ├── styles/         # Global styles and themes
│       ├── App.js          # Main application component
│       └── index.js        # Entry point
├── server/          # Node.js backend
│   ├── config/      # Configuration files
│   ├── controllers/ # Business logic
│   ├── models/      # Data models
│   ├── routes/      # API endpoints
│   ├── middleware/  # Custom middleware
│   ├── utils/       # Utility functions
│   ├── tests/       # Backend tests
│   └── server.js    # Main server file
```

## Current Implementation Status

### Completed
- ✅ Project structure setup (client/server architecture)
- ✅ Base React application with Material UI theme
- ✅ Dark mode UI based on PRD design specifications
- ✅ Authentication context and protected routes structure
- ✅ User interface components for all main pages:
  - Dashboard with metrics
  - Lead Management
  - Referral System
  - Communication Center
  - User Profile
- ✅ Login and Registration flows with multi-step form
- ✅ Node.js Express server setup
- ✅ Error handling middleware
- ✅ Authentication middleware for JWT validation
- ✅ Supabase client integration for both frontend and backend
- ✅ Environment configuration with placeholder values
- ✅ Project documentation
- ✅ Lead Management UI with Kanban board, search, and filtering
- ✅ Referral System UI with network visualization and appointment tracking
- ✅ Communication Center UI with messaging, conversation history, and text blast functionality
- ✅ Database schema implementation in Supabase
- ✅ API endpoints implementation for:
  - Lead Management
  - User/Authentication
- ✅ Models and controllers for lead data
- ✅ User authentication with Supabase Auth
- ✅ Client-side integration with server API (with fallback to mock data)
- ✅ Referral network visualization with hierarchical layout
- ✅ Vercel deployment configuration

### In Progress/Missing
- 🚧 API endpoints implementation for:
  - ✅ Referral System
  - ✅ Communication
- 🚧 Integration with third-party services:
  - Telnyx for SMS
  - Firebase for dynamic links
  - Google APIs for Calendar and Email
  - Stripe for payment processing
- 🚧 Testing suite
- 🚧 Calendar integration for scheduling appointments
- 🚧 Mobile responsiveness optimizations for complex components

## Database Structure

This section provides a comprehensive overview of the ORCA database schema, designed to align with the requirements specified in the PRD.

### Core Design Principles

- **Unified Person Model**: A single `persons` table serves as the foundation for all contact types (leads, referrals, members)
- **Extension Pattern**: Specialized data is stored in extension tables that reference the base person record
- **Relationship Tracking**: Explicit modeling of relationships between people for referral network analysis
- **Activity Monitoring**: Comprehensive tracking of all interactions and communications
- **Flexible Data Storage**: Use of JSONB and array types for evolving data needs
- **Audit Trail**: Timestamp tracking for all major actions and status changes

> **Note**: For complete schema documentation, see our [Schema Reference Guide](docs/schema/README.md) which includes detailed field definitions, constraints, API integration guides, and developer guidelines.

### Database Tables Checklist

#### 1. Users Table (`users`)

- [x] **Primary Fields**
  - [x] `id` (UUID, PK): Unique identifier for each user
  - [x] `email` (Text, Unique): User's email address
  - [x] `password` (Text): Hashed password for authentication
  - [x] `first_name` (Text): User's first name
  - [x] `last_name` (Text): User's last name
  - [x] `phone` (Text): User's contact phone number
  - [x] `role` (Text): User role ('admin' or 'salesperson')

- [x] **Metadata Fields**
  - [x] `created_at` (Timestamp): Account creation timestamp
  - [x] `updated_at` (Timestamp): Last update timestamp
  - [x] `last_login` (Timestamp): Last login timestamp
  - [x] `settings` (JSONB): User preferences and settings

- [x] **Indexes**
  - [x] Primary key on `id`
  - [x] Unique index on `email`
  - [x] Index on `role` for permission filtering

- [x] **Security**
  - [x] Row-level security policies for user data
  - [x] Password hashing enforcement

#### 2. Persons Table (`persons`)

- [x] **Basic Information**
  - [x] `id` (UUID, PK): Unique identifier for each person
  - [x] `first_name` (Text, NOT NULL): Person's first name
  - [x] `last_name` (Text, NOT NULL): Person's last name
  - [x] `email` (Text): Email address
  - [x] `phone` (Text): Primary phone number
  - [x] `secondary_phone` (Text): Alternative phone number
  - [x] `address` (JSONB): Structured address information
  - [x] `dob` (Date): Date of birth
  - [x] `gender` (Text): Gender identifier

- [x] **Contact Preferences**
  - [x] `preferred_contact_method` (Text): Preferred way to be contacted
  - [x] `preferred_contact_times` (JSONB): Best times for contact
  - [x] `contact_frequency_preference` (Text): How often to contact
  - [x] `do_not_contact_until` (Timestamp): Temporary contact restriction
  - [x] `email_opt_in` (Boolean): Email marketing consent flag
  - [x] `sms_opt_in` (Boolean): SMS marketing consent flag
  - [x] `social_profiles` (JSONB): Links to social media profiles

- [x] **Role Indicators**
  - [x] `is_lead` (Boolean): Flag for lead status
  - [x] `is_referral` (Boolean): Flag for referral status
  - [x] `is_member` (Boolean): Flag for member status
  - [x] `active_status` (Boolean): Whether the record is active

- [x] **Source Information**
  - [x] `acquisition_source` (Text): How the person was acquired
  - [x] `acquisition_campaign` (Text): Related marketing campaign
  - [x] `acquisition_date` (Timestamp): When acquired
  - [x] `utm_parameters` (JSONB): Marketing tracking parameters
  - [x] `referral_source` (Text): Source if referred

- [x] **Qualification Data**
  - [x] `interest_level` (Text): Level of interest
  - [x] `goals` (Text): Personal/fitness goals
  - [x] `preferred_membership` (Text): Preferred membership type
  - [x] `interested_services` (Array): Services of interest
  - [x] `preferred_schedule` (JSONB): Schedule preferences
  - [x] `special_requirements` (Text): Special needs/accommodations
  - [x] `budget_range` (Text): Budget constraints
  - [x] `payment_preferences` (Text): Payment method preferences
  - [x] `price_sensitivity` (Text): Sensitivity to pricing

- [x] **Metadata and Management**
  - [x] `profile_completeness` (Integer): Profile completion percentage
  - [x] `tags` (Array): Categorization tags
  - [x] `custom_fields` (JSONB): Custom data fields
  - [x] `assigned_to` (UUID, FK): Reference to user responsible
  - [x] `created_at` (Timestamp): Record creation timestamp
  - [x] `updated_at` (Timestamp): Last update timestamp
  - [x] `last_contacted` (Timestamp): Last contact timestamp
  - [x] `next_scheduled_contact` (Timestamp): Next planned contact
  - [x] `notes` (Text): General notes about the person

- [x] **Indexes**
  - [x] Primary key on `id`
  - [x] Index on `email`
  - [x] Index on `phone`
  - [x] Index on `is_lead`, `is_referral`, `is_member` flags
  - [x] Index on `assigned_to`
  - [x] Index on `last_contacted`
  - [x] Index on `acquisition_source`

- [x] **Constraints**
  - [x] Foreign key from `assigned_to` to `users.id`

#### 3. Lead Extensions Table (`lead_extensions`)

- [x] **Core Fields**
  - [x] `id` (UUID, PK): Unique identifier
  - [x] `person_id` (UUID, FK): Reference to persons table

- [x] **Qualification Data**
  - [x] `decision_authority` (Text): Decision-making authority level
  - [x] `decision_timeline` (Text): Timeline for decision
  - [x] `previous_experience` (Text): Prior experience with similar services
  - [x] `competitor_considerations` (Array): Competing options
  - [x] `pain_points` (Array): Problems the person is trying to solve
  - [x] `motivations` (Array): Key motivating factors
  - [x] `objections` (JSONB Array): Sales objections and responses
  - [x] `readiness_score` (Integer): Lead readiness score (1-10)
  - [x] `lead_temperature` (Text): Hot/warm/cold classification

- [x] **Pipeline Data**
  - [x] `lead_status` (Text): Current status in sales pipeline
  - [x] `status_history` (JSONB Array): History of status changes
  - [x] `stage_duration_days` (JSONB): Time spent in each stage

- [x] **Activity Data**
  - [x] `visit_completed` (Boolean): Facility visit flag
  - [x] `visit_date` (Timestamp): Date of facility visit
  - [x] `trial_status` (Text): Trial membership status
  - [x] `trial_start_date` (Timestamp): Trial start date
  - [x] `trial_end_date` (Timestamp): Trial end date
  - [x] `forms_completed` (JSONB): Forms submitted
  - [x] `documents_shared` (JSONB Array): Documents shared
  - [x] `payment_info_collected` (Boolean): Payment info flag

- [x] **Conversion Data**
  - [x] `conversion_probability` (Integer): Likelihood of conversion
  - [x] `estimated_value` (Numeric): Estimated lifetime value
  - [x] `conversion_blockers` (Array): Obstacles to conversion

- [x] **Metadata**
  - [x] `created_at` (Timestamp): Record creation timestamp
  - [x] `updated_at` (Timestamp): Last update timestamp

- [x] **Indexes**
  - [x] Primary key on `id`
  - [x] Index on `person_id`
  - [x] Index on `lead_status`
  - [x] Index on `visit_completed`
  - [x] Index on `trial_status`
  - [x] Index on `conversion_probability`

- [x] **Constraints**
  - [x] Foreign key from `person_id` to `persons.id` with CASCADE delete
  - [x] Check constraint on `readiness_score` (1-10)
  - [x] Check constraint on `conversion_probability` (0-100)

#### 4. Referral Extensions Table (`referral_extensions`)

- [x] **Core Fields**
  - [x] `id` (UUID, PK): Unique identifier
  - [x] `person_id` (UUID, FK): Reference to persons table

- [x] **Referral Relationship**
  - [x] `relationship_to_referrer` (Text): Type of relationship
  - [x] `relationship_strength` (Text): Strength of relationship
  - [x] `permission_level` (Text): Contact permission level

- [x] **Referral Journey**
  - [x] `referral_status` (Text): Current status
  - [x] `status_history` (JSONB Array): History of status changes
  - [x] `time_in_stage_days` (JSONB): Time spent in each stage

- [x] **Appointment Data**
  - [x] `appointment_date` (Timestamp): Scheduled appointment
  - [x] `appointment_status` (Text): Appointment status
  - [x] `google_calendar_event_id` (Text): Calendar reference

- [x] **Conversion Data**
  - [x] `conversion_status` (Text): Conversion status
  - [x] `conversion_date` (Timestamp): Date of conversion
  - [x] `conversion_probability` (Integer): Likelihood of conversion

- [x] **Incentive Tracking**
  - [x] `eligible_incentives` (JSONB Array): Available incentives
  - [x] `incentives_awarded` (JSONB Array): Awarded incentives

- [x] **Marketing Engagement**
  - [x] `marketing_materials_sent` (JSONB Array): Materials shared
  - [x] `campaign_enrollments` (Array): Campaign participation
  - [x] `nurture_sequence_status` (JSONB): Nurture campaign status

- [x] **Metadata**
  - [x] `created_at` (Timestamp): Record creation timestamp
  - [x] `updated_at` (Timestamp): Last update timestamp

- [x] **Indexes**
  - [x] Primary key on `id`
  - [x] Index on `person_id`
  - [x] Index on `referral_status`
  - [x] Index on `appointment_date`
  - [x] Index on `conversion_status`

- [x] **Constraints**
  - [x] Foreign key from `person_id` to `persons.id` with CASCADE delete
  - [x] Check constraint on `conversion_probability` (0-100)

#### 5. Member Extensions Table (`member_extensions`)

- [x] **Core Fields**
  - [x] `id` (UUID, PK): Unique identifier
  - [x] `person_id` (UUID, FK): Reference to persons table

- [x] **Membership Data**
  - [x] `membership_type` (Text): Type of membership
  - [x] `membership_status` (Text): Active status
  - [x] `join_date` (Timestamp): When they became a member
  - [x] `membership_end_date` (Timestamp): End date if applicable
  - [x] `billing_day` (Integer): Monthly billing day

- [x] **Attendance Data**
  - [x] `check_in_count` (Integer): Total check-ins
  - [x] `last_check_in` (Timestamp): Last visit date
  - [x] `attendance_streak` (Integer): Consecutive attendance
  - [x] `classes_attended` (JSONB Array): Class attendance history

- [x] **Financial Data**
  - [x] `lifetime_value` (Numeric): Total revenue generated
  - [x] `current_monthly_spend` (Numeric): Current monthly revenue
  - [x] `payment_status` (Text): Payment status

- [x] **Retention Data**
  - [x] `satisfaction_score` (Integer): Satisfaction rating
  - [x] `churn_risk` (Text): Risk of cancellation
  - [x] `retention_actions` (JSONB Array): Retention efforts

- [x] **Referral Program**
  - [x] `referral_count` (Integer): Referrals made
  - [x] `successful_referrals` (Integer): Converted referrals
  - [x] `referral_rewards_earned` (Numeric): Rewards value

- [x] **Metadata**
  - [x] `created_at` (Timestamp): Record creation timestamp
  - [x] `updated_at` (Timestamp): Last update timestamp

- [x] **Indexes**
  - [x] Primary key on `id`
  - [x] Index on `person_id`
  - [x] Index on `membership_status`
  - [x] Index on `membership_type`
  - [x] Index on `join_date`
  - [x] Index on `churn_risk`

- [x] **Constraints**
  - [x] Foreign key from `person_id` to `persons.id` with CASCADE delete
  - [x] Check constraint on `satisfaction_score` (1-10)
  - [x] Check constraint on `billing_day` (1-31)

#### 6. Relationships Table (`relationships`)

- [x] **Core Fields**
  - [x] `id` (UUID, PK): Unique identifier
  - [x] `person_a_id` (UUID, FK): First person in relationship
  - [x] `person_b_id` (UUID, FK): Second person in relationship
  - [x] `relationship_type` (Text): Type of relationship

- [x] **Relationship Properties**
  - [x] `direction` (Text): Direction of relationship
  - [x] `referral_date` (Timestamp): When referral occurred
  - [x] `referral_channel` (Text): How referral was made
  - [x] `referral_campaign` (Text): Related campaign
  - [x] `referral_link_id` (Text): Tracking link ID

- [x] **Attribution Data**
  - [x] `is_primary_referrer` (Boolean): Primary referrer flag
  - [x] `attribution_percentage` (Integer): Credit split percentage
  - [x] `status` (Text): Relationship status
  - [x] `relationship_level` (Integer): Network distance
  - [x] `relationship_strength` (Text): Connection strength

- [x] **Metadata**
  - [x] `created_at` (Timestamp): Record creation timestamp
  - [x] `updated_at` (Timestamp): Last update timestamp
  - [x] `notes` (Text): Relationship notes

- [x] **Indexes**
  - [x] Primary key on `id`
  - [x] Index on `person_a_id`
  - [x] Index on `person_b_id`
  - [x] Index on `relationship_type`
  - [x] Composite index on (person_a_id, person_b_id, relationship_type)

- [x] **Constraints**
  - [x] Foreign key from `person_a_id` to `persons.id`
  - [x] Foreign key from `person_b_id` to `persons.id`
  - [x] Unique constraint on (person_a_id, person_b_id, relationship_type)
  - [x] Check constraint on `attribution_percentage` (0-100)
  - [x] Check constraint on `relationship_level` (>= 1)

#### 7. Interactions Table (`interactions`)

- [x] **Core Fields**
  - [x] `id` (UUID, PK): Unique identifier
  - [x] `person_id` (UUID, FK): Person involved
  - [x] `user_id` (UUID, FK): User involved
  - [x] `interaction_type` (Text): Type of interaction

- [x] **Content Fields**
  - [x] `subject` (Text): Interaction subject
  - [x] `content` (Text): Main content/notes
  - [x] `attachments` (JSONB Array): Related files

- [x] **Status Fields**
  - [x] `status` (Text): Interaction status
  - [x] `scheduled_at` (Timestamp): When planned
  - [x] `completed_at` (Timestamp): When completed
  - [x] `duration_minutes` (Integer): Duration if applicable

- [x] **Response Tracking**
  - [x] `response_received` (Boolean): Response flag
  - [x] `response_date` (Timestamp): Response date
  - [x] `response_content` (Text): Response content
  - [x] `sentiment` (Text): Response sentiment analysis

- [x] **Campaign Association**
  - [x] `campaign_id` (Text): Related campaign
  - [x] `template_id` (Text): Template used

- [x] **Metadata**
  - [x] `created_at` (Timestamp): Record creation timestamp
  - [x] `updated_at` (Timestamp): Last update timestamp
  - [x] `notes` (Text): Additional notes
  - [x] `custom_fields` (JSONB): Custom data fields

- [x] **Indexes**
  - [x] Primary key on `id`
  - [x] Index on `person_id`
  - [x] Index on `user_id`
  - [x] Index on `interaction_type`
  - [x] Index on `scheduled_at`
  - [x] Index on `completed_at`
  - [x] Index on `campaign_id`

- [x] **Constraints**
  - [x] Foreign key from `person_id` to `persons.id`
  - [x] Foreign key from `user_id` to `users.id`

#### 8. Messages Table (`messages`)

- [x] **Core Fields**
  - [x] `id` (UUID, PK): Unique identifier
  - [x] `sender_id` (UUID, FK): User sending message
  - [x] `recipient_id` (UUID, FK): Person receiving message
  - [x] `message_type` (Text): Email, SMS, etc.

- [x] **Content Fields**
  - [x] `subject` (Text): Message subject
  - [x] `content` (Text): Message content

- [x] **Status Tracking**
  - [x] `status` (Text): Delivery status
  - [x] `sent_at` (Timestamp): When sent
  - [x] `delivered_at` (Timestamp): When delivered
  - [x] `read_at` (Timestamp): When read

- [x] **Grouping and Templates**
  - [x] `is_blast` (Boolean): Mass communication flag
  - [x] `blast_id` (UUID): Group ID for blast
  - [x] `template_id` (UUID): Template reference
  - [x] `personalization_data` (JSONB): Variables for personalization
  - [x] `campaign_id` (Text): Associated campaign

- [x] **Response Tracking**
  - [x] `has_response` (Boolean): Response received flag
  - [x] `response_id` (UUID): Reference to response message

- [x] **Metadata**
  - [x] `metadata` (JSONB): Additional data
  - [x] `created_at` (Timestamp): Record creation timestamp
  - [x] `updated_at` (Timestamp): Last update timestamp

- [x] **Indexes**
  - [x] Primary key on `id`
  - [x] Index on `sender_id`
  - [x] Index on `recipient_id`
  - [x] Index on `message_type`
  - [x] Index on `sent_at`
  - [x] Index on `campaign_id`
  - [x] Index on `blast_id`
  - [x] Index on `has_response`

- [x] **Constraints**
  - [x] Foreign key from `sender_id` to `users.id`
  - [x] Foreign key from `recipient_id` to `persons.id`

### Database Relationships Checklist

- [x] **Person-centric Relationships**
  - [x] User to Person (one-to-many): Each person is assigned to one user
  - [x] Person to Lead Extension (one-to-one): Lead-specific data
  - [x] Person to Referral Extension (one-to-one): Referral-specific data
  - [x] Person to Member Extension (one-to-one): Member-specific data
  - [x] Person to Interactions (one-to-many): All interactions with person
  - [x] Person to Messages (one-to-many): All messages with person

- [x] **Relationship Network**
  - [x] Person to Person via Relationships table (many-to-many): Complex relationship network
  - [x] Referral chains via Relationship level field: Tracks multi-level referrals

- [x] **Communication Tracking**
  - [x] User to Messages (one-to-many): Messages sent by user
  - [x] User to Interactions (one-to-many): Interactions performed by user

### Performance Optimization Checklist

- [x] **Indexing Strategy**
  - [x] Primary key indexes on all tables
  - [x] Foreign key indexes on all relationship fields
  - [x] Composite indexes for common query patterns
  - [x] Indexes on frequently filtered fields
  - [x] Function-based indexes for advanced queries

- [x] **Query Optimization**
  - [x] Materialized views for complex aggregations
  - [x] Denormalized fields for frequent joins
  - [x] Optimized JSON/JSONB queries
  - [x] Effective use of covering indexes

- [x] **Data Partitioning**
  - [x] Consider partitioning strategies for large tables
  - [x] Archive strategy for historical data

### Security Checklist

- [x] **Row-Level Security**
  - [x] Policies for user data (users can only see their own data)
  - [x] Policies for admin access (admins can see all data)
  - [x] Policies for person data (users can only see assigned persons)

- [x] **Data Protection**
  - [x] Sensitive data field identification
  - [x] Encryption strategy for sensitive fields
  - [x] Audit trail for sensitive data access

### Migration Strategy Checklist

- [x] **Initial Schema Migration**
  - [x] Core tables creation script
  - [x] Indexes creation script
  - [x] Constraints creation script
  - [x] Default data population script

- [x] **Upgrade Path**
  - [x] Version tracking for schema changes
  - [x] Backwards compatibility considerations
  - [x] Rollback procedures

- [x] **Data Validation**
  - [x] Integrity checks post-migration
  - [x] Performance validation post-migration

This database structure is designed to support all the features outlined in the PRD while maintaining performance, security, and scalability.

## Git History

The initial commit (`e936f70`) established the base project structure with the following components:
- Project architecture and file structure
- Frontend UI components and pages
- Backend server configuration and middleware
- Authentication system structure
- Configuration files and documentation

Recent commits:
```bash
# Initial commit message
Initial project structure and setup for ORCA Lead Management Software

# Recent commits
Implement lead management backend and frontend integration
Enhance referral network visualization with improved UI and functionality
Implement hierarchical layout for referral network with members at top and referrals below
Implement user authentication with Supabase and fallback to mock data
Add Vercel deployment configuration
```

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm or yarn
- Supabase account
- Telnyx account (for SMS)
- Google Developer account (for Gmail and Calendar)
- Firebase account (for Dynamic Links)
- Stripe account (for payments)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/orca-lead-management.git
cd orca-lead-management
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables
```bash
# Copy the example env files
cp .env.example .env
cp client/.env.example client/.env
```

4. Update the environment variables in both `.env` files with your actual credentials.

5. Start the development servers
```bash
# From the root directory, start both client and server
npm run dev
```

## Development

### Client
The client will be available at `http://localhost:3000`

### Server
The server will be available at `http://localhost:5001`

## Deployment

### Vercel Deployment

This project is configured for deployment on Vercel. Follow these steps to deploy:

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Deploy to Vercel**
   ```bash
   npm run deploy
   ```

   Alternatively, you can deploy directly:
   ```bash
   vercel --prod
   ```

5. **Environment Variables**
   Make sure to set up all environment variables in your Vercel project settings:
   
   - Go to the Vercel dashboard
   - Select your project
   - Navigate to "Settings" > "Environment Variables"
   - Add all the environment variables from your `.env` file

6. **Vercel Configuration**
   The project includes a `vercel.json` configuration file that:
   - Specifies build configurations for both the server and client
   - Sets up routing to direct API requests to the server and all other requests to the React app

7. **Monitoring Your Deployment**
   After deployment, you can monitor your application from the Vercel dashboard, including:
   - Deployment logs
   - Runtime logs
   - Performance metrics
   - Usage statistics

## License
[MIT](LICENSE)

## Acknowledgements
- [Supabase](https://supabase.io/)
- [Material-UI](https://mui.com/)
- [Telnyx](https://telnyx.com/)
- [Firebase](https://firebase.google.com/)
- [Vercel](https://vercel.com/)
- [Stripe](https://stripe.com/) 

## Project Task List

### 1. Project Setup & Architecture
- [x] Set up project repository with defined structure
- [x] Initialize React.js frontend
- [x] Initialize Node.js backend
- [x] Configure Supabase database and connection
- [x] Set up Vercel deployment
- [x] Initialize Stripe integration
- [x] Create UI theme (dark mode with aqua blue accents)
- [x] Set up component library
- [x] Implement authentication system with Supabase Auth

### 2. Database Models
- [x] Create User model
- [x] Implement unified Person model
- [x] Create Lead Extension model
- [x] Create Referral Extension model
- [x] Create Member Extension model
- [x] Create Relationship model
- [x] Create Interaction model
- [x] Create Message model
- [x] Set up Row-Level Security (RLS) in Supabase

### 3. API Development
- [x] Create auth API endpoints
- [x] Develop person API endpoints
- [x] Build lead management API endpoints
- [x] Implement referral system API endpoints
- [x] Create messaging API endpoints
- [x] Set up middleware for authentication
- [x] Implement API error handling

### 4. Authentication & User Management
- [x] Implement user registration functionality
- [x] Build login/logout system
- [x] Create password recovery flow
- [x] Set up role-based permissions (Admin vs. Salesperson)
- [x] Implement JWT token management
- [x] Create user profile management interface

### 5. Lead Management System (MVP)
- [x] Build lead creation form with comprehensive fields
- [x] Implement lead editing functionality
- [x] Create lead list/table view with filtering and sorting
- [x] Develop pipeline view with drag-and-drop
- [x] Build lead detail view with activity timeline
- [x] Implement lead status tracking and history

### 6. Communication Tools (MVP)
- [x] Integrate Telnyx API for SMS
- [x] Implement individual SMS messaging
- [x] Develop basic text blast functionality
- [x] Integrate Google Workspace/Gmail API
- [x] Create email composition and templates
- [x] Implement message tracking system

### 7. Referral System (MVP)
- [x] Integrate Firebase Dynamic Links
- [x] Create referral submission form
- [x] Implement Google Calendar API integration
- [x] Build appointment booking flow
- [x] Develop referral tracking dashboard
- [x] Create referral status management system

### 8. Enhanced Text Blast (Phase 2)
- [x] Implement advanced filtering and segmentation
- [x] Add personalization tags functionality
- [x] Create scheduled message delivery system
- [x] Build analytics for text blast campaigns

### 9. Referral Network Visualization (Phase 2)
- [x] Select and integrate visualization library (D3.js)
- [x] Create interactive network visualization component
- [x] Implement node differentiation (referrals vs. members)
- [x] Develop multiple referrer relationship visualization
- [x] Integrate visualization into member profiles
- [x] Optimize performance for large networks

### 10. Advanced Analytics (Phase 2)
- [x] Create lead performance dashboard
- [x] Build referral program effectiveness metrics
- [x] Implement communication effectiveness reports
- [x] Develop salesperson performance tracking
- [x] Create export functionality for reports

### 11. Testing and Validation
- [x] Create comprehensive tests to verify schema alignment:
  - [x] Create model validation tests for all constraints
  - [x] Create API endpoint tests that verify field handling
  - [x] Create integration tests for complex data operations
  - [x] Add database schema verification to CI/CD pipeline
  - [x] Create a shared validation library for use across the application

### 12. Deployment & DevOps
- [x] Set up CI/CD pipeline with Vercel
- [x] Configure staging and production environments
- [x] Implement error tracking and monitoring
- [x] Set up database backup procedures
- [x] Establish maintenance windows for updates
- [x] Create scripts for running tests
- [x] Add scripts for security testing

### 13. Documentation & Training
- [x] Create technical documentation
- [x] Develop user manual
- [x] Build training materials for salespeople
- [x] Document API endpoints for future integrations


==============================================================
## Database Schema Alignment

To ensure our codebase is fully aligned with the database schema, we've created a comprehensive reference of the current database schema in [server/db/schema/current_schema.sql](server/db/schema/current_schema.sql).

### Identified Schema Inconsistencies

After comparing the TypeScript interfaces with the SQL schema, the following inconsistencies were identified:

#### TypeScript Interface Issues

1. **Interaction Interface**:
   - Missing proper nullable/required designations for fields
   - `attachments` is defined as an array of objects with `name`, `url`, and `type` properties, but the SQL schema uses `jsonb[]`
   - `sentiment` is restricted to 'positive' | 'neutral' | 'negative' in TS but is a free-form text field in SQL

2. **Message Interface**:
   - `message_type` is restricted to 'email' | 'sms' | 'blast' in TS, but is a free-form text field in SQL
   - `content` and `message_type` are marked as NOT NULL in SQL but don't have proper required designations in TS

3. **LeadExtension Interface**:
   - `lead_temperature` is typed as 'hot' | 'warm' | 'cold' in TS, but is a free-form text field in SQL
   - Missing SQL constraint enforcement for `readiness_score` (1-10) and `conversion_probability` (0-100)

4. **Relationship Interface**:
   - `relationship_type` is optional in TS, but NOT NULL in SQL
   - `status` is restricted to 'active' | 'inactive' in TS, but is a free-form text field in SQL
   - Missing constraint enforcement for `relationship_level` (>= 1) and `attribution_percentage` (0-100)

5. **General Issues**:
   - Timestamp fields are typed as `string` in TS, but should be more specific
   - SQL schema uses `numeric` type for monetary values, but TS uses `number`
   - JSON/JSONB handling inconsistencies between SQL and TS
   - Constraint validations from SQL not reflected in TS interfaces

#### Model Implementation Issues

1. **Model Field Definitions**:
   - Model files define fields in comments but these don't always match actual SQL schema
   - Missing validation logic for SQL constraints like NOT NULL, unique constraints, and check constraints

2. **Client-Side References**:
   - Client code makes direct references to database fields without type checking
   - Inconsistent field naming between client and server

### Database Schema Alignment Tasks

The following tasks are required to ensure full alignment between our codebase and database schema:

#### 1. TypeScript Interfaces Alignment

- [x] Update TypeScript interfaces in `server/db/schema/types.ts` to align with SQL schema:
  - [x] Update `Interaction` interface with missing fields (scheduled_at, completed_at, duration_minutes, etc.)
  - [x] Update `Message` interface with correct constraints (NOT NULL for content and message_type)
  - [x] Update `LeadExtension` interface with constraint validations (readiness_score 1-10, conversion_probability 0-100)
  - [x] Update `ReferralExtension` interface with full set of fields and constraints
  - [x] Update `MemberExtension` interface with constraint validations (billing_day 1-31, satisfaction_score 1-10)
  - [x] Update `Relationship` interface with constraint validations (relationship_level >= 1, attribution_percentage 0-100)
  - [x] Add explicit type validation for enum-like fields (lead_temperature, churn_risk, etc.)

#### 2. Model Implementations Alignment

- [x] Update model field definitions in JavaScript models to match the database schema:
  - [x] Update `personModel.js` field definitions with complete field set
  - [x] Update `interactionModel.js` with correct field types and constraints
  - [x] Update `messageModel.js` with correct NOT NULL constraints
  - [x] Update `leadModel.js` with field validations matching SQL constraints
  - [x] Update `referralModel.js` with complete field set
  - [x] Update `memberModel.js` with field validations matching SQL constraints
  - [x] Update `relationshipModel.js` with UNIQUE constraint handling
  - [x] Update `userModel.js` with UNIQUE email constraint handling

#### 3. Client-Side Schema References

- [x] Update client-side API interfaces to match server-side models:
  - [x] Update `client/src/services/api.js` with consistent field references
  - [x] Update `client/src/services/supabaseClient.js` with consistent table and field references
  - [x] Update `client/src/services/dashboardService.js` with consistent data models
  - [x] Create client-side TypeScript interfaces to match server-side models
  - [x] Ensure forms and validation logic match database constraints

#### 4. Forms and Input Validation

- [x] Update form validation logic to match database constraints:
  - [x] Add validation for numeric ranges (readiness_score, conversion_probability, etc.)
  - [x] Add validation for required fields based on NOT NULL constraints
  - [x] Add unique constraint validation for email addresses and other unique fields
  - [x] Add validation for foreign key references to ensure integrity
  - [x] Update Yup validation schemas in form components:
    - [x] `client/src/components/referrals/ReferralForm.js`
    - [x] `client/src/components/leads/LeadForm.js`
    - [x] `client/src/components/interactions/InteractionForm.js`
    - [x] `client/src/components/messaging/MessageComposer.js`

#### 5. Data Transformation and Query Logic

- [x] Update data transformation logic to handle all field types correctly:
  - [x] Ensure proper handling of array types (text[], jsonb[])
  - [x] Ensure proper handling of JSONB fields
  - [x] Ensure timestamp fields are consistently formatted
  - [x] Ensure proper handling of NULL values based on constraints
  - [x] Review and update data transformation in:
    - [x] `client/src/components/messaging/TextBlastManager.js`
    - [x] `client/src/pages/LeadDetails.js`
    - [x] `client/src/utils/supabaseUtils.js`

#### 6. Direct Database Operations

- [x] Update direct database operations to respect schema constraints:
  - [x] Add validation before database inserts and updates
  - [x] Implement type checking for direct Supabase queries
  - [x] Create shared utilities for common database operations
  - [x] Add error handling for constraint violations
  - [x] Focus on critical components:
    - [x] `client/src/services/supabaseClient.js`
    - [x] `client/src/utils/supabaseUtils.js`

#### 7. Testing and Validation

- [x] Create comprehensive tests to verify schema alignment:
  - [x] Create model validation tests for all constraints
  - [x] Create API endpoint tests that verify field handling
  - [x] Create integration tests for complex data operations
  - [x] Add database schema verification to CI/CD pipeline
  - [x] Create a shared validation library for use across the application

#### 8. Schema Consistency Tools

- [x] Implement tools to maintain schema consistency:
  - [x] Create a schema checking utility for development
  - [x] Add pre-commit hooks to validate schema consistency
  - [x] Implement runtime validation for critical operations
  - [x] Create documentation generation from the schema

#### 9. Documentation Updates

- [x] Update documentation to reflect the complete and accurate schema:
  - [x] Update API documentation with complete field definitions
  - [x] Update code comments in model files to match schema
  - [x] Add schema diagrams for visual reference
  - [x] Document constraint implications for developers
  - [x] Create a comprehensive schema reference guide

> **Completed**: A comprehensive schema reference guide is now available in the [docs/schema](docs/schema/README.md) directory, which includes an [Entity Relationship Diagram](docs/schema/erd.md), [API Integration Guide](docs/schema/api_integration.md), [Constraints Documentation](docs/schema/constraints.md), and [Developer Guidelines](docs/schema/developer_guidelines.md).

By completing these tasks, we will ensure that our entire codebase is aligned with the database schema, preventing inconsistencies and potential errors in data handling.
=========================================


## Database Backup System

ORCA includes a comprehensive database backup system to ensure data safety and reliability. The backup system includes:

### Features

- **Scheduled Automatic Backups**: Configured via cron schedule in environment variables
- **Backup Retention Management**: Automatically removes backups older than the configured retention period
- **Manual Backup Initiation**: API endpoints for admins to trigger manual backups
- **Backup Restoration**: Support for restoring the database from a previous backup
- **Admin-only Access**: All backup operations are restricted to admin users

### Configuration

Database backup settings can be configured through environment variables:

```bash
# Database Backup Configuration
ENABLE_AUTO_BACKUPS=true           # Enable/disable automatic backups
BACKUP_DIR=./backups               # Directory to store backups
BACKUP_SCHEDULE=0 1 * * *          # Cron schedule (1:00 AM daily)
BACKUP_RETENTION_DAYS=30           # Keep backups for 30 days
BACKUP_TABLES=users,persons,...     # Tables to include in backup
```

### API Endpoints

The following API endpoints are available for backup management:

- `GET /api/database/backups` - List all available backups
- `POST /api/database/backup` - Perform a manual backup
- `POST /api/database/restore/:filename` - Restore database from a backup
- `POST /api/database/export` - Export database using Supabase CLI
- `DELETE /api/database/backups/:filename` - Delete a specific backup

All endpoints require admin authentication 

## Maintenance Windows System

ORCA includes a comprehensive maintenance window management system to ensure smooth updates and minimize disruption:

### Features

- **Scheduled Recurring Maintenance**: Automatically activate maintenance mode at specified times
- **Manual Maintenance Control**: Admin-only API for triggering ad-hoc maintenance
- **Maintenance Simulation**: Test maintenance mode without affecting users
- **Maintenance History**: Track all maintenance events and their details
- **Custom Notifications**: Configurable user-facing messages during maintenance
- **Auto-restoration**: Automatically exit maintenance mode after a specified duration

### Configuration

Maintenance windows can be configured through environment variables:

```bash
# Maintenance Window Configuration
ENABLE_SCHEDULED_MAINTENANCE=true
MAINTENANCE_SCHEDULE=0 3 * * 0  # Cron schedule (3:00 AM every Sunday)
MAINTENANCE_DURATION_MINUTES=120  # 2 hours
MAINTENANCE_LOGS_DIR=./maintenance-logs
MAINTENANCE_DRY_RUN=false
MAINTENANCE_MESSAGE=The system is currently undergoing scheduled maintenance. Please try again later.
```

### API Endpoints

The following API endpoints are available for maintenance management:

- `GET /api/maintenance/status` - Check current maintenance status (public)
- `GET /api/maintenance/history` - View maintenance history (admin only)
- `POST /api/maintenance/start` - Start a maintenance window (admin only)
- `POST /api/maintenance/end` - End a maintenance window (admin only)
- `POST /api/maintenance/simulate` - Simulate a maintenance window (admin only)

### Implementation Details

- **Express Middleware**: All requests are intercepted by the maintenance middleware
- **Service Degradation**: During maintenance, API endpoints return 503 Service Unavailable with a retry-after header
- **Admin Bypass**: Maintenance API endpoints remain accessible to admins during maintenance
- **Detailed Logging**: Each maintenance event is logged with details about who initiated it and for what reason

## Testing Approach

The ORCA Lead Management Software uses a comprehensive testing strategy to ensure reliability and maintainability:

### Backend Testing

#### Model Tests
- **Framework**: Jest
- **Approach**: Unit tests with mocked Supabase client
- **Coverage**: CRUD operations and business logic for all data models
- **Location**: `server/tests/models/`
- **Run Command**: `cd server && npm run test:models`

Model tests verify that the data layer correctly interacts with the Supabase database and implements all required business logic, including:
- Proper handling of relationships between models
- Correct filtering and pagination
- Error handling and validation
- Extension pattern for lead, referral, and member data

#### Running Tests
```bash
# Run all tests
cd server && npm test

# Run only model tests
cd server && npm run test:models

# Run tests with coverage report
cd server && npm run test:coverage
```

### Future Test Expansion
The testing infrastructure is set up to be expanded with:
- API endpoint tests (controller layer)
- Integration tests for critical flows
- Performance tests for bulk operations
- Security tests for authentication and authorization 

## Documentation

The ORCA Lead Management Software includes comprehensive documentation:

- **Technical Documentation**: This README provides technical details for developers and administrators.
- **User Manual**: A complete user guide is available in [docs/user-manual.md](docs/user-manual.md).
- **Training Guide**: A 5-day training curriculum for salespeople is available in [docs/training-guide.md](docs/training-guide.md).
- **API Documentation**: API endpoints are documented in the server code comments.
- **Database Schema**: Database structure is documented in the [Database Structure](#database-structure) section above. 