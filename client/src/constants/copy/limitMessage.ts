/**
 * Copy registry for LimitMessage component
 * Centralized source of truth for donation limit messaging and user guidance
 */

interface LimitMessageCopy {
  HEADER: {
    TITLE: string;
  };
  MESSAGES: {
    COMPLIANT_TIER: (amount: string) => string;
    LOWER_TIER: (amount: string) => string;
  };
  PROMOTION: {
    GUEST_TO_COMPLIANT: (amount: string) => string;
  };
  RESET_INFO: {
    ELECTION_CYCLE: {
      TITLE: (stateName: string) => string;
      DETAILS: string;
      RESET_INFO: string;
    };
    ANNUAL: {
      TITLE: string;
      DETAILS: string;
      RESET_INFO: (date: string) => string;
    };
  };
  RESET_MESSAGES: {
    ELECTION_CYCLE: string;
    ANNUAL: (date: string) => string;
  };
  BUTTONS: {
    COMPLIANT_TIER: string;
    LOWER_TIER: string;
  };
  ELECTION_DATES: {
    PRIMARY: string;
    GENERAL: string;
  };
  FALLBACK: {
    UNKNOWN_STATE: string;
    TBD: string;
  };
  RESET_INFO_INTERNAL: {
    ANNUAL_TYPE: string;
    ELECTION_CYCLE_TYPE: string;
    ELECTION_CYCLE_DESCRIPTION: string;
    ANNUAL_DESCRIPTION: string;
  };
}

export const LIMIT_MESSAGE_COPY: LimitMessageCopy = {
  HEADER: {
    TITLE: 'Donation Limit Reached',
  },
  MESSAGES: {
    COMPLIANT_TIER: (amount: string) =>
      `You have reached your ${amount} limit for this candidate in this election.`,
    LOWER_TIER: (amount: string) =>
      `You have reached your ${amount} annual donation limit.`,
  },
  PROMOTION: {
    GUEST_TO_COMPLIANT: (amount: string) =>
      `Complete your profile information to increase your limit to ${amount} per candidate per election.`,
  },
  RESET_INFO: {
    ELECTION_CYCLE: {
      TITLE: (stateName: string) =>
        `State Election Cycle Schedule for ${stateName}`,
      DETAILS:
        'Your donation limit applies per candidate per election cycle. This includes primary elections, general elections, and any runoff elections.',
      RESET_INFO: 'Limit resets for each new election cycle',
    },
    ANNUAL: {
      TITLE: 'Annual Limit Information',
      DETAILS:
        'Your donation limit applies across all candidates and elections within a calendar year.',
      RESET_INFO: (date: string) => `Limit resets on ${date} at midnight EST.`,
    },
  },
  RESET_MESSAGES: {
    ELECTION_CYCLE:
      'Your limit resets at the start of the next election cycle.',
    ANNUAL: (date: string) => `Your limit resets on ${date} at midnight ET.`,
  },
  BUTTONS: {
    COMPLIANT_TIER: 'View My Celebrations',
    LOWER_TIER: 'Increase My Limit',
  },
  ELECTION_DATES: {
    PRIMARY: 'Primary Election:',
    GENERAL: 'General Election:',
  },
  FALLBACK: {
    UNKNOWN_STATE: 'Unknown State',
    TBD: 'TBD',
  },
  RESET_INFO_INTERNAL: {
    ANNUAL_TYPE: 'annual',
    ELECTION_CYCLE_TYPE: 'election cycle',
    ELECTION_CYCLE_DESCRIPTION: 'per candidate per election',
    ANNUAL_DESCRIPTION: 'total annual cap across all candidates',
  },
};
