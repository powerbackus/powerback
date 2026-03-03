/**
 * @fileoverview PAC Annual Limit Compliance Checker Module
 *
 * This module validates that tip contributions (PAC donations) do not exceed
 * the annual PAC limit. PAC limits are separate from regular donation limits
 * and apply to all users regardless of compliance tier. PAC limits reset each
 * calendar year at midnight EST on January 1st.
 *
 * PAC LIMIT RULES
 *
 * ANNUAL LIMIT
 * - PAC annual limit: $5,000 per calendar year
 * - Applies to all users regardless of compliance tier
 * - Separate from regular donation limits
 *
 * TIP CONTRIBUTIONS
 * - Only tips (donation.tip field) count toward PAC limit
 * - Regular donations (donation.donation field) do not count
 * - Tips are optional contributions to the PAC
 *
 * CALENDAR YEAR RESET
 * - Resets at midnight EST on January 1st
 * - Only counts tips from current calendar year
 * - Excludes resolved, defunct, and paused donations
 *
 * BUSINESS LOGIC
 *
 * CALENDAR YEAR CALCULATION
 * - Uses current calendar year (January 1 - December 31)
 * - Filters donations by createdAt date within current year
 * - Excludes resolved, defunct, and paused donations
 *
 * TIP AGGREGATION
 * - Sums all tip amounts (donation.tip) from current year
 * - Only counts tips, not regular donations
 * - Handles missing tip field (defaults to 0)
 *
 * COMPLIANCE CHECK
 * - Calculates: currentPACTotal + attemptedTipAmount <= pacLimit
 * - Returns detailed result object with compliance status
 * - Includes remaining limit, current total, and limit status
 *
 * RETURN VALUES
 * - isCompliant: Boolean indicating if tip complies with limit
 * - attemptedTipAmount: The attempted tip amount
 * - remainingPACLimit: Remaining PAC limit for the year
 * - currentPACTotal: Current year's PAC tip total
 * - wouldExceed: Whether the tip would exceed the limit
 * - hasReachedLimit: Whether the user has already reached the limit
 * - pacLimit: The annual PAC limit amount ($5,000)
 *
 * RELATIONSHIPS
 * - Used by: orchestrationService (PAC limit checking during celebration creation)
 * - Used by: validationService (PAC limit validation)
 * - Part of: FEC compliance validation (separate from donation limits)
 *
 * DEPENDENCIES
 * - constants/FEC: FEC PAC annual limit constant (FEC.PAC_ANNUAL_LIMIT)
 *
 * @module controller/users/account/utils/reckon/checkPACLimit
 * @requires ../../../../../constants
 */

const { FEC } = require('../../../../../constants');

module.exports = {
  /**
   * Checks if a tip amount complies with PAC annual limits
   *
   * This function calculates the current year's PAC tip total and verifies
   * that adding the attempted tip amount would not exceed the annual PAC limit.
   * Returns detailed information about compliance status and remaining limit.
   *
   * @param {Array<Object>} donations - Array of user donation documents
   * @param {number} attemptedTipAmount - The tip amount being attempted
   * @returns {Object} - PAC limit compliance result
   * @returns {boolean} result.isCompliant - Whether the tip complies with PAC limit
   * @returns {number} result.attemptedTipAmount - The attempted tip amount
   * @returns {number} result.remainingPACLimit - Remaining PAC limit for the year
   * @returns {number} result.currentPACTotal - Current year's PAC tip total
   * @returns {boolean} result.wouldExceed - Whether the tip would exceed the limit
   * @returns {boolean} result.hasReachedLimit - Whether the user has reached the limit
   * @returns {number} result.pacLimit - The annual PAC limit amount
   *
   * @example
   * ```javascript
   * const { checkPACLimit } = require('./controller/users/account/utils/reckon/checkPACLimit');
   * const result = checkPACLimit(donations, 50);
   * // Returns: { isCompliant: true, remainingPACLimit: 4950, ... }
   * ```
   */
  checkPACLimit: (donations, attemptedTipAmount) => {
    const pacLimit = FEC.PAC_ANNUAL_LIMIT;

    // Calculate current year PAC contributions (tips only)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const tipsThisYear = donations.filter((d) => {
      if (d.resolved || d.defunct || d.paused) return false;
      const donationDate = new Date(d.createdAt);
      return donationDate >= startOfYear && donationDate <= endOfYear;
    });

    const currentPACTotal = tipsThisYear
      .map((d) => d.tip || 0) // Only count tips, not donations
      .reduce((a, b) => a + b, 0);

    const wouldExceed = currentPACTotal + attemptedTipAmount > pacLimit;
    const remainingPACLimit = Math.max(0, pacLimit - currentPACTotal);
    const hasReachedLimit = currentPACTotal >= pacLimit;

    return {
      isCompliant: !wouldExceed,
      attemptedTipAmount,
      remainingPACLimit,
      currentPACTotal,
      wouldExceed,
      hasReachedLimit,
      pacLimit,
    };
  },
};

