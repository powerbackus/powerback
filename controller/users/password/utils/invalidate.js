/**
 * Password reset hash invalidation utility module
 *
 * This module provides functionality to invalidate password reset hashes by
 * clearing the reset password hash fields and resetting attempt counters.
 * Used when reset hashes expire or are used successfully.
 *
 * @module controller/users/password/utils/invalidate
 * @exports {Object} Password reset hash invalidation functions
 */

module.exports = {
  /**
   * Invalidates a password reset hash
   *
   * This function clears the password reset hash fields and resets the password
   * attempt counter for a user with a specific reset hash. Used to clean up
   * reset hashes after they're used or expired.
   *
   * @param {string} hash - The password reset hash to invalidate
   * @param {Object} model - The database model for user operations
   * @returns {Promise<Object>} - MongoDB update result
   *
   * @example
   * ```javascript
   * const { invalidate } = require('./controller/users/password/utils/invalidate');
   * await invalidate(hash, UserModel);
   * ```
   */
  invalidate: async (hash, model) => {
    return await model.updateOne(
      {
        resetPasswordHash: {
          $exists: true,
          $eq: hash,
        },
      },
      {
        $set: {
          tryPasswordAttempts: 0,
          resetPasswordHash: null,
          resetPasswordHashExpires: null,
          resetPasswordHashIssueDate: null,
        },
      }
    );
  },
};
