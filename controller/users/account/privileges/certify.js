/**
 * User certification controller module
 *
 * This module handles certifying users by checking if they have acknowledged
 * and understood the platform's terms and conditions. The certification status
 * is determined by the 'understands' flag in the user's account.
 *
 * Certification is a prerequisite for certain account operations and compliance
 * requirements. Users must be certified before they can perform certain actions
 * on the platform.
 *
 * @module controller/users/account/privileges/certify
 * @exports {Object} User certification functions
 */

module.exports = {
  /**
   * Certifies a user by checking their 'understands' flag
   *
   * This function verifies that a user has acknowledged and understood the
   * platform's terms and conditions by checking if their 'understands' flag
   * is set to true in the database.
   *
   * @param {string} userId - The unique identifier for the user to certify
   * @param {Object} model - The database model for user operations
   * @returns {Promise<boolean>} - True if user is certified, false otherwise
   *
   * @example
   * ```javascript
   * const certifyController = require('./controller/users/account/privileges/certify');
   * const isCertified = await certifyController.certify('user123', UserModel);
   * // Returns: true if user understands terms, false otherwise
   * ```
   */
  certify: async (userId, model) => {
    return Boolean(
      await model.countDocuments({
        _id: {
          $eq: userId,
        },
        understands: {
          $eq: true,
        },
      })
    );
  },
};
