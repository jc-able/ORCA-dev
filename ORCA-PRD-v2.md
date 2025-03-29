# Product Requirements Document (PRD)

## 1. Project Overview

- **Project Name**: ORCA Lead Management Software
- **Purpose**: To provide salespeople in membership-based businesses (gyms and similar community organizations) with a comprehensive tool to manage leads, communicate with them, track their progress, and leverage referrals through a streamlined appointment scheduling system and text blast functionality. The key feature of ORCA is the referral system which allows the salesperson to manage sales leads, Members (converted leads), Member referrals (leads invited and linked to member and salesperson), and personal refferal (leads invited and linked to salesperson). This allows the salesperson to maximize sales by efficiently utilizing the power of a referral system.
- **Target Users**: Salespeople in gym and membership-based industries
- **Business Model**: SaaS with tiered subscription plans
- **Technology Stack**:
  - **Frontend**: React.js with JavaScript
  - **Backend**: Node.js
  - **Database**: Supabase SQL
  - **Hosting**: Vercel
  - **Payment Processing**: Stripe

## 2. System Architecture

```
project/
├── client/          # React frontend
│   ├── public/      # Static assets (index.html, favicon, images)
│   ├── src/         
│   │   ├── components/     # Reusable UI components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── leads/      # Lead management components
│   │   │   ├── referrals/  # Referral tracking components
│   │   │   ├── messaging/  # Communication components
│   │   │   └── ui/         # Common UI elements
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # State management contexts
│   │   ├── services/       # API service integrations
│   │   ├── utils/          # Utility functions
│   │   ├── styles/         # Global styles and themes
│   │   ├── App.js          # Main application component
│   │   └── index.js        # Entry point
│   ├── package.json        # Frontend dependencies
│   └── .env                # Environment variables (gitignored)
├── server/          # Node.js backend
│   ├── config/      # Configuration files
│   │   └── supabase.js     # Supabase connection
│   ├── controllers/ # Business logic
│   │   ├── authController.js
│   │   ├── leadController.js
│   │   ├── referralController.js
│   │   └── messagingController.js
│   ├── models/      # Data models
│   │   ├── userModel.js
│   │   ├── personModel.js         # Unified person model
│   │   ├── leadExtensionModel.js
│   │   ├── referralExtensionModel.js
│   │   ├── memberExtensionModel.js
│   │   ├── relationshipModel.js
│   │   ├── interactionModel.js
│   │   └── messageModel.js
│   ├── routes/      # API endpoints
│   │   ├── authRoutes.js
│   │   ├── personRoutes.js
│   │   ├── leadRoutes.js
│   │   ├── referralRoutes.js
│   │   └── messagingRoutes.js
│   ├── middleware/  # Custom middleware
│   │   └── authMiddleware.js
│   ├── utils/       # Utility functions
│   ├── tests/       # Backend tests
│   ├── server.js    # Main server file
│   ├── package.json # Backend dependencies
│   └── .env         # Environment variables (gitignored)
├── .gitignore       # Version control ignore file
├── README.md        # Project documentation
└── package.json     # Root package.json for dev scripts
```

## 3. User Roles and Permissions

### Admin
- Full system access and configuration
- User management (create, update, delete salespeople)
- Access to all leads, referrals, and communications
- System settings configuration
- Reporting and analytics for all users

### Salesperson
- Manage sales leads, Members (converted leads), Member referrals (leads invited and linked to member and salesperson), and personal refferal (leads invited and linked to salesperson)
- Generate and share referral links
- Send text communications (individual and blast)
- View personal performance metrics
- Calendar management for appointments

## 4. Feature List

### Phase 1: Core Features (MVP)

#### User Management
- **User Authentication**
  - Implementation: Supabase Auth integration
  - Features: Admin and salesperson role-based access
  - Technical Considerations: JWT token implementation, session management
  - Acceptance Criteria: Users can register, log in, log out, and recover passwords

#### Lead Management
- **Lead Creation and Information**
  - Implementation: Comprehensive lead information form
  - Data Fields:
    - Basic: name, email, phone, address, age/DOB, gender, preferred contact, referral source
    - Qualification: interest level, budget range, timeline, decision authority, experience, goals
    - Activities: last contact, next scheduled contact, visit status, trial status, forms completed
    - Preferences: membership type, interested services, schedule preferences, requirements
  - Technical Considerations: Structured data storage in Supabase
  - Acceptance Criteria: Users can add/edit comprehensive lead profiles

- **Lead Organization and Pipeline**
  - Implementation: Customizable pipeline view with drag-and-drop
  - Pipeline Stages: New, Contacted, Appointment Scheduled, Appointment Completed, Proposal Made, Negotiation, Won, Lost, Nurturing
  - Features: Filtering, sorting, status updates, age tracking
  - Technical Considerations: Real-time updates via Supabase
  - Acceptance Criteria: Users can move leads through pipeline stages and filter by various criteria

#### Communication Tools
- **Email Integration**
  - Implementation: Google Workspace/Gmail API integration
  - Features: Email composition, templates, sending from app interface
  - Technical Considerations: OAuth authentication, email deliverability
  - Acceptance Criteria: Users can send individual emails to leads from within ORCA

- **SMS Messaging**
  - Implementation: Telnyx API integration
  - Features: Individual SMS messaging to leads
  - Technical Considerations: Phone number validation, message delivery status
  - Acceptance Criteria: Users can send individual SMS messages with delivery confirmation

- **Text Blast (Phase 1 - Basic)**
  - Implementation: Telnyx API with basic recipient selection
  - Features: Simple selection of multiple recipients, message composition
  - Technical Considerations: Rate limiting, compliance with messaging regulations
  - Acceptance Criteria: Users can send the same SMS message to multiple leads at once

#### Referral System
- **Referral Link Creation**
  - Implementation: Firebase Dynamic Links
  - Features: Generate unique referral links tied to salesperson
  - Technical Considerations: Tracking parameters, link analytics
  - Acceptance Criteria: Salespeople can generate and share unique referral links

- **Referral Form**
  - Implementation: Custom form based on link parameters
  - Data Capture: Referral contact information, interests, preferences
  - Technical Considerations: Mobile-responsive design, data validation
  - Acceptance Criteria: Referrals can submit information via a branded, mobile-friendly form

- **Appointment Scheduling**
  - Implementation: Google Calendar API integration
  - Features: Show available time slots based on salesperson's calendar
  - Flow: Referral submits form → Views calendar → Books appointment → Both parties receive confirmation
  - Technical Considerations: Time zone handling, calendar synchronization
  - Acceptance Criteria: Referrals can book appointments with the salesperson after form submission

- **Referral Network Visualization**
  - Implementation: Interactive network visualization component
  - Features:
    - Visual representation of referral relationships
    - Member profile integration for direct access to referral networks
    - Persistent display of converted referrals
    - Support for multiple referrers per referral
  - Technical Considerations: 
    - Optimized data loading for performance
    - Clear visual distinction between referrals and converted members
    - Handling of complex relationship trees
  - Acceptance Criteria: 
    - Users can view, interact with, and navigate referral networks from member profiles
    - Networks display both referrals and converted members with appropriate visual differentiation
    - Multiple referrer relationships are clearly represented

### Phase 2: Enhanced Features

#### User Management (Advanced)
- **Profile Management**
  - Implementation: Extended user profile options
  - Features: Performance tracking, notification preferences
  - Acceptance Criteria: Users can customize their profiles and notification settings

#### Lead Management (Advanced)
- **Advanced Analytics**
  - Implementation: Reporting dashboard with key metrics
  - Features: Conversion rates, pipeline velocity, performance by source
  - Acceptance Criteria: Users can view detailed performance metrics and export reports

#### Text Blast (Phase 2 - Advanced)
- **Enhanced Blast Capabilities**
  - Implementation: Advanced filtering and segmentation
  - Features: 
    - Personalization tags (first name, etc.)
    - Segment by lead type (hot/cold)
    - Filter by time since last contact
    - Filter by lead source (referral, walk-in, etc.)
    - Schedule messages for future delivery
  - Technical Considerations: Template variables, scheduled job processing
  - Acceptance Criteria: Users can send personalized mass messages to specific lead segments

#### Contact Activity Tracking
- **Communication History**
  - Implementation: Centralized activity log
  - Features: Track all interactions between salesperson and leads
  - Technical Considerations: Event logging system, filterable history
  - Acceptance Criteria: Users can view complete communication history with each lead

## 5. Data Models

### User Model
```
users {
  id: uuid PRIMARY KEY,
  email: string UNIQUE NOT NULL,
  password: string NOT NULL (hashed),
  first_name: string,
  last_name: string,
  phone: string,
  role: string DEFAULT 'salesperson',
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now(),
  last_login: timestamp,
  settings: jsonb
}
```

### Person Model (New Unified Base Model)
```
persons {
  id: uuid PRIMARY KEY,
  
  // Basic information
  first_name: string NOT NULL,
  last_name: string NOT NULL,
  email: string,
  phone: string,
  secondary_phone: string,
  address: jsonb,
  dob: date,
  gender: string,
  
  // Contact preferences
  preferred_contact_method: string,
  preferred_contact_times: jsonb,
  contact_frequency_preference: string,
  do_not_contact_until: timestamp,
  email_opt_in: boolean DEFAULT true,
  sms_opt_in: boolean DEFAULT true,
  
  // Social profiles
  social_profiles: jsonb, // {platform: url}
  
  // Roles and status
  is_lead: boolean DEFAULT false,
  is_referral: boolean DEFAULT false,
  is_member: boolean DEFAULT false,
  active_status: boolean DEFAULT true,
  
  // Source information
  acquisition_source: string,
  acquisition_campaign: string,
  acquisition_date: timestamp,
  utm_parameters: jsonb,
  referral_source: string,
  
  // Shared qualification data
  interest_level: string,
  goals: text,
  preferred_membership: string,
  interested_services: string[],
  preferred_schedule: jsonb,
  special_requirements: text,
  
  // Financial information
  budget_range: string,
  payment_preferences: string,
  price_sensitivity: string,
  
  // Common fields
  profile_completeness: integer DEFAULT 0,
  tags: string[],
  custom_fields: jsonb,
  
  // Meta
  assigned_to: uuid REFERENCES users(id),
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now(),
  last_contacted: timestamp,
  next_scheduled_contact: timestamp,
  notes: text
}
```

### Lead Extension Model
```
lead_extensions {
  id: uuid PRIMARY KEY,
  person_id: uuid REFERENCES persons(id) ON DELETE CASCADE,
  
  // Lead qualification data
  decision_authority: string,
  decision_timeline: string,
  previous_experience: text,
  competitor_considerations: string[],
  pain_points: text[],
  motivations: text[],
  objections: jsonb[], // [{objection: string, response: string, resolved: boolean}]
  readiness_score: integer, // 1-10
  lead_temperature: string, // hot, warm, cold
  
  // Pipeline data
  lead_status: string DEFAULT 'new',
  status_history: jsonb[], // [{status: string, timestamp: timestamp, notes: string}]
  stage_duration_days: jsonb, // {stage_name: days_count}
  
  // Activity data
  visit_completed: boolean DEFAULT false,
  visit_date: timestamp,
  trial_status: string,
  trial_start_date: timestamp,
  trial_end_date: timestamp,
  forms_completed: jsonb,
  documents_shared: jsonb[], // [{name: string, url: string, shared_date: timestamp}]
  payment_info_collected: boolean DEFAULT false,
  
  // Conversion tracking
  conversion_probability: integer, // 0-100
  estimated_value: decimal,
  conversion_blockers: string[],
  
  // Meta
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
}
```

### Referral Extension Model
```
referral_extensions {
  id: uuid PRIMARY KEY,
  person_id: uuid REFERENCES persons(id) ON DELETE CASCADE,
  
  // Referral specific data
  relationship_to_referrer: string, // friend, family, colleague, etc.
  relationship_strength: string, // strong, medium, weak
  permission_level: string, // explicit, implied, cold
  
  // Referral journey
  referral_status: string DEFAULT 'submitted', // submitted, contacted, appointment_scheduled, etc.
  status_history: jsonb[], // [{status: string, timestamp: timestamp, notes: string}]
  time_in_stage_days: jsonb, // {stage_name: days_count}
  
  // Appointment data
  appointment_date: timestamp,
  appointment_status: string,
  google_calendar_event_id: string,
  
  // Conversion tracking
  conversion_status: string,
  conversion_date: timestamp,
  conversion_probability: integer, // 0-100
  
  // Incentive tracking
  eligible_incentives: jsonb[],
  incentives_awarded: jsonb[], // [{incentive_id: uuid, award_date: timestamp, status: string}]
  
  // Marketing engagement
  marketing_materials_sent: jsonb[], // [{material_id: uuid, send_date: timestamp, opened: boolean}]
  campaign_enrollments: string[],
  nurture_sequence_status: jsonb,
  
  // Meta
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
}
```

### Member Extension Model
```
member_extensions {
  id: uuid PRIMARY KEY,
  person_id: uuid REFERENCES persons(id) ON DELETE CASCADE,
  
  // Membership data
  membership_type: string,
  membership_status: string,
  join_date: timestamp,
  membership_end_date: timestamp,
  billing_day: integer,
  
  // Attendance and engagement
  check_in_count: integer DEFAULT 0,
  last_check_in: timestamp,
  attendance_streak: integer DEFAULT 0,
  classes_attended: jsonb[], // [{class_id: uuid, date: timestamp}]
  
  // Financial
  lifetime_value: decimal,
  current_monthly_spend: decimal,
  payment_status: string,
  
  // Retention and satisfaction
  satisfaction_score: integer, // 1-10
  churn_risk: string, // low, medium, high
  retention_actions: jsonb[], // [{action: string, date: timestamp, result: string}]
  
  // Referral program
  referral_count: integer DEFAULT 0,
  successful_referrals: integer DEFAULT 0,
  referral_rewards_earned: decimal DEFAULT 0,
  
  // Meta
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
}
```

### Relationship Model
```
relationships {
  id: uuid PRIMARY KEY,
  
  // The two people in the relationship
  person_a_id: uuid REFERENCES persons(id) ON DELETE CASCADE,
  person_b_id: uuid REFERENCES persons(id) ON DELETE CASCADE,
  
  // Relationship type and direction
  relationship_type: string, // referral, spouse, friend, trainer, etc.
  direction: string, // a_to_b, b_to_a, bidirectional
  
  // Referral specific (when type is referral)
  referral_date: timestamp,
  referral_channel: string, // app, email, in-person, etc.
  referral_campaign: string,
  referral_link_id: string,
  
  // Attribution
  is_primary_referrer: boolean,
  attribution_percentage: integer DEFAULT 100, // For split credit
  
  // Status
  status: string DEFAULT 'active', // active, inactive
  relationship_level: integer DEFAULT 1, // 1 for direct, 2+ for indirect connections
  relationship_strength: string, // strong, medium, weak
  
  // Meta
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now(),
  notes: text,
  
  // Constraints
  UNIQUE(person_a_id, person_b_id, relationship_type)
}
```

### Interaction Model
```
interactions {
  id: uuid PRIMARY KEY,
  
  // Who and what
  person_id: uuid REFERENCES persons(id) ON DELETE CASCADE,
  user_id: uuid REFERENCES users(id),
  interaction_type: string, // email, sms, call, meeting, note, etc.
  
  // Content
  subject: string,
  content: text,
  attachments: jsonb[], // [{name: string, url: string, type: string}]
  
  // Status and tracking
  status: string DEFAULT 'completed',
  scheduled_at: timestamp,
  completed_at: timestamp,
  duration_minutes: integer,
  
  // Response tracking
  response_received: boolean DEFAULT false,
  response_date: timestamp,
  response_content: text,
  sentiment: string, // positive, neutral, negative
  
  // Association with campaigns
  campaign_id: string,
  template_id: string,
  
  // Meta
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now(),
  notes: text,
  custom_fields: jsonb
}
```

### Message Model (Updated)
```
messages {
  id: uuid PRIMARY KEY,
  
  // Sender and recipient
  sender_id: uuid REFERENCES users(id),
  recipient_id: uuid REFERENCES persons(id),
  
  // Message details
  message_type: string NOT NULL, // 'email', 'sms', 'blast'
  subject: string,
  content: text NOT NULL,
  
  // Status tracking
  status: string DEFAULT 'sent',
  sent_at: timestamp DEFAULT now(),
  delivered_at: timestamp,
  read_at: timestamp,
  
  // For group messages
  is_blast: boolean DEFAULT false,
  blast_id: uuid,
  
  // Personalization and campaign info
  template_id: uuid,
  personalization_data: jsonb,
  campaign_id: string,
  
  // Response tracking
  has_response: boolean DEFAULT false,
  response_id: uuid,
  
  // Meta
  metadata: jsonb,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
}
```

## 6. UI Design Principles

### Design System
- **Theme**: Minimalistic, modern dark mode
- **Color Palette**: 
  - Primary: Aqua Blue (#00BFFF)
  - Background: Dark Grey/Black (#121212)
  - Surface Elements: Slightly lighter grey (#1E1E1E, #2D2D2D)
  - Text: White (#FFFFFF) and Light Grey (#E0E0E0)
  - Accents: Medium Grey (#808080), Darker Aqua (#0099CC) for depth
  - Visualization Colors:
    - Referral Nodes: Aqua Blue (#00BFFF)
    - Member Nodes: Light Grey (#E0E0E0)
    - Multiple Referrer Connections: Grey to Aqua gradient
- **Typography**: 
  - Clean sans-serif fonts (Roboto, Inter, or similar)
  - Limited font weights for simplicity (Regular, Medium, Bold)
  - Higher contrast text for better readability on dark backgrounds
- **Design Elements**:
  - Flat design with minimal elevation
  - Subtle depth through darker borders rather than shadows
  - Generous whitespace
  - Crisp, clean lines
  - Subtle blue glow for focus states
  - Strategic use of aqua blue for emphasis and action items
  - Dark surfaces with clear boundaries
  - Minimal use of borders (only when necessary for clarity)

### Key Interface Components
1. **Dashboard**
   - Lead metrics and statistics
   - Recent activity feed
   - Calendar view with upcoming appointments
   - Quick action buttons for common tasks

2. **Lead Management Interface**
   - Kanban board for pipeline visualization
   - Detailed lead profile cards
   - Filterable table view with customizable columns
   - Activity timeline for each lead

3. **Communication Center**
   - Unified conversation view
   - Template library
   - Text blast composer with recipient selection
   - Message delivery status tracking

4. **Referral System**
   - Referral link generator with sharing options
   - Referral tracking dashboard
   - Form builder/editor for referral submission
   - Calendar integration for appointment viewing
   - Referral network visualization with the following components:
     - **Member Profile Integration**:
       - Dedicated "Referral Network" tab within member profiles (`/members/:memberId`)
       - Optimized view showing direct referrals and 2-3 levels beyond
       - "View Full Network" button linking to the comprehensive network view
     - **Network Visualization**:
       - Interactive graph display with distinct node types (referrals vs. members)
       - Color-coded nodes (green for referrals, blue for members)
       - Directional arrows showing referral relationships
       - Multiple connection lines for referrals with multiple referrers
     - **Interaction Components**:
       - Click handling for different node types (member vs. referral)
       - Side panel showing detailed referrer information
       - Action buttons for referral nodes (Create Lead, Convert to Member)
       - Search and filter controls for large networks
       - Zoom and pan controls for navigation

## 7. API Integration Requirements

### Authentication: Supabase Auth
- **Purpose**: User authentication and authorization
- **Implementation**: 
  - Direct integration with Supabase Auth services
  - JWT token management for secure API access
  - Role-based permissions (Admin vs. Salesperson)
- **Technical Considerations**:
  - Secure token storage in client
  - Session management and timeout settings
  - Password reset and recovery flows

### SMS Gateway: Telnyx
- **Purpose**: SMS messaging and text blast functionality
- **Implementation**:
  - Telnyx Node.js SDK integration
  - Message status tracking
  - Rate limiting for bulk sends
- **Technical Considerations**:
  - Compliance with messaging regulations
  - Phone number validation
  - Error handling for failed messages
  - Queue system for bulk operations

### Email: Google Workspace/Gmail API
- **Purpose**: Email integration for lead communication
- **Implementation**: 
  - Google API OAuth integration
  - Email composition and sending
  - Attachment handling
- **Technical Considerations**:
  - OAuth token management
  - Email formatting (HTML vs. plain text)
  - Tracking email status

### Calendar: Google Calendar API
- **Purpose**: Appointment scheduling for referrals
- **Implementation**: 
  - Calendar availability checking
  - Event creation and management
  - Notifications and reminders
- **Technical Considerations**:
  - Time zone handling
  - Conflict prevention
  - Update/cancellation flows
  - Synchronization with external calendars

### Link Sharing: Firebase Dynamic Links
- **Purpose**: Generation of trackable referral links
- **Implementation**: 
  - Custom link creation with tracking parameters
  - Click and conversion analytics
  - Deep linking to referral form
- **Technical Considerations**:
  - Link attribution
  - Mobile vs. desktop handling
  - UTM parameter strategy

### Database: Supabase SQL
- **Purpose**: Data storage and real-time synchronization
- **Implementation**:
  - Structured data models
  - Real-time subscriptions for live updates
  - Row-level security policies
- **Technical Considerations**:
  - Query optimization
  - Indexing strategy
  - Backup and recovery processes

### Visualization Library: D3.js or Cytoscape.js
- **Purpose**: Referral network visualization
- **Implementation**:
  - Interactive graph visualization
  - Custom node and edge styling
  - Layout algorithms for optimal network display
- **Technical Considerations**:
  - Performance optimization for large networks
  - Responsive design considerations
  - Integration with React component lifecycle

## 8. Development Timeline

### Phase 1: MVP Development (10-12 weeks)
1. **Week 1-2: Project Setup & Architecture**
   - Repository setup with defined structure
   - Component library selection and UI theme creation
   - Supabase database configuration
   - Authentication system implementation

2. **Week 3-5: Lead Management System**
   - Database models creation
   - CRUD operations for leads
   - Pipeline view implementation
   - Basic filtering and sorting

3. **Week 6-8: Referral System**
   - Firebase Dynamic Links integration
   - Referral submission form
   - Google Calendar integration
   - Appointment booking flow
   - Basic referral tracking structure

4. **Week 9-10: Communication Tools**
   - Telnyx integration for SMS
   - Basic text blast functionality
   - Google Workspace API integration for email
   - Message tracking implementation

5. **Week 11-12: Testing & Deployment**
   - User acceptance testing
   - Bug fixes and performance optimization
   - Deployment to Vercel
   - Documentation and training materials

### Phase 2: Advanced Features (12-14 weeks post-MVP)
1. **Week 1-3: Enhanced Text Blast**
   - Advanced filtering and segmentation
   - Personalization features
   - Scheduling capabilities
   - Delivery analytics

2. **Week 4-6: Data Model Transformation**
   - Implementation of unified Person model
   - Data migration from legacy models
   - API updates to support new data structure
   - Dual-write system implementation for transition period

3. **Week 7-9: Advanced Analytics**
   - Reporting dashboard
   - Performance metrics
   - Data visualization components
   - Export functionality
   - New reports leveraging unified data model

4. **Week 10-12: Referral Network Visualization**
   - Network visualization component development
   - Profile page integration
   - Member/referral status handling
   - Multiple referrer support implementation
   - Interactive features and optimizations

5. **Week 13-14: Refinement & Optimization**
   - UX improvements based on user feedback
   - Performance optimizations 
   - Additional feature requests
   - Final testing and deployment

## 9. Security Considerations

### Standard Security Measures
- **Data Encryption**: 
  - HTTPS for all client-server communication
  - Encryption at rest for sensitive data in Supabase
- **Authentication Security**:
  - Secure password policies
  - Protection against brute force attacks
  - Session timeout settings
- **API Security**:
  - JWT validation for all API requests
  - CORS configuration
  - Rate limiting to prevent abuse
- **Input Validation**:
  - Form validation on both client and server
  - Sanitization to prevent SQL injection
  - XSS protection
- **Compliance Measures**:
  - Privacy policy implementation
  - TCPA compliance for SMS messaging
  - GDPR-friendly data practices

## 10. Technical Challenges and Solutions

### Challenge: Handling Multiple External APIs
- **Solution**: Implement a unified API service layer
- **Technical Approach**: Create wrapper services for each external API with consistent error handling

### Challenge: Real-time Updates for Lead Status
- **Solution**: Leverage Supabase real-time subscriptions
- **Technical Approach**: Subscribe to relevant tables and implement optimistic UI updates

### Challenge: Bulk SMS Processing Performance
- **Solution**: Implement queue-based processing with batching
- **Technical Approach**: Process messages in batches with status tracking per message

### Challenge: Mobile Responsiveness for Referral Form
- **Solution**: Mobile-first design approach
- **Technical Approach**: Use responsive design patterns and extensive mobile testing

### Challenge: Referral Network Visualization Performance
- **Solution**: Implement progressive loading and visualization optimization
- **Technical Approach**: 
  - Load network data in chunks based on visibility and interaction
  - Implement level-of-detail rendering (show fewer details at zoomed-out levels)
  - Use WebGL-based rendering for large networks when available
  - Implement virtual rendering for nodes outside the viewport

### Challenge: Managing Multiple Referrer Relationships
- **Solution**: Enhanced data model with optimized queries
- **Technical Approach**: 
  - Structure the relationship model for efficient querying
  - Implement caching for frequently accessed network segments
  - Use specialized indexing strategies for relationship queries

### Challenge: Transitioning to Unified Person Model
- **Solution**: Phased migration with backwards compatibility
- **Technical Approach**: 
  - Create migration scripts to populate new unified model from existing data
  - Implement dual-write period during transition
  - Create compatibility layer in API to support both models during transition
  - Use feature flags to gradually roll out new model-dependent features

### Challenge: Complex Data Relationships and Queries
- **Solution**: Implement efficient query patterns and indexing strategy
- **Technical Approach**: 
  - Create specialized indexes for common query patterns
  - Implement materialized views for complex aggregate queries
  - Use query optimization and caching for relationship graph traversal
  - Develop a robust API that abstracts complex queries into simple endpoints

## 11. Reporting and Analytics Requirements

### Key Metrics to Track:
1. **Lead Performance**
   - Conversion rates by lead source
   - Average time in each pipeline stage
   - Lead aging analysis
   - Conversion rate by salesperson

2. **Referral Program Effectiveness**
   - Referral link click-through rates
   - Form completion rates
   - Appointment booking rates
   - Conversion rates for referrals vs. other sources
   - Referral network depth and breadth analysis
   - Multi-level referral conversion metrics
   - Most effective referrers (by volume and conversion rate)
   - Referral chain value analysis (value of entire referral trees)

3. **Communication Effectiveness**
   - Message open/response rates
   - Best performing message templates
   - Optimal times for communication
   - Text blast campaign performance

4. **Salesperson Performance**
   - Number of leads managed
   - Conversion rates
   - Response times
   - Referral generation
   - Referral network size and quality

### Visualization Requirements:
- Interactive dashboards with filtering capabilities
- Time-series graphs for trend analysis
- Comparison charts for performance benchmarking
- Export functionality for reports (CSV, PDF)
- Network visualization for referral relationship analysis
- Heat maps showing referral conversion hotspots

## 12. Post-Launch Support and Maintenance

### Ongoing Maintenance
- Weekly dependency updates and security patches
- Monthly performance reviews
- Quarterly feature enhancements based on user feedback

### Monitoring Strategy
- Error tracking and alerting via Sentry
- Performance monitoring via Vercel Analytics
- Database query performance analysis
- Network visualization performance tracking

### Support Process
- In-app feedback mechanism
- Issue tracking and prioritization system
- Regular maintenance windows for updates

---

*This PRD is a living document and will be updated as requirements evolve throughout the development process.*
