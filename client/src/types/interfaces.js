/**
 * JavaScript export of schema constraints from the TypeScript interfaces
 * This file allows JavaScript files to import the SchemaConstraints without TypeScript issues
 */

// Schema Constraints - Synced with interfaces.ts
export const SchemaConstraints = {
  LEAD_EXTENSION: {
    READINESS_SCORE_MIN: 1,
    READINESS_SCORE_MAX: 10,
    CONVERSION_PROBABILITY_MIN: 0,
    CONVERSION_PROBABILITY_MAX: 100
  },
  REFERRAL_EXTENSION: {
    CONVERSION_PROBABILITY_MIN: 0,
    CONVERSION_PROBABILITY_MAX: 100
  },
  MEMBER_EXTENSION: {
    BILLING_DAY_MIN: 1,
    BILLING_DAY_MAX: 31,
    SATISFACTION_SCORE_MIN: 1,
    SATISFACTION_SCORE_MAX: 10
  },
  RELATIONSHIP: {
    ATTRIBUTION_PERCENTAGE_MIN: 0,
    ATTRIBUTION_PERCENTAGE_MAX: 100,
    RELATIONSHIP_LEVEL_MIN: 1
  },
  DEFAULT_VALUES: {
    LEAD_STATUS: 'new',
    REFERRAL_STATUS: 'submitted',
    RELATIONSHIP_STATUS: 'active',
    RELATIONSHIP_LEVEL: 1,
    ATTRIBUTION_PERCENTAGE: 100,
    INTERACTION_STATUS: 'completed',
    MESSAGE_STATUS: 'sent',
    IS_BLAST: false,
    HAS_RESPONSE: false,
    RESPONSE_RECEIVED: false,
    VISIT_COMPLETED: false,
    PAYMENT_INFO_COLLECTED: false,
    CHECK_IN_COUNT: 0,
    ATTENDANCE_STREAK: 0,
    REFERRAL_COUNT: 0,
    SUCCESSFUL_REFERRALS: 0,
    REFERRAL_REWARDS_EARNED: 0,
    IS_PRIMARY_REFERRER: false,
    ROLE: 'salesperson'
  }
}; 