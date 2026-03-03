/**
 * User empowerment controller module
 *
 * This module handles empowering users by setting their 'understands' flag to true,
 * indicating they have acknowledged and understood the platform's terms and conditions.
 * This is a prerequisite for certain account operations and compliance requirements.
 *
 * The empower function is typically called after a user has completed onboarding
 * or acknowledged important platform information, allowing them to proceed with
 * full account functionality.
 *
 * @module controller/users/account/privileges/empower
 * @exports {Object} User empowerment functions
 */

const logger = require('../../../../services/utils/logger')(__filename);

module.exports = {
  /**
   * Empowers a user by setting their 'understands' flag to true
   *
   * This function updates the user's account to indicate they have understood
   * and acknowledged the platform's terms, conditions, and compliance requirements.
   * This flag is used as a gate for certain account operations and compliance validation.
   *
   * @param {string} userId - The unique identifier for the user to empower
   * @param {Object} model - The database model for user operations
   * @returns {Promise<Object>} - MongoDB update result
   *
   * @example
   * ```javascript
   * const empowerController = require('./controller/users/account/privileges/empower');
   * await empowerController.empower('user123', UserModel);
   * ```
   */
  empower: (userId, model) => {
    return model
      .updateOne(
        {
          _id: {
            $exists: true,
            $eq: userId,
          },
        },
        {
          $set: {
            understands: true,
          },
        }
      )
      .catch((err) => {
        logger.error('User Controller empower() failed:', err);
      });
  },
};
