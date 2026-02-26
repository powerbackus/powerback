/**
 * @fileoverview Celebration Validation Service
 *
 * This service provides validation functions for celebration creation, including
 * FEC compliance validation, PAC limit validation, and donor information
 * validation. It encapsulates all validation logic with proper error handling
 * and fallback mechanisms.
 *
 * KEY FUNCTIONS
 *
 * validateFECCompliance(celebrations, compliance, donationAmount, polId)
 * - Validates donation against FEC compliance tier limits
 * - Uses enhanced validation with election cycle resets (Gold tier)
 * - Falls back to legacy validation if enhanced check fails
 * - Returns boolean indicating compliance
 *
 * validatePACLimits(celebrations, tipAmount, userId)
 * - Validates tip amount against $5,000 annual PAC limit
 * - Returns PAC limit information object or null
 * - Handles errors gracefully to not block celebration creation
 *
 * validateDonorInfo(userInfo, compliance)
 * - Validates donor information against compliance tier requirements
 * - Returns validation result with flags for recipient committee review
 * - Logs validation results for monitoring
 *
 * prepareDonorInfo(userInfo, compliance, validationResult)
 * - Prepares donor information snapshot for storage in celebration
 * - Includes validation flags and compliance tier at donation time
 * - Creates immutable snapshot for FEC compliance and audit purposes
 *
 * BUSINESS LOGIC
 *
 * FEC COMPLIANCE VALIDATION
 * - Guest: Annual caps reset at year boundary (EST)
 * - Compliant: Per-election limits reset based on state-specific election dates
 * - Enhanced validation uses election cycle service for accurate resets
 * - Legacy validation provides fallback for reliability
 *
 * PAC LIMIT VALIDATION
 * - $5,000 annual limit across all tips (not per-candidate)
 * - Calendar year reset (January 1st)
 * - Validation continues even if check fails (non-blocking)
 *
 * DONOR VALIDATION
 * - Validates required fields based on compliance tier
 * - Guest: Minimal requirements
 * - Compliant: Name, address, and employment information required
 * - Flags missing or invalid information for committee review
 *
 * DEPENDENCIES
 * - controller/users: Compliance checking functions
 * - services/user/donorValidation: Donor information validation
 * - controller/users/account/utils/reckon: PAC limit checking
 *
 * @module services/celebration/validationService
 * @requires ../../controller/users
 * @requires ../logger
 * @requires ../../services/user/donorValidation
 * @requires ../../controller/users/account/utils/reckon
 */

const UserController = require('../../controller/users');
const { requireLogger } = require('../logger');

const logger = requireLogger(__filename);

/**
 * Enhanced FEC compliance validation with fallback
 * @param {Array} celebrations - User's existing celebrations
 * @param {string} compliance - User's compliance tier (guest/compliant)
 * @param {number} donationAmount - Amount being donated
 * @param {string} polId - Politician ID
 * @returns {Promise<boolean>} - Whether donation is compliant
 */
async function validateFECCompliance(
  celebrations,
  compliance,
  donationAmount,
  polId
) {
  let donationIsCompliant;

  try {
    // Try enhanced validation first (with election cycle resets for Compliant tier)
    donationIsCompliant = await UserController.checkEnhancedCompliance(
      celebrations,
      compliance,
      donationAmount,
      polId,
      null // No politician state lookup needed for basic validation
    );
  } catch (error) {
    logger.warn(
      'Enhanced compliance check failed, falling back to legacy validation:',
      error.message
    );
    // Fallback to legacy validation if enhanced check fails
    donationIsCompliant = await UserController.reckon(
      celebrations,
      compliance,
      polId,
      donationAmount
    );
  }

  return donationIsCompliant;
}

/**
 * Validates PAC limits for tips
 * @param {Array} celebrations - User's existing celebrations
 * @param {number} tipAmount - Tip amount being added
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - PAC limit information
 */
async function validatePACLimits(celebrations, tipAmount, userId) {
  if (!tipAmount || tipAmount <= 0) {
    return null;
  }

  logger.debug('Starting PAC limit validation:', {
    userId: userId,
    tipAmount: tipAmount,
    celebrationsType: typeof celebrations,
    celebrationsLength: celebrations?.length || 0,
  });

  try {
    const {
      checkPACLimit,
    } = require('../../controller/users/account/utils/reckon');

    // Ensure celebrations is an array
    const safeCelebrations = celebrations || [];
    logger.debug('PAC limit validation:', {
      userId: userId,
      tipAmount: tipAmount,
      celebrationsCount: safeCelebrations.length,
      celebrations: safeCelebrations.map((c) => ({
        id: c._id,
        tip: c.tip,
        createdAt: c.createdAt,
      })),
    });

    const pacLimitInfo = checkPACLimit(safeCelebrations, tipAmount);
    logger.debug('PAC limit check result:', {
      pacLimitInfo,
      tipAmount: tipAmount,
    });

    return pacLimitInfo;
  } catch (error) {
    logger.error(
      'PAC limit validation failed during celebration creation:',
      {
        stack: error.stack,
        error: error.message,
        tipAmount: tipAmount,
        userId: userId,
        celebrationsCount: celebrations?.length || 0,
      }
    );
    // Return null to continue with celebration creation even if PAC validation fails
    return null;
  }
}

/**
 * Validates donor information and captures validation flags
 * @param {Object} userInfo - User information
 * @param {string} compliance - User's compliance tier
 * @returns {Promise<Object>} - Validation result with flags
 */
async function validateDonorInfo(userInfo, compliance) {
  const {
    validateDonorInfo: validateDonor,
    getValidationSummary,
  } = require('../../services/user/donorValidation');

  const validationResult = validateDonor(userInfo, compliance);
  const validationSummary = getValidationSummary(validationResult);

  // Log donor validation results
  if (validationSummary.isFlagged) {
    logger.warn(
      'Donation has validation flags - flagged for recipient committee review:',
      {
        userId: userInfo._id,
        flagCount: validationSummary.totalFlags,
        flags: validationResult.flags.map(
          (f) => `${f.field}: ${f.reason}`
        ),
        compliance: compliance,
      }
    );
  } else {
    logger.info('Donor validation completed - no flags detected:', {
      userId: userInfo._id,
      compliance: compliance,
    });
  }

  return {
    validationResult,
    validationSummary,
  };
}

/**
 * Prepares donor information to capture at donation time
 * @param {Object} userInfo - User information
 * @param {string} compliance - User's compliance tier
 * @param {Object} validationResult - Validation result
 * @returns {Object} - Prepared donor information
 */
function prepareDonorInfo(userInfo, compliance, validationResult) {
  const { validationSummary } = validationResult;

  return {
    firstName: userInfo.firstName ?? '',
    lastName: userInfo.lastName ?? '',
    address: userInfo.address ?? '',
    city: userInfo.city ?? '',
    state: userInfo.state ?? '',
    zip: userInfo.zip ?? '',
    country: userInfo.country ?? 'United States',
    passport: userInfo.passport ?? '',
    isEmployed:
      userInfo.isEmployed !== undefined ? userInfo.isEmployed : false,
    occupation: userInfo.occupation ?? '',
    employer: userInfo.employer ?? '',
    compliance: compliance,
    email: userInfo.email ?? '',
    username: userInfo.username ?? '',
    phoneNumber: userInfo.phoneNumber ?? '',
    // Additional validation and audit fields
    ocd_id: userInfo.ocd_id ?? '',
    locked: userInfo.locked ?? false,
    understands: userInfo.understands ?? false,

    // Validation flags captured at donation time
    validationFlags: {
      isFlagged: validationSummary.isFlagged,
      summary: {
        totalFlags: validationSummary.totalFlags,
      },
      flags: validationResult.validationResult.flags,
      validatedAt: new Date(),
      validationVersion: '1.0',
    },
  };
}

module.exports = {
  validateFECCompliance,
  validatePACLimits,
  validateDonorInfo,
  prepareDonorInfo,
};
