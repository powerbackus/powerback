/**
 * FEC citations and tier info. getGlobalCitations, shouldShowCitation.
 * @module utils/fecInfo
 */
import type { ComplianceTier, ServerConstants } from '@Contexts';

/** Context passed when evaluating citation visibility (e.g. limit modal, PAC vs donation). */
export interface FECCitationContext {
  userCompliance?: ComplianceTier;
  isPACLimit?: boolean;
  context?: string;
}

/**
 * FEC citation information for compliance references
 */
export interface FECCitation {
  /** When this citation should be displayed */
  conditions?: {
    /** Only show for specific compliance tiers */
    tiers?: ComplianceTier[];
    /** Only show for specific contexts (e.g., "limit_modal", "profile_update") */
    contexts?: string[];
    /** Only show when certain conditions are met */
    when?: (context: FECCitationContext) => boolean;
  };
  /** Human-readable description of what this citation covers */
  description: string;
  /** Citation marker (e.g., "1", "2", "3") */
  marker: string;
  /** The actual FEC URL */
  uri: string;
}

/**
 * FEC compliance tier information
 * Enhanced interface with calculated values and proper typing
 */
export interface FECTierInfo {
  /** The compliance tier level */
  tier: ComplianceTier;
  /** Maximum amount per donation */
  perDonationLimit: number;
  /** Total annual cap across all candidates (for guest tier) */
  annualCap?: number;
  /** Maximum amount per candidate per election (for compliant tier) */
  perElectionLimit?: number;
  /** Human-readable description of the tier's limits */
  scope: string;
  /** Description of compliance requirements for this tier */
  description: string;
  /** FEC citations for this tier */
  citations: FECCitation[];
  /** Formatted display text for UI */
  displayText: string;
  /** Type of reset: 'annual' or 'election_cycle' */
  resetType: 'annual' | 'election_cycle';
  /** Reset time specification */
  resetTime: string;
}

/**
 * Generate appropriate display text based on compliance tier
 * Creates user-friendly descriptions of donation limits for each tier
 *
 * @param tier - The compliance tier level
 * @param tierInfo - Tier information with limit values
 * @returns Formatted display text for UI
 */
const getDisplayText = (
  tier: ComplianceTier,
  tierInfo: Pick<
    FECTierInfo,
    'perDonationLimit' | 'annualCap' | 'perElectionLimit'
  >
): string => {
  switch (tier) {
    case 'guest':
      return `$${tierInfo.perDonationLimit} per donation, $${tierInfo.annualCap} total donations per calendar year`;
    case 'compliant':
      return `$${tierInfo.perElectionLimit} per candidate per election`;
    default:
      return 'Unknown compliance level';
  }
};

/**
 * Get comprehensive FEC information for a specific tier
 * Uses the proper FEC.COMPLIANCE_TIERS structure for accurate validation
 *
 * @param tier - The compliance tier level to get information for
 * @param serverConstants - Optional server constants (if provided, uses server values)
 * @returns Complete FEC tier information with calculated values
 */
export const getFECTierInfo = (
  tier: ComplianceTier,
  serverConstants?: ServerConstants
): FECTierInfo => {
  // Import FEC constants dynamically to avoid circular dependencies
  const { FEC } = require('@CONSTANTS');

  // Use server constants if provided, otherwise use frontend constants
  const tierInfo =
    serverConstants?.FEC?.COMPLIANCE_TIERS?.[tier] ||
    FEC.COMPLIANCE_TIERS[tier];

  if (!tierInfo) {
    // Fallback for unknown tiers
    return {
      tier,
      citations: [],
      annualCap: 200,
      perDonationLimit: 50,
      scope: 'per donation',
      description: 'Unknown tier',
      resetTime: 'midnight_est',
      resetType: 'annual',
      displayText: '$50 per donation, $200 total donations per calendar year',
    };
  }

  // Handle both function-based (frontend) and value-based (backend) structures
  const getValue = (key: string): number => {
    const value = tierInfo[key];
    if (typeof value === 'function') {
      return value();
    }
    return value || 0;
  };

  const perDonationLimit = getValue('perDonationLimit');
  const annualCap = getValue('annualCap');
  const perElectionLimit = getValue('perElectionLimit');
  const scope =
    tier === 'compliant' ? 'per candidate per election' : 'per donation';

  // Build citations based on tier
  const citations: FECCitation[] = [];

  if (tier === 'guest') {
    citations.push({
      marker: '1',
      description: 'Individual contributions',
      uri: FEC.URI[1], // Filing reports for individual contributions
      conditions: { contexts: ['limit_modal'] },
    });
  } else if (tier === 'compliant') {
    citations.push({
      marker: '1',
      description: 'Contribution limits',
      uri: FEC.URI[2], // Candidate contribution limits
      conditions: { contexts: ['limit_modal'] },
    });
  }

  return {
    tier,
    scope,
    annualCap,
    perDonationLimit,
    perElectionLimit,
    description: `${tier} tier user`,
    citations,
    displayText: getDisplayText(tier, {
      annualCap,
      perDonationLimit,
      perElectionLimit,
    }),
    resetType: tierInfo.resetType || 'annual',
    resetTime: tierInfo.resetTime || 'midnight_est',
  };
};

/**
 * Get global FEC citations that apply across all tiers
 * These are context-specific citations not tied to individual compliance levels
 *
 * @param context - Context object containing user state and other relevant info
 * @param context.isPACLimit - Whether this is for PAC limits (tips) vs donation limits
 * @returns Array of global citations that should be displayed
 */
export const getGlobalCitations = (
  context: FECCitationContext
): FECCitation[] => {
  const { FEC } = require('@CONSTANTS');

  const citations: FECCitation[] = [];

  // PAC limit citations (for tips)
  if (context.context === 'limit_modal' && context.isPACLimit) {
    citations.push({
      marker: '1',
      description: 'PAC contribution limits',
      uri: FEC.URI[1], // Individual contributions (applies to PAC contributions)
      conditions: {
        contexts: ['limit_modal'],
        when: (ctx: FECCitationContext) => ctx.isPACLimit === true,
      },
    });
    citations.push({
      marker: '2',
      description: 'Contribution limits for 2025-2026',
      uri: FEC.URI[3], // Contribution limits for 2025-2026
      conditions: {
        contexts: ['limit_modal'],
        when: (ctx: FECCitationContext) => ctx.isPACLimit === true,
      },
    });
  }

  // Citation for contribution limits (shows for non-compliant users in limit modal, non-PAC)
  if (
    context.context === 'limit_modal' &&
    context.userCompliance !== 'compliant' &&
    !context.isPACLimit
  ) {
    citations.push({
      marker: '2',
      description: 'Contribution limits',
      uri: FEC.URI[0], // Recording receipts and identifying contributors
      conditions: {
        contexts: ['limit_modal'],
        when: (ctx: FECCitationContext) =>
          ctx.userCompliance !== 'compliant' && !ctx.isPACLimit,
      },
    });
  }

  return citations;
};

/**
 * Determine if a citation should be displayed based on its conditions
 *
 * @param citation - The citation to check
 * @param context - Current context object
 * @returns Whether the citation should be shown
 */
export const shouldShowCitation = (
  citation: FECCitation,
  context: FECCitationContext
): boolean => {
  // Check tier conditions
  if (
    citation.conditions?.tiers &&
    (context.userCompliance === undefined ||
      !citation.conditions.tiers.includes(context.userCompliance))
  ) {
    return false;
  }

  // Check context conditions
  if (
    citation.conditions?.contexts &&
    (context.context === undefined ||
      !citation.conditions.contexts.includes(context.context))
  ) {
    return false;
  }

  // Check custom conditions
  if (citation.conditions?.when && !citation.conditions.when(context)) {
    return false;
  }

  return true;
};
