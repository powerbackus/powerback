/**
 * User data pruning utility module
 *
 * This module provides functionality to remove sensitive fields from user
 * documents before sending them to the client. It ensures that passwords,
 * tokens, internal metadata, and other sensitive information are never
 * exposed to the frontend.
 *
 * @module controller/users/account/utils/prune
 * @exports {Object} User data pruning functions
 */

module.exports = {
  /**
   * Prunes sensitive fields from a user document
   *
   * This function removes sensitive fields from a user document including
   * passwords, tokens, internal versioning, and metadata. Used to sanitize
   * user data before sending it to the client to prevent information leakage.
   *
   * @param {Object} userDocument - The user document to prune
   * @returns {Object} - User document with sensitive fields removed
   *
   * @example
   * ```javascript
   * const { prune } = require('./controller/users/account/utils/prune');
   * const safeUserData = prune(userDocument);
   * // Returns user data without password, tokens, etc.
   * ```
   */
  prune: (userDocument) => {
    const {
      __v,
      locked,
      password,
      createdAt,
      donations, // []
      updatedAt,
      accessToken,
      refreshToken,
      resetPasswordToken,
      lastUpdatedPassword,
      tryPasswordAttempts,
      resetPasswordExpires,
      resetPasswordAttempts,
      resetPasswordTokenIssueDate,
      ...pruned
    } = userDocument;
    return pruned;
  },
};
