/**
 * @fileoverview Annual Donation Cap Compliance Checker Module
 *
 * This module validates that a donation attempt does not exceed the annual
 * cap for guest compliance tier. Compliant tier has no annual cap.
 * Annual caps are tier-specific and reset each calendar year at midnight EST.
 *
 * ANNUAL CAP LIMITS
 *
 * GUEST TIER
 * - Annual cap: $200
 * - Resets: January 1st at midnight EST
 *
 * COMPLIANT TIER
 * - Annual cap: None (unlimited)
 * - Uses per-election limits instead
 *
 * BUSINESS LOGIC
 *
 * CALENDAR YEAR CALCULATION
 * - Uses current calendar year (January 1 - December 31)
 * - Filters donations by createdAt date within current year
 * - Excludes resolved, defunct, and paused donations
 *
 * DONATION FILTERING
 * - Only counts active donations (resolved: false, defunct: false, paused: false)
 * - Uses donation.createdAt for date comparison
 * - Sums all donation amounts from current year
 *
 * COMPLIANCE CHECK
 * - Calculates: currentAnnualTotal + attemptedAmount <= annualCap
 * - Returns true if within limit, false if would exceed
 * - Compliant tier always returns true (no annual cap)
 *
 * RELATIONSHIPS
 * - Used by: reckon (legacy validation), validateDonationCompliance
 * - Part of: FEC compliance validation chain
 *
 * DEPENDENCIES
 * - constants/FEC: FEC compliance tier definitions and annual cap values
 *
 * @module controller/users/account/utils/reckon/checkAnnualCap
 * @requires ../../../../../constants
 */

const { FEC } = require('../../../../../constants');

module.exports = {
  /**
   * Checks if a donation attempt complies with annual cap limits
   *
   * This function calculates the current year's donation total and verifies
   * that adding the attempted amount would not exceed the tier's annual cap.
   * Compliant tier has no annual cap (returns true). Only counts active donations
   * from the current calendar year.
   *
   * @param {Array<Object>} donations - Array of user donation documents
   * @param {string} compliance - User's compliance tier ('guest' or 'compliant')
   * @param {number} attemptedAmount - The donation amount being attempted
   * @returns {boolean} - True if donation complies with annual cap, false otherwise
   *
   * @example
   * ```javascript
   * const { checkAnnualCap } = require('./controller/users/account/utils/reckon/checkAnnualCap');
   * const isCompliant = checkAnnualCap(donations, 'guest', 100);
   * // Returns: true if $100 donation would not exceed guest annual cap
   * ```
   */
  checkAnnualCap: (donations, compliance, attemptedAmount) => {
    const getAnnualCap = (tier) => {
      const tierInfo = FEC.COMPLIANCE_TIERS[tier];
      return tierInfo ? tierInfo.annualCap : 0;
    };

    const annualCap = getAnnualCap(compliance);
    if (annualCap === 0) return true; // No annual cap for compliant tier

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const donationsThisYear = donations.filter((d) => {
      if (d.resolved || d.defunct || d.paused) return false;
      const donationDate = new Date(d.createdAt);
      return donationDate >= startOfYear && donationDate <= endOfYear;
    });

    const currentAnnualTotal = donationsThisYear
      .map((d) => d.donation)
      .reduce((a, b) => a + b, 0);

    return currentAnnualTotal + attemptedAmount <= annualCap;
  },
};

