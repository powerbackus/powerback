/**
 * @fileoverview FEC Compliance Validation Module
 *
 * This module provides FEC compliance validation functions for donation processing.
 * It exports all compliance checking functions including legacy validation, enhanced
 * validation with election cycles, and individual limit checks. FEC compliance tier
 * definitions and limits are documented in docs/DONATION_LIMITS.md.
 *
 * VALIDATION FUNCTIONS
 *
 * ENHANCED VALIDATION
 * - checkEnhancedCompliance: Enhanced validation with election cycle resets
 * - validateDonationCompliance: Comprehensive validation with detailed results
 *
 * LEGACY VALIDATION
 * - reckon: Legacy validation using calendar-year resets (fallback)
 *
 * INDIVIDUAL LIMIT CHECKS
 * - checkPACLimit: PAC tip limit checking ($5,000 annual)
 * - checkAnnualCap: Annual cap checking (Guest tier)
 * - checkPerDonationLimit: Per-donation limit checking (all tiers)
 * - checkPerElectionLimit: Per-election limit checking (Compliant tier)
 *
 * BUSINESS LOGIC
 *
 * VALIDATION FLOW
 * - Enhanced validation preferred (with election cycle resets)
 * - Falls back to legacy validation if enhanced fails
 * - Individual limit checks used by both validation methods
 *
 * COMPLIANCE TIERS
 * - Guest: $50 per donation, $200 annual cap
 * - Compliant: $3,500 per candidate per election
 *
 * DEPENDENCIES
 * - ./checkPACLimit: PAC limit checking
 * - ./checkAnnualCap: Annual cap checking
 * - ./checkPerDonationLimit: Per-donation limit checking
 * - ./checkPerElectionLimit: Per-election limit checking
 * - ./checkEnhancedCompliance: Enhanced validation
 * - ./validateDonationCompliance: Comprehensive validation
 * - ./reckon: Legacy validation
 *
 * @module controller/users/account/utils/reckon
 * @requires ./reckon
 * @requires ./checkPACLimit
 * @requires ./checkAnnualCap
 * @requires ./checkPerDonationLimit
 * @requires ./checkPerElectionLimit
 * @requires ./checkEnhancedCompliance
 * @requires ./validateDonationCompliance
 */

const { reckon } = require('./reckon'),
  { checkPACLimit } = require('./checkPACLimit'),
  { checkAnnualCap } = require('./checkAnnualCap'),
  { checkPerDonationLimit } = require('./checkPerDonationLimit'),
  { checkPerElectionLimit } = require('./checkPerElectionLimit'),
  { checkEnhancedCompliance } = require('./checkEnhancedCompliance'),
  { validateDonationCompliance } = require('./validateDonationCompliance');

/**
 * FEC compliance validation exports
 *
 * @exports {Object} FEC compliance validation functions
 * @property {Function} checkPACLimit - Check if tip would exceed PAC annual limit
 * @property {Function} checkAnnualCap - Check if donation would exceed annual cap
 * @property {Function} checkPerDonationLimit - Check if donation would exceed per-donation limit
 * @property {Function} checkPerElectionLimit - Check if donation would exceed per-election limit
 * @property {Function} checkEnhancedCompliance - Enhanced validation with election cycle resets
 * @property {Function} validateDonationCompliance - Comprehensive validation with detailed results
 * @property {Function} reckon - Legacy FEC compliance validation
 */
module.exports = {
  checkPACLimit,
  checkAnnualCap,
  checkPerDonationLimit,
  checkPerElectionLimit,
  checkEnhancedCompliance,
  validateDonationCompliance,
  reckon,
};
