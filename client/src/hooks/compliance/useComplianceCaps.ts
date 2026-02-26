/**
 * @fileoverview FEC Compliance Caps and PAC Limit Hooks
 *
 * This module provides hooks for calculating FEC compliance tier limits and
 * PAC (Political Action Committee) tip limits. It handles both current tier
 * limits and potential tier limits based on form completion status.
 *
 * KEY HOOKS
 *
 * useComplianceCaps(serverConstants, formCompliance, userCompliance, contactInfo)
 * - Calculates compliance cap configurations for display
 * - Shows current tier limits vs. potential tier limits
 * - Handles promotion scenarios (guest → compliant)
 * - Returns array of ComplianceCap objects with labels and values
 *
 * usePACLimitData(donations)
 * - Calculates PAC tip limit information
 * - Tracks current year PAC contributions
 * - Determines if PAC limit is exceeded
 * - Returns remaining PAC limit amount
 *
 * BUSINESS LOGIC
 *
 * COMPLIANCE CAPS
 * - Guest: Shows per-donation limit and annual cap
 * - Compliant: Shows per-candidate per-election limit only
 * - Hides caps entirely if user can promote to Compliant (CTA text sufficient)
 * - Compares current tier vs. potential tier for promotion arrows
 *
 * PAC LIMITS
 * - Annual limit: $5,000 per calendar year
 * - Only counts tips (not base donations)
 * - Only counts resolved, non-defunct, non-paused celebrations
 * - Filters by current calendar year (Jan 1 - Dec 31)
 *
 * PROMOTION LOGIC
 * - canPromote: Form compliance higher than user compliance
 * - hasPromotionPotential: Employment status change can trigger promotion
 *
 * DEPENDENCIES
 * - @Contexts: ComplianceTier type
 * - @Types: Celebration type
 * - @Utils: getFECTierInfo utility
 * - @CONSTANTS: FEC compliance tier definitions
 *
 * @module hooks/compliance/useComplianceCaps
 * @requires react
 * @requires @Contexts
 * @requires @Interfaces
 * @requires @Types
 * @requires @Utils
 * @requires @CONSTANTS
 */

import { useMemo } from 'react';
import type { ComplianceTier, ServerConstants } from '@Contexts';
import type { ContactInfo } from '@Interfaces';
import type { Celebration } from '@Types';
import { getFECTierInfo } from '@Utils';
import { FEC } from '@CONSTANTS';

/**
 * Interface for a compliance cap configuration
 */
export interface ComplianceCap {
  resetType: 'annual' | 'election_cycle';
  isPromotable: boolean;
  currentValue: number;
  nextValue: number;
  label: string;
}

/**
 * Calculate PAC limit information for tips
 * PAC contributions are limited to $5,000 annually
 */
export const usePACLimitData = (donations: Celebration[]) => {
  return useMemo(() => {
    if (!donations) {
      return {
        pacLimit: FEC.PAC_ANNUAL_LIMIT, // $5,000 annual PAC limit
        currentPACTotal: 0,
        pacLimitExceeded: false,
        remainingPACLimit: FEC.PAC_ANNUAL_LIMIT,
      };
    }

    const currentYear = new Date().getFullYear(),
      startOfYear = new Date(currentYear, 0, 1),
      endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Calculate current year PAC contributions (tips only)
    const tipsThisYear = donations.filter((d: Celebration) => {
      if (d.resolved || d.defunct || d.paused) return false;
      const donationDate = new Date(d.createdAt || new Date());
      const isInRange =
        donationDate >= startOfYear && donationDate <= endOfYear;

      return isInRange;
    });

    const currentPACTotal = tipsThisYear
      .map((d) => d.tip || 0) // Only count tips, not donations
      .reduce((a, b) => a + b, 0);

    const pacLimit = FEC.PAC_ANNUAL_LIMIT, // $5,000 annual PAC limit
      remainingPACLimit = Math.max(0, pacLimit - currentPACTotal),
      pacLimitExceeded = currentPACTotal >= pacLimit;

    return {
      pacLimit,
      currentPACTotal,
      pacLimitExceeded,
      remainingPACLimit,
    };
  }, [donations]);
};

/**
 * Hook to calculate compliance caps based on user's current and potential compliance tiers
 *
 * @param serverConstants - Server constants for compliance limits (if provided, uses server values)
 * @param formCompliance - Form's calculated compliance tier
 * @param userCompliance - User's current compliance tier
 * @param contactInfo - User's contact information (if provided, uses server values)
 * @returns Array of compliance cap configurations
 */
export const useComplianceCaps = (
  serverConstants: ServerConstants,
  formCompliance: ComplianceTier,
  userCompliance: ComplianceTier,
  contactInfo?: ContactInfo
): ComplianceCap[] => {
  const TIERS = useMemo(() => Object.keys(FEC.COMPLIANCE_TIERS), []);

  return useMemo(() => {
    // Always use userCompliance for current values and labels
    // Only update after successful promotion, not when form fields change
    const isCompliantUser = userCompliance === 'compliant';

    // Determine if user can promote (only if form compliance is higher than user compliance)
    const canPromote =
      TIERS.indexOf(formCompliance) > TIERS.indexOf(userCompliance);

    // Check if user has potential to promote (employment status change scenario)
    const hasPromotionPotential = (() => {
      if (!contactInfo) return false;

      // If user is at Guest tier and has employment info, they can promote to Compliant
      if (
        userCompliance === FEC.COMPLIANCE_TIERS.NAMES[0] &&
        contactInfo.isEmployed &&
        contactInfo.occupation &&
        contactInfo.employer
      ) {
        return true;
      }

      return false;
    })();

    // Get next tier info - consider both current promotion and potential promotion
    const nextTier = (() => {
      if (canPromote) {
        // Direct promotion based on form compliance
        return formCompliance;
      } else if (hasPromotionPotential) {
        // Employment status change promotion - only if they have the required fields
        if (
          userCompliance === FEC.COMPLIANCE_TIERS.NAMES[0] &&
          contactInfo?.isEmployed &&
          contactInfo?.occupation &&
          contactInfo?.employer
        ) {
          return 'compliant'; // Guest → Compliant when employment info is complete
        }
      }
      return userCompliance; // Use user's current tier if no promotion possible
    })();
    const nextTierInfo = getFECTierInfo(nextTier, serverConstants);

    // Get current tier info based on userCompliance only (not formCompliance)
    const currentTierInfo = getFECTierInfo(userCompliance, serverConstants);

    const caps: ComplianceCap[] = [];

    // If user can promote to Compliant, hide the compliance caps entirely
    // The CTA text is sufficient explanation for the massive limit increase
    if (
      nextTier === FEC.COMPLIANCE_TIERS.NAMES[1] &&
      (canPromote || hasPromotionPotential)
    ) {
      return caps; // Return empty array - no caps displayed
    }

    if (isCompliantUser) {
      // Compliant tier: Show single per candidate per election cap
      // For Compliant tier, show only the Compliant tier value (no current/potential comparison)
      caps.push({
        resetType: FEC.COMPLIANCE_TIERS.compliant.resetType as 'election_cycle',
        label: 'Per Candidate, Per Election',
        nextValue: nextTierInfo.perElectionLimit || 0,
        currentValue: nextTierInfo.perElectionLimit || 0, // Same as nextValue to avoid arrow
        isPromotable: false, // No promotion arrow for Compliant tier
      });
    } else {
      // Guest tier: Show per donation limit and annual cap
      caps.push({
        resetType: FEC.COMPLIANCE_TIERS.guest.resetType as 'annual',
        label: 'Single Donation Limit',
        nextValue: nextTierInfo.perDonationLimit || 0,
        currentValue: currentTierInfo.perDonationLimit || 0,
        isPromotable:
          (canPromote || hasPromotionPotential) &&
          (nextTierInfo.perDonationLimit || 0) >
            (currentTierInfo.perDonationLimit || 0),
      });

      caps.push({
        label: 'Annual Cap',
        resetType: 'annual',
        nextValue: nextTierInfo.annualCap || 0,
        currentValue: currentTierInfo.annualCap || 0,
        isPromotable:
          (canPromote || hasPromotionPotential) &&
          (nextTierInfo.annualCap || 0) > (currentTierInfo.annualCap || 0),
      });
    }

    return caps;
  }, [TIERS, contactInfo, formCompliance, userCompliance, serverConstants]);
};
