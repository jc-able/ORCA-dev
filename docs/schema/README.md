# ORCA Database Schema Reference Guide

This documentation was automatically generated from the database schema and provides a comprehensive reference for developers working with the ORCA lead management system.

## Tables

* [users](users.md) - System users (salespeople, administrators).
* [persons](persons.md) - Core table that stores all person records (leads, referrals, members).
* [lead_extensions](lead_extensions.md) - Extended information specific to leads, linked to persons table.
* [referral_extensions](referral_extensions.md) - Extended information specific to referrals, linked to persons table.
* [member_extensions](member_extensions.md) - Extended information specific to members, linked to persons table.
* [relationships](relationships.md) - Tracks relationships between persons (referrals, memberships, etc.).
* [interactions](interactions.md) - Records all interactions with persons (calls, meetings, etc.).
* [messages](messages.md) - Stores all messages sent to or received from persons.

## Entity Relationship Diagram

See the [Entity Relationship Diagram](erd.md) for a visual representation of the database schema.

## Constraints

See the [Constraints Documentation](constraints.md) for a detailed list of all constraints in the database.

## Important Implementation Notes

1. **Unified Person Model**: A single `persons` table serves as the foundation for all contact types (leads, referrals, members)
2. **Extension Pattern**: Specialized data is stored in extension tables that reference the base person record
3. **Relationship Tracking**: Explicit modeling of relationships between people for referral network analysis
4. **Activity Monitoring**: Comprehensive tracking of all interactions and communications
5. **Flexible Data Storage**: Use of JSONB and array types for evolving data needs
6. **Audit Trail**: Timestamp tracking for all major actions and status changes

## Key Constraints

* readiness_score must be between 1 and 10
* conversion_probability must be between 0 and 100
* relationship_level must be at least 1
* billing_day must be between 1 and 31
* satisfaction_score must be between 1 and 10
* attribution_percentage must be between 0 and 100

## API Integration Guide

See the [API Integration Guide](api_integration.md) for detailed information on how to interact with the ORCA database through our API endpoints.

## Developer Guidelines

See the [Developer Guidelines](developer_guidelines.md) for best practices when working with the ORCA schema. 