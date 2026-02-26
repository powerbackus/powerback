/**
 * @fileoverview Enhanced Compliance Checking Module with Election Cycle Support
 *
 * This module provides enhanced donation compliance validation that includes
 * election cycle-based resets and state-specific limits. It uses the
 * electionCycleService for accurate limit calculations based on actual election
 * dates, providing more precise compliance checking than simple calendar-year
 * resets. Falls back to legacy validation if the enhanced service fails.
 *
 * ENHANCED VALIDATION FEATURES
 *
 * ELECTION CYCLE RESETS (Compliant Tier)
 * - Uses state-specific primary and general election dates
 * - Resets limits based on actual election dates (not calendar year)
 * - Handles null primary dates (uses general election date)
 * - Falls back to statutory general election date if snapshot unavailable
 *
 * ANNUAL CAP RESETS (Guest Tier)
 * - Uses EST timezone for year boundary calculations
 * - Resets at midnight EST on December 31st / January 1st
 * - More accurate than simple calendar year calculations
 *
 * STATE-SPECIFIC LIMITS (Compliant Tier)
 * - Considers state for election date lookups
 * - Handles state-specific primary election dates
 * - Provides accurate per-election limit calculations
 *
 * VALIDATION FLOW
 *
 * 1. Attempts enhanced validation via electionCycleService.validateDonationLimits()
 * 2. If enhanced validation succeeds: Returns result
 * 3. If enhanced validation fails: Falls back to legacy reckon() validation
 * 4. Logs warnings when fallback occurs for monitoring
 *
 * BUSINESS LOGIC
 *
 * FALLBACK MECHANISM
 * - Enhanced validation may fail if election dates unavailable
 * - Falls back to legacy validation to ensure reliability
 * - Logs fallback events for monitoring and debugging
 * - Never blocks donation attempts due to validation service failures
 *
 * ELECTION CYCLE SERVICE INTEGRATION
 * - Uses services/congress/electionCycleService for limit calculations
 * - Provides pol_id and state for accurate calculations
 * - Handles async operations properly
 *
 * RELATIONSHIPS
 * - Primary validation method (preferred over legacy)
 * - Uses: services/congress/electionCycleService
 * - Falls back to: ./reckon (legacy validation)
 * - Used by: orchestrationService, validationService
 *
 * DEPENDENCIES
 * - services/congress/electionCycleService: Enhanced limit calculations
 * - services/utils/logger: Logging
 * - ./reckon: Legacy validation fallback
 *
 * @module controller/users/account/utils/reckon/checkEnhancedCompliance
 * @requires ../../../../../services/utils/logger
 * @requires ../../../../../services/congress/electionCycleService
 * @requires ./reckon
 */

const logger = require('../../../../../services/utils/logger')(__filename);
const {
  ...electionCycleService
} = require('../../../../../services/congress');
const { reckon } = require('./reckon');

module.exports = {
  /**
   * Checks donation compliance using enhanced validation with election cycles
   *
   * This function uses the enhanced election cycle service to validate donation
   * limits, which accounts for election cycle resets and state-specific limits.
   * If enhanced validation fails, it falls back to legacy validation using
   * the reckon function.
   *
   * @param {Array<Object>} donations - Array of user donation documents
   * @param {string} compliance - User's compliance tier ('guest' or 'compliant')
   * @param {number} attemptedAmount - The donation amount being attempted
   * @param {string} pol_id - The politician ID for per-election limit checks (optional)
   * @param {string} state - The state for state-specific limit checks (optional)
   * @returns {Promise<boolean>} - True if donation complies with limits, false otherwise
   *
   * @example
   * ```javascript
   * const { checkEnhancedCompliance } = require('./controller/users/account/utils/reckon/checkEnhancedCompliance');
   * const isCompliant = await checkEnhancedCompliance(donations, 'compliant', 100, 'pol123', 'CA');
   * // Returns: true if donation complies with enhanced limits
   * ```
   */
  checkEnhancedCompliance: async (
    donations,
    compliance,
    attemptedAmount,
    pol_id = null,
    state = null
  ) => {
    try {
      return await electionCycleService.validateDonationLimits(
        compliance,
        donations,
        attemptedAmount,
        pol_id,
        state
      );
    } catch (error) {
      // Fallback to legacy validation if enhanced validation fails
      logger.warn(
        'Enhanced compliance check failed, falling back to legacy validation:',
        error
      );
      return reckon(donations, compliance, pol_id, attemptedAmount);
    }
  },
};

