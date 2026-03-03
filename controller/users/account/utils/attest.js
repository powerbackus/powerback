/**
 * User attestation utility module
 *
 * This module provides functionality to verify that a user has a specific field
 * value combination. It's used for validating user properties and field values
 * in database queries.
 *
 * @module controller/users/account/utils/attest
 * @exports {Object} User attestation functions
 */

module.exports = {
  /**
   * Attests that a user has a specific field-value combination
   *
   * This function checks if a user document exists with both a specific user
   * property value and a specific field value. Used for validating user
   * attributes and field combinations.
   *
   * @param {string} userPropKey - The user property key to check (e.g., 'username', 'email')
   * @param {string} userPropValue - The expected value for the user property
   * @param {string} field - The field name to check
   * @param {*} value - The expected value for the field
   * @param {Object} model - The database model for user operations
   * @returns {Promise<boolean>} - True if user exists with both property and field values
   *
   * @example
   * ```javascript
   * const { attest } = require('./controller/users/account/utils/attest');
   * const hasValue = await attest('username', 'user@example.com', 'compliance', 'compliant', UserModel);
   * // Returns: true if user exists with username='user@example.com' AND compliance='compliant'
   * ```
   */
  attest: async (userPropKey, userPropValue, field, value, model) => {
    const attested = await model.countDocuments({
      [`${userPropKey}`]: {
        $exists: true,
        $eq: userPropValue,
      },
      [`${field}`]: {
        $eq: value,
      },
    });
    return Boolean(attested);
  },
};
