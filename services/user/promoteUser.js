/**
 * @fileoverview User Promotion Service
 *
 * This service handles the complete user promotion process including address
 * validation, congressional district lookup, profile updates, and compliance
 * promotion. It orchestrates multiple operations to ensure users can be
 * promoted to higher compliance tiers with proper validation.
 *
 * KEY FEATURES
 *
 * ADDRESS VALIDATION
 * - Validates complete address information (address, city, state, zip)
 * - Throws 'incomplete-address' error if any field missing
 * - Required for Compliant tier promotion
 *
 * CONGRESSIONAL DISTRICT LOOKUP
 * - Looks up user's congressional district using Google Civics API
 * - Handles API failures gracefully
 * - Sets addressValidationFlag if lookup fails
 * - Throws 'prompt-requery' if address ambiguous
 *
 * PROFILE UPDATE
 * - Updates user profile with safe fields only
 * - Excludes sensitive fields (password, tokens, etc.)
 * - Sets ocd_id for district mapping
 * - Uses atomic update operation
 *
 * COMPLIANCE PROMOTION
 * - Triggers compliance promotion logic
 * - Determines appropriate tier (guest or compliant)
 * - Based on form completion and donation history
 *
 * BUSINESS LOGIC
 *
 * PROMOTION FLOW
 * 1. Validate address completeness
 * 2. Look up congressional district
 * 3. Update user profile with district info
 * 4. Trigger compliance promotion
 * 5. Return promotion result with pruned user data
 *
 * ERROR HANDLING
 * - 'incomplete-address': Missing address fields
 * - 'prompt-requery': Address ambiguous, needs more detail
 * - 'update-failed': Database update failed
 * - 'promotion-failed': Compliance promotion failed
 *
 * ADDRESS VALIDATION FLAGS
 * - Set when district lookup fails
 * - Indicates address may be invalid
 * - Stored in validationFlags for review
 *
 * DEPENDENCIES
 * - controller/civics/getLocalPols: District lookup
 * - controller/users/account/utils/prune: Data sanitization
 * - services/utils/logger: Logging
 * - models/User: User model
 *
 * @module services/user/promoteUser
 * @requires ../../controller/civics/getLocalPols
 * @requires ../../controller/users/account/utils/prune
 * @requires ../utils/logger
 * @requires ../../models/User
 */

const { getLocalPols } = require('../../controller/civics/getLocalPols'),
  { prune } = require('../../controller/users/account/utils'),
  logger = require('../utils/logger')(__filename);
async function promoteUser(userDoc, UserModel, promoteFn) {
  // Extract address components from user document
  const { address, city, state, zip } = userDoc;

  /**
   * Validates that the user has provided complete address information
   * All address fields (address, city, state, zip) must be present
   *
   * @throws {Error} 'incomplete-address' - If any address field is missing
   */
  if (!(address && city && state && zip)) throw new Error('incomplete-address');

  /**
   * Constructs full address string for congressional district lookup
   * Format: "street city state zip"
   */
  const fullAddress = `${address} ${city} ${state} ${zip}`;

  /**
   * Looks up the user's congressional district using Google Civics API
   * This is required for FEC compliance and donation tracking
   *
   * If the API call fails, we log the error and continue with promotion
   * but flag the user for having an invalid address
   *
   * @throws {Error} 'prompt-requery' - If address is ambiguous and needs more detail
   */
  let districtInfo;
  let addressValidationFlag = null;

  try {
    districtInfo = await getLocalPols(fullAddress);
    if (districtInfo === 'prompt-requery') throw new Error('prompt-requery');
    if (!districtInfo) {
      // API returned null/undefined - address may be invalid
      districtInfo = ''; // Set empty string to continue promotion
      addressValidationFlag = {
        field: 'address',
        reason: 'Congressional district lookup failed - address may be invalid',
        match: 'district_lookup_failed',
        originalValue: fullAddress,
      };
      logger.warn('Congressional district lookup failed for user', {
        userId: userDoc._id || userDoc.id,
        address: fullAddress,
        reason: 'API returned null/undefined',
      });
    }
  } catch (error) {
    // API call failed - log error and continue with promotion
    districtInfo = ''; // Set empty string to continue promotion
    addressValidationFlag = {
      field: 'address',
      reason: 'Congressional district lookup failed - address may be invalid',
      match: 'district_lookup_failed',
      originalValue: fullAddress,
    };
    logger.error('Google Civics API call failed during user promotion', {
      userId: userDoc._id || userDoc.id,
      address: fullAddress,
      error: error.message,
      stack: error.stack,
    });

    // Re-throw prompt-requery errors as they need special handling
    if (error.message === 'prompt-requery') {
      throw error;
    }
  }

  /**
   * Removes sensitive and internal fields from user document
   * Only safe fields that the client should be able to update are kept
   * This prevents unauthorized updates to critical user data
   */
  const {
    _id,
    id,
    locked,
    payment,
    password,
    username,
    createdAt,
    donations,
    updatedAt,
    understands,
    tokenVersion,
    resetPasswordHash,
    tryPasswordAttempts,
    lastTimeUpdatedPassword,
    resetPasswordHashExpires,
    resetPasswordHashIssueDate,
    ...safeForClientToUpdate
  } = userDoc;

  // Use either _id or id, whichever is available
  const userId = _id || id;

  /**
   * Updates the user's profile in the database with:
   * - Safe user data (contact info, employment, etc.)
   * - Congressional district ID (ocd_id)
   * - Note: Compliance level will be determined after profile update
   *
   * @throws {Error} 'update-failed' - If database update fails
   */
  let updatedUser;
  try {
    updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        ...safeForClientToUpdate,
        ocd_id: districtInfo,
        // Note: compliance level will be determined by promoteFn after this update
      },
      { new: true, useFindAndModify: false }
    );

    logger.info('Updated user profile', {
      action: 'update_profile',
      userId: userId,
    });
  } catch (err) {
    logger.error('User profile update failed', {
      action: 'update_profile',
      userId: userId,
      error: err.message,
    });
    throw new Error('update-failed');
  }

  /**
   * Triggers the compliance promotion logic to determine the appropriate
   * compliance level (guest or compliant) based on form completion
   * and donation history
   *
   * @throws {Error} 'promotion-failed' - If compliance promotion fails
   */
  let promotion;
  try {
    // Verify the user exists before calling promote
    const verifyUser = await UserModel.findById(userId);
    if (verifyUser) {
      logger.debug('Verified user data:', {
        id: verifyUser._id,
        compliance: verifyUser.compliance,
        firstName: verifyUser.firstName,
        lastName: verifyUser.lastName,
      });
    }

    promotion = await promoteFn(userId, UserModel);
  } catch (err) {
    logger.error('[promoteUser] promoteFn error:', err);
    throw new Error('promotion-failed');
  }

  /**
   * Returns the promotion result with:
   * - updated: Pruned user data safe for client consumption
   * - promotion: Result of compliance promotion
   * - district: Congressional district information
   * - addressValidationFlag: Flag information if address validation failed
   */
  return {
    promotion,
    addressValidationFlag,
    district: districtInfo,
    updated: prune(updatedUser._doc),
  };
}

module.exports = { promoteUser };
