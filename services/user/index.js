/**
 * @fileoverview User Services Module - Main Export
 *
 * This module serves as the central export point for all user-related services
 * in the POWERBACK application. It provides a clean interface for importing
 * user services throughout the application.
 *
 * SERVICE CATEGORIES
 *
 * USER PROMOTION
 * - promoteUser: Complete user promotion process with address validation and
 *   compliance tier determination
 *
 * DONOR VALIDATION
 * - validateDonorInfo: Main donor validation for FEC "best efforts" compliance
 * - Field validators: validateName, validateAddress, validateOccupation, validateEmployer
 * - Utilities: normalizeText, containsKeywords, matchesPattern, getValidationSummary
 *
 * DISTRICT MANAGEMENT
 * - updateUserDistrict: Update user's congressional district via Google Civics API
 *
 * DEPENDENCIES
 * - ./promoteUser: User promotion service
 * - ./userDistrict: District update service
 * - ./donorValidation: Donor validation service
 *
 * @module services/user
 * @requires ./promoteUser
 * @requires ./userDistrict
 * @requires ./donorValidation
 */

const { promoteUser } = require('./promoteUser');
const { updateUserDistrict } = require('./userDistrict');
const { ...donorValidation } = require('./donorValidation');

module.exports = {
  promoteUser,
  updateUserDistrict,
  ...donorValidation,
};
