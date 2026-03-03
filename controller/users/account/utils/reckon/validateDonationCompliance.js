/**
 * @fileoverview Comprehensive Donation Compliance Validation Module
 *
 * This module provides comprehensive donation compliance validation with enhanced
 * election cycle support and detailed compliance information. It attempts to use
 * enhanced validation first (with election cycle resets), falling back to legacy
 * validation if needed. Returns detailed compliance information including which
 * limits were checked, whether the donation is compliant, and specific limit
 * values for the tier.
 *
 * VALIDATION FLOW
 *
 * 1. Basic validation: Donation must be at least $1
 * 2. Validate compliance tier exists
 * 3. Check per-donation limit (all tiers)
 * 4. Attempt enhanced validation (with election cycle resets)
 * 5. If enhanced fails: Fall back to legacy validation
 *    - Guest: Check annual cap
 *    - Compliant: Check per-election limit
 * 6. Return comprehensive validation result
 *
 * RETURN VALUES
 *
 * SUCCESS RESULT
 * - isCompliant: true
 * - validationMethod: 'enhanced' or 'legacy'
 * - compliance: User's compliance tier
 * - attemptedAmount: Donation amount attempted
 * - annualCap: Annual cap for tier (or null for Compliant)
 * - perDonationLimit: Per-donation limit for tier
 * - perElectionLimit: Per-election limit for tier (Compliant only)
 *
 * FAILURE RESULT
 * - isCompliant: false
 * - reason: Specific reason for non-compliance
 * - validationMethod: 'enhanced' or 'legacy'
 * - compliance: User's compliance tier
 * - attemptedAmount: Donation amount attempted
 * - Limit fields: The specific limit that was exceeded
 *
 * BUSINESS LOGIC
 *
 * ENHANCED VALIDATION (Preferred)
 * - Uses electionCycleService.validateDonationLimits()
 * - Includes election cycle resets for Compliant tier
 * - Includes EST timezone for annual cap resets
 * - Includes state-specific election dates
 * - Returns detailed validation result
 *
 * LEGACY VALIDATION (Fallback)
 * - Used when enhanced validation fails
 * - Guest: Checks annual cap using calendar year
 * - Compliant: Checks per-election limit using cutoff dates
 * - Provides reliability when enhanced service unavailable
 *
 * ERROR HANDLING
 * - Logs warnings when enhanced validation fails
 * - Always provides validation result (never throws)
 * - Returns detailed error information in result object
 *
 * RELATIONSHIPS
 * - Primary comprehensive validation function
 * - Uses: checkPerDonationLimit, checkAnnualCap, checkPerElectionLimit
 * - Uses: services/congress/electionCycleService (enhanced validation)
 * - Used by: Services requiring detailed compliance information
 *
 * DEPENDENCIES
 * - constants/FEC: FEC compliance tier definitions and limits
 * - services/utils/logger: Logging
 * - services/congress/electionCycleService: Enhanced validation
 * - ./checkPerDonationLimit: Per-donation limit checking
 * - ./checkAnnualCap: Annual cap checking
 * - ./checkPerElectionLimit: Per-election limit checking
 *
 * @module controller/users/account/utils/reckon/validateDonationCompliance
 * @requires ../../../../../constants
 * @requires ../../../../../services/utils/logger
 * @requires ../../../../../services/congress/electionCycleService
 * @requires ./checkPerDonationLimit
 * @requires ./checkAnnualCap
 * @requires ./checkPerElectionLimit
 */

const { FEC } = require('../../../../../constants');
const logger = require('../../../../../services/utils/logger')(__filename);
const {
  ...electionCycleService
} = require('../../../../../services/congress');
const { checkPerDonationLimit } = require('./checkPerDonationLimit');
const { checkAnnualCap } = require('./checkAnnualCap');
const { checkPerElectionLimit } = require('./checkPerElectionLimit');

module.exports = {
  /**
   * Validates donation compliance with detailed result information
   *
   * This function performs comprehensive compliance validation and returns
   * detailed information about the validation result. It attempts enhanced
   * validation first (with election cycle resets), falling back to legacy
   * validation if enhanced validation fails.
   *
   * Returns detailed compliance information including:
   * - Compliance status and reason if non-compliant
   * - Validation method used (enhanced or legacy)
   * - All applicable limit values for the tier
   *
   * @param {Array<Object>} donations - Array of user donation documents
   * @param {string} compliance - User's compliance tier ('guest' or 'compliant')
   * @param {number} attemptedAmount - The donation amount being attempted
   * @param {string} pol_id - The politician ID for per-election limit checks
   * @param {string} state - The state for state-specific limit checks (optional)
   * @returns {Promise<Object>} - Detailed compliance validation result
   * @returns {boolean} result.isCompliant - Whether the donation is compliant
   * @returns {string} result.reason - Reason for non-compliance (if applicable)
   * @returns {string} result.validationMethod - 'enhanced' or 'legacy'
   * @returns {number} result.annualCap - Annual cap for the tier
   * @returns {number} result.perDonationLimit - Per-donation limit for the tier
   * @returns {number} result.perElectionLimit - Per-election limit for the tier
   *
   * @example
   * ```javascript
   * const { validateDonationCompliance } = require('./controller/users/account/utils/reckon/validateDonationCompliance');
   * const result = await validateDonationCompliance(donations, 'compliant', 1000, 'pol123', 'CA');
   * // Returns: { isCompliant: true, validationMethod: 'enhanced', ... }
   * ```
   */
  validateDonationCompliance: async (
    donations,
    compliance,
    attemptedAmount,
    pol_id,
    state = null
  ) => {
    // Basic validation
    if (attemptedAmount < 1) {
      return {
        isCompliant: false,
        reason: 'Donation must be at least $1',
        attemptedAmount,
        compliance,
      };
    }

    // Validate compliance tier exists
    const tierInfo = FEC.COMPLIANCE_TIERS[compliance];
    if (!tierInfo) {
      return {
        reason: 'Invalid compliance tier',
        isCompliant: false,
        attemptedAmount,
        compliance,
      };
    }

    // Check per-donation limit for ALL tiers
    const perDonationCompliant = checkPerDonationLimit(compliance, attemptedAmount);
    if (!perDonationCompliant) {
      return {
        perDonationLimit: tierInfo.perDonationLimit,
        reason: 'Exceeds per-donation limit',
        isCompliant: false,
        attemptedAmount,
        compliance,
      };
    }

    // Try enhanced validation first (with election cycle resets)
    let validationMethod = 'legacy';
    let isCompliant = false;
    let validationDetails = {};

    try {
      isCompliant = await electionCycleService.validateDonationLimits(
        compliance,
        donations,
        attemptedAmount,
        pol_id,
        state
      );
      validationMethod = 'enhanced';
    } catch (error) {
      // Fallback to legacy validation
      logger.warn(
        'Enhanced compliance check failed, falling back to legacy validation:',
        error
      );

      if (compliance === 'guest') {
        // Check annual cap
        const annualCapCompliant = checkAnnualCap(donations, compliance, attemptedAmount);
        if (!annualCapCompliant) {
          return {
            annualCap: tierInfo.annualCap,
            reason: 'Exceeds annual cap',
            validationMethod: 'legacy',
            isCompliant: false,
            attemptedAmount,
            compliance,
          };
        }
      } else if (compliance === 'compliant') {
        // Check per-election limit
        const perElectionCompliant = checkPerElectionLimit(donations, pol_id, attemptedAmount);
        if (!perElectionCompliant) {
          return {
            perElectionLimit: tierInfo.perElectionLimit,
            reason: 'Exceeds per-election limit',
            validationMethod: 'legacy',
            isCompliant: false,
            attemptedAmount,
            compliance,
          };
        }
      }

      isCompliant = true;
    }

    // Return comprehensive validation result
    return {
      compliance,
      isCompliant,
      attemptedAmount,
      validationMethod,
      annualCap: tierInfo.annualCap,
      perDonationLimit: tierInfo.perDonationLimit,
      perElectionLimit: tierInfo.perElectionLimit,
      ...validationDetails,
    };
  },
};

