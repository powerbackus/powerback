/**
 * @fileoverview Legacy Donation Compliance Validation Module
 *
 * This module provides legacy donation compliance validation using calendar-year
 * resets. It serves as the fallback validation method when enhanced election
 * cycle validation is unavailable. The module checks per-donation limits,
 * annual caps (guest), and per-election limits (compliant) to determine
 * if a donation attempt is FEC compliant.
 *
 * COMPLIANCE TIER LIMITS
 *
 * GUEST TIER
 * - Per-donation limit: $50
 * - Annual cap: $200 (calendar year reset)
 * - No per-election limits
 *
 * COMPLIANT TIER
 * - Per-donation limit: $3,500
 * - No annual cap
 * - Per-election limit: $3,500 per candidate per election (election cycle reset)
 *
 * VALIDATION FLOW
 *
 * 1. Basic validation: Donation must be at least $1
 * 2. Validate compliance tier exists
 * 3. Check per-donation limit (all tiers)
 * 4. Guest: Check annual cap (calendar year)
 * 5. Compliant: Check per-election limit (election cycle, per candidate)
 *
 * BUSINESS LOGIC
 *
 * CALENDAR YEAR RESETS (Guest)
 * - Annual caps reset at midnight EST on December 31st / January 1st
 * - Only counts active donations from current calendar year
 * - Excludes resolved, defunct, and paused donations
 *
 * ELECTION CYCLE RESETS (Compliant)
 * - Per-election limits reset based on election cutoff dates
 * - Uses cutoff() function to determine current election cycle
 * - Limits are per candidate (pol_id)
 * - Primary and general elections are separate limits
 *
 * DONATION FILTERING
 * - Only counts active donations (not resolved, defunct, or paused)
 * - Uses donation.createdAt for date calculations
 * - Compliant tier filters by pol_id for per-candidate limits
 *
 * RELATIONSHIPS
 * - Used by: checkEnhancedCompliance (as fallback)
 * - Uses: checkPerDonationLimit, checkAnnualCap, checkPerElectionLimit
 * - Replaced by: Enhanced validation (electionCycleService) when available
 *
 * DEPENDENCIES
 * - constants/FEC: FEC compliance tier definitions and limits
 * - services/utils/logger: Logging
 * - ./checkPerDonationLimit: Per-donation limit checking
 * - ./checkAnnualCap: Annual cap checking
 * - ./checkPerElectionLimit: Per-election limit checking
 *
 * @module controller/users/account/utils/reckon/reckon
 * @requires ../../../../../constants
 * @requires ../../../../../services/utils/logger
 * @requires ./checkPerDonationLimit
 * @requires ./checkAnnualCap
 * @requires ./checkPerElectionLimit
 */

const { FEC } = require('../../../../../constants');
const logger = require('../../../../../services/utils/logger')(__filename);
const { checkPerDonationLimit } = require('./checkPerDonationLimit');
const { checkAnnualCap } = require('./checkAnnualCap');
const { checkPerElectionLimit } = require('./checkPerElectionLimit');

module.exports = {
  /**
   * Validates donation compliance using legacy calendar-year calculations
   *
   * This function performs comprehensive compliance validation:
   * - Validates minimum donation amount ($1)
   * - Checks per-donation limits for all tiers
   * - Checks annual caps for guest tier
   * - Checks per-election limits for compliant tier
   *
   * Uses calendar-year resets for annual caps (not election cycle-based).
   *
   * @param {Array<Object>} donations - Array of user donation documents
   * @param {string} compliance - User's compliance tier ('guest' or 'compliant')
   * @param {string} pol_id - The politician ID for per-election limit checks
   * @param {number} attemptedAmount - The donation amount being attempted
   * @returns {boolean} - True if donation is compliant, false otherwise
   *
   * @example
   * ```javascript
   * const { reckon } = require('./controller/users/account/utils/reckon/reckon');
   * const isCompliant = reckon(donations, 'compliant', 'pol123', 1000);
   * // Returns: true if donation complies with all applicable limits
   * ```
   */
  reckon: (donations, compliance, pol_id, attemptedAmount) => {
    // Basic validation: donation must be at least $1
    if (attemptedAmount < 1) {
      return false;
    }

    // Validate compliance tier exists
    if (!FEC.COMPLIANCE_TIERS[compliance]) {
      logger.error('Invalid compliance tier:', compliance);
      return false;
    }

    // Check per-donation limit for ALL tiers
    const perDonationCompliant = checkPerDonationLimit(compliance, attemptedAmount);
    if (!perDonationCompliant) {
      return false;
    }

    // Guest: Check annual cap
    if (compliance === 'guest') {
      const annualCapCompliant = checkAnnualCap(donations, compliance, attemptedAmount);
      if (!annualCapCompliant) {
        return false;
      }
    }

    // Compliant: Check per-election limit
    if (compliance === 'compliant') {
      const perElectionCompliant = checkPerElectionLimit(donations, pol_id, attemptedAmount);
      if (!perElectionCompliant) {
        return false;
      }
    }

    return true;
  },
};

