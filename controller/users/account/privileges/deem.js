/**
 * User compliance deeming controller module
 *
 * This module handles deeming a user's compliance tier by retrieving their
 * current compliance level from the database. The compliance tier determines
 * the user's donation limits and account privileges according to FEC regulations.
 *
 * Compliance tiers are documented in docs/DONATION_LIMITS.md and include:
 * - Bronze: Basic account with minimal donation limits
 * - Silver: Enhanced account with higher limits (requires address verification)
 * - Gold: Full account with maximum limits (requires employment information)
 *
 * @module controller/users/account/privileges/deem
 * @exports {Object} User compliance deeming functions
 */

const logger = require('../../../../services/utils/logger')(__filename);

module.exports = {
  /**
   * Deems a user's compliance tier by retrieving their current compliance level
   *
   * This function retrieves the user's current compliance tier from the database.
   * If no compliance tier is set, it defaults to 'guest'. The compliance tier
   * determines the user's donation limits and account privileges.
   *
   * @param {string} userId - The unique identifier for the user to deem
   * @param {Object} model - The database model for user operations
   * @returns {Promise<string>} - The user's compliance tier ('guest' or 'compliant')
   *
   * @example
   * ```javascript
   * const deemController = require('./controller/users/account/privileges/deem');
   * const compliance = await deemController.deem('user123', UserModel);
   * // Returns: 'guest' or 'compliant'
   * ```
   */
  deem: async (userId, model) => {
    try {
      return await model
        .findOne({
          _id: userId,
        })
        .then((dbModel) => {
          return dbModel.compliance || 'guest';
        });
    } catch (err) {
      logger.error('Error deeming user:', err.message);
      throw err;
    }
  },
};
