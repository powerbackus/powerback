/**
 * User account lock status checking utility module
 *
 * This module provides functionality to check if a user account is locked
 * based on field-value combinations. Used to verify account status before
 * allowing certain operations.
 *
 * @module controller/users/account/utils/rattle
 * @exports {Object} User account lock checking functions
 */

module.exports = {
  /**
   * Checks if a user account is locked
   *
   * This function verifies whether a user account with a specific field-value
   * combination is currently locked. Used to prevent operations on locked
   * accounts for security purposes.
   *
   * @param {string} field - The field name to search for (e.g., 'username', 'email')
   * @param {*} value - The field value to match
   * @param {Object} model - The database model for user operations
   * @returns {Promise<boolean>} - True if account is locked, false otherwise
   *
   * @example
   * ```javascript
   * const { rattle } = require('./controller/users/account/utils/rattle');
   * const isLocked = await rattle('username', 'user@example.com', UserModel);
   * // Returns: true if account is locked, false otherwise
   * ```
   */
  rattle: async (field, value, model) => {
    return Boolean(
      await model.countDocuments({
        [`${field}`]: {
          $exists: true,
          $eq: value,
        },
        locked: {
          $eq: true,
        },
      })
    );
  },
};
