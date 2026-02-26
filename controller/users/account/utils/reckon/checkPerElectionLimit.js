/**
 * @fileoverview Per-Election Limit Compliance Checker Module
 *
 * This module validates that donations to a specific candidate do not exceed
 * the per-election limit. Per-election limits apply only to compliant tier users
 * and are calculated per candidate per election cycle. Primary and general
 * elections have separate limits.
 *
 * PER-ELECTION LIMITS (Compliant Tier Only)
 *
 * COMPLIANT TIER
 * - Per-election limit: $3,500 per candidate per election
 * - Primary and general elections are separate limits
 * - Resets based on election cutoff dates (not calendar year)
 * - Applies per candidate (pol_id), not aggregate across all candidates
 *
 * BUSINESS LOGIC
 *
 * ELECTION CYCLE DETERMINATION
 * - Uses cutoff() function to determine if donation is in current election cycle
 * - Only counts donations within current election cycle
 * - Primary and general elections are separate cycles
 *
 * PER-CANDIDATE FILTERING
 * - Limits are per candidate (pol_id), not aggregate
 * - Filters donations by pol_id matching the candidate
 * - Each candidate has separate $3,500 limit per election
 *
 * DONATION FILTERING
 * - Only counts active donations (resolved: false, defunct: false, paused: false)
 * - Filters by pol_id for per-candidate calculation
 * - Uses cutoff() to determine election cycle
 * - Sums all donation amounts for candidate in current cycle
 *
 * COMPLIANCE CHECK
 * - Calculates: currentElectionTotal + attemptedAmount <= perElectionLimit
 * - Returns true if within limit, false if would exceed
 * - Only applies to Compliant tier users
 *
 * RELATIONSHIPS
 * - Used by: reckon (legacy validation), validateDonationCompliance
 * - Part of: FEC compliance validation chain (Compliant tier only)
 * - Uses: controller/congress/cutoff for election cycle determination
 *
 * DEPENDENCIES
 * - constants/FEC: FEC compliance tier definitions and per-election limits
 * - controller/congress/cutoff: Election cycle cutoff date calculation
 *
 * @module controller/users/account/utils/reckon/checkPerElectionLimit
 * @requires ../../../../../constants
 * @requires ../../../../congress/cutoff
 */

const { FEC } = require('../../../../../constants');
const { cutoff } = require('../../../../congress');

module.exports = {
  /**
   * Checks if a donation complies with per-election limits for a candidate
   *
   * This function calculates the current election cycle's donation total for
   * a specific candidate and verifies that adding the attempted amount would
   * not exceed the per-election limit. Only compliant tier users have per-election
   * limits. Uses election cutoff dates to determine the current cycle.
   *
   * @param {Array<Object>} donations - Array of user donation documents
   * @param {string} pol_id - The politician ID for the candidate
   * @param {number} attemptedAmount - The donation amount being attempted
   * @returns {boolean} - True if donation complies with per-election limit, false otherwise
   *
   * @example
   * ```javascript
   * const { checkPerElectionLimit } = require('./controller/users/account/utils/reckon/checkPerElectionLimit');
   * const isCompliant = checkPerElectionLimit(donations, 'pol123', 1000);
   * // Returns: true if $1000 donation would not exceed per-election limit for this candidate
   * ```
   */
  checkPerElectionLimit: (donations, pol_id, attemptedAmount) => {
    const perElectionLimit = FEC.COMPLIANCE_TIERS.compliant.perElectionLimit;

    const donationsThisElection = donations.filter((d) => {
      if (d.resolved || d.defunct || d.paused) return false;
      // Compliant tier limit applies per candidate - filter by pol_id
      if (d.pol_id !== pol_id) return false;
      if (!cutoff(d.createdAt)) return false;
      return true;
    });

    const currentElectionTotal = donationsThisElection
      .map((d) => d.donation)
      .reduce((a, b) => a + b, 0);

    return currentElectionTotal + attemptedAmount <= perElectionLimit;
  },
};

