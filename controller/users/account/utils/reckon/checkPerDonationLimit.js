/**
 * @fileoverview Per-Donation Limit Compliance Checker Module
 *
 * This module validates that individual donation amounts do not exceed the
 * per-donation limit for a user's compliance tier. Per-donation limits apply
 * to all compliance tiers and are enforced on every donation attempt,
 * regardless of annual or per-election limits.
 *
 * PER-DONATION LIMITS
 *
 * GUEST TIER
 * - Per-donation limit: $50
 * - Prevents donations exceeding $50 in a single transaction
 *
 * COMPLIANT TIER
 * - Per-donation limit: $3,500
 * - Prevents donations exceeding $3,500 in a single transaction
 *
 * BUSINESS LOGIC
 *
 * VALIDATION
 * - Checks: attemptedAmount <= tierInfo.perDonationLimit
 * - Applied to all donation attempts regardless of tier
 * - First check in validation chain (before annual/per-election limits)
 * - Returns false if tier not found in FEC constants
 *
 * TIER LOOKUP
 * - Looks up tier information from FEC.COMPLIANCE_TIERS
 * - Returns false if tier doesn't exist
 * - Uses tierInfo.perDonationLimit for comparison
 *
 * RELATIONSHIPS
 * - Used by: reckon (legacy validation), validateDonationCompliance
 * - Part of: FEC compliance validation chain (first check)
 *
 * DEPENDENCIES
 * - constants/FEC: FEC compliance tier definitions and per-donation limits
 *
 * @module controller/users/account/utils/reckon/checkPerDonationLimit
 * @requires ../../../../../constants
 */

const { FEC } = require('../../../../../constants');

module.exports = {
  /**
   * Checks if a donation amount complies with per-donation limits
   *
   * This function verifies that the attempted donation amount does not exceed
   * the per-donation limit for the user's compliance tier. Per-donation limits
   * are enforced regardless of annual or per-election limits.
   *
   * @param {string} compliance - User's compliance tier ('guest' or 'compliant')
   * @param {number} attemptedAmount - The donation amount being attempted
   * @returns {boolean} - True if donation complies with per-donation limit, false otherwise
   *
   * @example
   * ```javascript
   * const { checkPerDonationLimit } = require('./controller/users/account/utils/reckon/checkPerDonationLimit');
   * const isCompliant = checkPerDonationLimit('guest', 100);
   * // Returns: true if $100 does not exceed guest per-donation limit
   * ```
   */
  checkPerDonationLimit: (compliance, attemptedAmount) => {
    const tierInfo = FEC.COMPLIANCE_TIERS[compliance];
    return tierInfo ? attemptedAmount <= tierInfo.perDonationLimit : false;
  },
};

