/**
 * Email unsubscribe confirmation utility module
 *
 * This module handles confirming email unsubscribe requests from email links.
 * It validates unsubscribe hashes, adds topics to the user's unsubscribed list,
 * and clears the unsubscribe hash fields after successful confirmation.
 *
 * @module controller/users/account/utils/unsubscribe/confirm
 * @exports {Object} Email unsubscribe confirmation functions
 */

const logger = require('../../../../../services/utils/logger')(__filename);
const { verify } = require('./verify');

module.exports = {
  /**
   * Confirms an email unsubscribe request
   *
   * This function validates an unsubscribe hash from an email link, verifies
   * it hasn't expired, and adds the specified topic to the user's unsubscribed
   * list. It also clears the unsubscribe hash fields after successful confirmation.
   *
   * @param {string} hash - The unsubscribe hash from the email link
   * @param {string} topic - The email topic to unsubscribe from
   * @param {Object} model - The database model for user operations
   * @returns {Promise<boolean>} - True if unsubscribe was successful
   * @throws {Error} If hash is invalid or expired
   *
   * @example
   * ```javascript
   * const { confirm } = require('./controller/users/account/utils/unsubscribe/confirm');
   * await confirm(hash, 'alerts', UserModel);
   * ```
   */
  confirm: async (hash, topic, model) => {
    logger.debug('confirm entry', { hash, topic });
    const { isValid, user } = await verify(hash, model);
    logger.debug('verify result', { isValid, user });

    if (!isValid || !user) {
      throw new Error('Invalid or expired unsubscribe link');
    }

    // Add topic to unsubscribedFrom if not already present
    // Clear unsubscribe hash fields after successful unsubscribe
    const updateResult = await model.updateOne(
      { _id: user._id },
      {
        $addToSet: {
          'settings.unsubscribedFrom': topic,
        },
        $set: {
          unsubscribeHash: null,
          unsubscribeHashExpires: null,
          unsubscribeHashIssueDate: null,
        },
      }
    );

    return updateResult;
  },
};
