/**
 * FEC contribution limits (typically change once a year, or when there is a new Congress)
 * @property {number} PAC - Maximum annual PAC contributions ($X,XXX)
 * @property {number} GUEST.ANNUAL - Maximum annual contributions ($XXX)
 * @property {number} GUEST.PER_DONATION - Maximum per donation ($XX)
 * @property {number} COMPLIANT.PER_CAMPAIGN - Maximum per candidate per election ($X,XXX)
 */
const LIMITS = {
  PAC: process.env.FEC_PAC_ANNUAL || 5000,
  GUEST: {
    ANNUAL: process.env.FEC_ANNUAL || 200,
    PER_DONATION: process.env.FEC_PER_DONATION || 50,
  },
  COMPLIANT: {
    PER_CAMPAIGN: process.env.FEC_PER_CAMPAIGN || 3500,
  },
};

module.exports = {
  FEC: {
    COMMITTEE_ID: process.env.COMMITTEE_ID || 'C00909036',
    /**
     * PAC (Political Action Committee) contribution limits
     * These limits apply to tips and platform fees retained by POWERBACK
     * @property {number} PAC_ANNUAL_LIMIT - Maximum annual PAC contributions ($X,XXX)
     */
    PAC_ANNUAL_LIMIT: LIMITS.PAC,

    /**
     * Compliance tier names
     * @property {string[]} COMPLIANCE_TIER_NAMES - Names of compliance tiers
     */
    COMPLIANCE_TIER_NAMES: ['guest', 'compliant'],

    /**
     * Structured compliance tier definitions with detailed information for each tier
     * @property {Object} this.COMPLIANCE_TIER_NAMES[0] - Guest tier compliance requirements and limits
     * @property {Object} this.COMPLIANCE_TIER_NAMES[1] - Compliant tier compliance requirements and limits
     */
    get COMPLIANCE_TIERS() {
      return {
        /**
         * Guest tier: Basic account with minimal compliance requirements
         * @property {number} perDonationLimit - Maximum amount per single donation ($XX)
         * @property {number} annualCap - Total annual cap across all candidates ($XXX)
         * @property {string} scope - Human-readable description of limits
         * @property {string} description - Description of compliance requirements
         * @property {number} fecUriIndex - Index of relevant FEC URI for this tier
         * @property {string} resetType - Type of reset: 'annual' for calendar year reset
         * @property {string} resetTime - Reset time: 'midnight_est' for Dec 31st/Jan 1st
         */
        [`${this.COMPLIANCE_TIER_NAMES[0]}`]: {
          perDonationLimit: LIMITS.GUEST.PER_DONATION,
          annualCap: LIMITS.GUEST.ANNUAL,
          scope: `per donation, $${LIMITS.GUEST.ANNUAL} total annual cap across all candidates`,
          description: 'Anonymous users with basic account',
          fecUriIndex: 0, // Identifying contributors
          resetType: 'annual',
          resetTime: 'midnight_est',
        },
        /**
         * Compliant tier: Full compliance with name, address, occupation and employer information
         * @property {number} perDonationLimit - Maximum amount per single donation ($3,500)
         * @property {number} perElectionLimit - Maximum amount per candidate per election ($3,500)
         * @property {string} scope - Human-readable description of limits
         * @property {string} description - Description of compliance requirements
         * @property {number} fecUriIndex - Index of relevant FEC URI for this tier
         * @property {string} resetType - Type of reset: 'election_cycle' for state-specific elections
         * @property {string} resetTime - Reset time: 'election_date' for primary/general election dates
         */
        [`${this.COMPLIANCE_TIER_NAMES[1]}`]: {
          perDonationLimit: LIMITS.COMPLIANT.PER_CAMPAIGN, // $X,XXX per single donation
          perElectionLimit: LIMITS.COMPLIANT.PER_CAMPAIGN, // $X,XXX per candidate per election
          scope:
            'per donation, per candidate per election (primary/general separate)',
          description: 'Users with name, address, occupation, employer',
          fecUriIndex: 2, // Contribution limits
          resetType: 'election_cycle',
          resetTime: 'election_date',
        },
      };
    },
    /**
     * Array of FEC reference URLs for different compliance scenarios
     * @property {string} 0 - URL for identifying contributors (Guest tier)
     * @property {string} 1 - URL for individual contributions (legacy, kept for URI index compatibility)
     * @property {string} 2 - URL for contribution limits (Compliant tier)
     * @property {string} 3 - URL for 2025-2026 contribution limits
     */
    URI: [
      'https://www.fec.gov/help-candidates-and-committees/keeping-records/recording-receipts/#identifying-contributors',
      'https://www.fec.gov/help-candidates-and-committees/filing-reports/individual-contributions/',
      // used also in frontend for citation
      process.env.FEC_INDIVIDUAL_CONTRIBUTIONS_URL ||
        'https://www.fec.gov/help-candidates-and-committees/filing-reports/individual-contributions/',

      'https://www.fec.gov/help-candidates-and-committees/candidate-taking-receipts/contribution-limits/',
      'https://www.fec.gov/updates/contribution-limits-for-2025-2026/',
    ],

    /**
     * Election cycle configuration for Compliant tier compliance
     * @property {string} API_BASE - Base URL for OpenFEC API
     * @property {string} ELECTION_ENDPOINT - Endpoint for election dates
     * @property {Object} ELECTION_TYPES - Types of elections to track
     */
    ELECTION_CYCLE: {
      API_BASE: process.env.FEC_API_BASE_URL || 'https://api.open.fec.gov/v1',
      ELECTION_ENDPOINT: '/election-dates/',
      ELECTION_TYPES: {
        PRIMARY: 'P',
        GENERAL: 'G',
        SPECIAL: 'S',
        RUNOFF: 'R',
        /** General runoff (e.g. LA); maps to runoff slot, preferred over R when both exist */
        GENERAL_RUNOFF: 'GR',
        /** Special general (final round of special); maps to special slot, preferred over S when both exist */
        SPECIAL_GENERAL: 'SG',
      },
    },
  },
};
