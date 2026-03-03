/**
 * User contact information controller module
 *
 * This module handles retrieving user contact information from the database.
 * It provides a secure way to access user data by pruning sensitive information
 * before returning the contact details to the client.
 *
 * The contact function is used to retrieve user profile information for display
 * in account management interfaces, ensuring that sensitive data like passwords
 * and tokens are not exposed to the client.
 *
 * @module controller/users/account/contact
 * @exports {Object} User contact information functions
 */

const logger = require('../../../services/utils/logger')(__filename),
  { prune } = require('./utils');

module.exports = {
  /**
   * Retrieves user contact information with sensitive data pruned
   *
   * This function fetches a user's account information from the database and
   * removes sensitive fields like passwords, tokens, and internal metadata
   * before returning the data to the client.
   *
   * @param {string} userId - The unique identifier for the user
   * @param {Object} model - The database model for user operations
   * @returns {Promise<Object>} - Pruned user contact information
   *
   * @example
   * ```javascript
   * const contactController = require('./controller/users/account/contact');
   * const userInfo = await contactController.contact('user123', UserModel);
   * // Returns user data with sensitive fields removed
   * ```
   */
  contact: (userId, model) => {
    const contact = model
      .findOne({ _id: userId })
      .then((dbModel) => {
        const data = dbModel;
        return data;
      })
      .then((data) => {
        return prune(data._doc);
      })
      .catch((err) => logger.error('Failed to retrieve user data:', err));
    return contact;
  },
};
