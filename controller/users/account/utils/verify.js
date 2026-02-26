/**
 * User field verification utility module
 *
 * This module provides functionality to verify if a field value exists in
 * the user database. Used for checking username availability, email uniqueness,
 * and other field validation operations.
 *
 * @module controller/users/account/utils/verify
 * @exports {Object} User field verification functions
 */

module.exports = {
  /**
   * Verifies if a field value exists in the user database
   *
   * This function checks if any user document exists with a specific field value.
   * Used for validating field uniqueness, checking if usernames/emails are taken,
   * and other existence checks.
   *
   * @param {*} value - The field value to check for
   * @param {string} field - The field name to search in (e.g., 'username', 'email')
   * @param {Object} model - The database model for user operations
   * @returns {Promise<number>} - Count of documents matching the field value
   *
   * @example
   * ```javascript
   * const { verify } = require('./controller/users/account/utils/verify');
   * const count = await verify('user@example.com', 'username', UserModel);
   * // Returns: 1 if username exists, 0 if it doesn't
   * ```
   */
  verify: async (value, field, model) => {
    return await model.countDocuments({
      [`${field}`]: {
        $exists: true,
        $eq: value,
      },
    });
  },
};
