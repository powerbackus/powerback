/**
 * Email unsubscribe hash verification utility module
 *
 * This module provides functionality to verify unsubscribe hashes from email links.
 * It checks if the hash exists, validates expiration, and returns user information
 * needed for the unsubscribe process.
 *
 * @module controller/users/account/utils/unsubscribe/verify
 * @exports {Object} Email unsubscribe hash verification functions
 */

const logger = require('../../../../../services/utils/logger')(__filename);

module.exports = {
  /**
   * Verifies an unsubscribe hash and returns user information
   *
   * This function validates an unsubscribe hash from an email link, checks if
   * it has expired, and returns the user information needed for the unsubscribe
   * process. Used to verify unsubscribe links before processing unsubscribe requests.
   *
   * @param {string} hash - The unsubscribe hash from the email link
   * @param {Object} model - The database model for user operations
   * @returns {Promise<Object>} - Verification result with validity and user info
   * @returns {boolean} result.isValid - Whether the hash is valid and not expired
   * @returns {boolean} result.isExpired - Whether the hash has expired
   * @returns {Object} result.user - User information if hash is valid (optional)
   *
   * @example
   * ```javascript
   * const { verify } = require('./controller/users/account/utils/unsubscribe/verify');
   * const result = await verify(hash, UserModel);
   * // Returns: { isValid: true, isExpired: false, user: {...} }
   * ```
   */
  verify: async (hash, model) => {
    logger.debug('verify entry', { hash });
    const user = await model.findOne({ unsubscribeHash: hash });

    if (!user) {
      return { isValid: false, isExpired: false };
    }

    if (user.unsubscribeHashExpires < Date.now()) {
      return { isValid: false, isExpired: true };
    }

    return {
      isValid: true,
      isExpired: false,
      user: {
        _id: user._id,
        username: user.username,
        settings: user.settings,
      },
    };
  },
};
