/**
 * Email unsubscribe hash management utility module
 *
 * This module manages unsubscribe hashes for users, either retrieving existing
 * valid hashes or generating new ones. Unsubscribe hashes are used in email links
 * to allow users to unsubscribe from specific email topics.
 *
 * @module controller/users/account/utils/unsubscribe/getOrInitiate
 * @exports {Object} Email unsubscribe hash management functions
 */

const logger = require('../../../../../services/utils/logger')(__filename);
const { generate } = require('../hash');

module.exports = {
  /**
   * Gets an existing valid unsubscribe hash or generates a new one
   *
   * This function checks if a user has a valid unsubscribe hash that won't expire
   * for at least 24 hours. If not, it generates a new hash with a 30-day expiration
   * and stores it in the user's account. Used to provide unsubscribe links in emails.
   *
   * @param {Object} user - The user document
   * @param {string} user._id - The user's unique identifier
   * @param {string} user.unsubscribeHash - Existing unsubscribe hash (optional)
   * @param {number} user.unsubscribeHashExpires - Hash expiration timestamp (optional)
   * @param {Object} model - The database model for user operations
   * @returns {Promise<string>} - The unsubscribe hash to use in email links
   *
   * @example
   * ```javascript
   * const { getOrInitiate } = require('./controller/users/account/utils/unsubscribe/getOrInitiate');
   * const hash = await getOrInitiate(userDocument, UserModel);
   * // Returns: existing hash if valid, or newly generated hash
   * ```
   */
  getOrInitiate: async (user, model) => {
    // Check if existing hash is valid for at least another 24 hours (buffer)
    if (
      user.unsubscribeHash &&
      user.unsubscribeHashExpires &&
      user.unsubscribeHashExpires > Date.now() + 86400000
    ) {
      logger.debug('Valid unsubscribe hash found', {
        hash: user.unsubscribeHash,
      });
      return user.unsubscribeHash;
    }

    // Generate new hash
    const hashObj = await generate('unsubscribe');
    logger.debug('Generating new unsubscribe hash', { hash: hashObj.hash });
    await model.updateOne(
      { _id: user._id },
      {
        $set: {
          unsubscribeHash: hashObj.hash,
          unsubscribeHashIssueDate: hashObj.issueDate,
          unsubscribeHashExpires: hashObj.expires,
        },
      }
    );
    logger.debug('Unsubscribe hash updated', { hash: hashObj.hash });
    return hashObj.hash;
  },
};
