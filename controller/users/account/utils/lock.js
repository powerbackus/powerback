/**
 * User account locking utility module
 *
 * This module provides functionality to lock user accounts based on hash fields.
 * Locked accounts are prevented from performing certain operations and may
 * require administrative intervention to unlock.
 *
 * @module controller/users/account/utils/lock
 * @exports {Object} User account locking functions
 */

module.exports = {
  /**
   * Locks a user account by setting the locked flag
   *
   * This function locks a user account by finding a user with a specific hash
   * field value and setting their locked flag to true. Used for security
   * purposes when suspicious activity is detected.
   *
   * @param {string} field - The hash field name to search for (e.g., 'resetPasswordHash')
   * @param {string} hash - The hash value to match
   * @param {Object} model - The database model for user operations
   * @returns {Promise<Object>} - MongoDB update result
   *
   * @example
   * ```javascript
   * const { lock } = require('./controller/users/account/utils/lock');
   * await lock('resetPasswordHash', hash, UserModel);
   * ```
   */
  lock: async (field, hash, model) => {
    return await model.updateOne(
      {
        [`${field}`]: {
          $exists: true,
          $eq: hash,
        },
      },
      {
        $set: {
          locked: true,
        },
      }
    );
  },
};
