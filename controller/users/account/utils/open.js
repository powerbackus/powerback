/**
 * User account unlocking utility module
 *
 * This module provides functionality to unlock user accounts using join tokens.
 * Unlocking allows previously locked accounts to resume normal operations.
 *
 * @module controller/users/account/utils/open
 * @exports {Object} User account unlocking functions
 */

module.exports = {
  /**
   * Unlocks a user account by clearing the locked flag
   *
   * This function unlocks a user account by finding a user with a specific
   * joinToken value and setting their locked flag to false. Used to restore
   * account access after security issues are resolved.
   *
   * @param {string} sash - The join token value to search for
   * @param {Object} model - The database model for user operations
   * @returns {Promise<Object>} - MongoDB update result
   *
   * @example
   * ```javascript
   * const { open } = require('./controller/users/account/utils/open');
   * await open(joinToken, UserModel);
   * ```
   */
  open: async (sash, model) => {
    const locked = await model.updateOne(
      {
        joinToken: {
          $exists: true,
          $eq: sash,
        },
      },
      {
        $set: {
          locked: false,
        },
      }
    );
    return locked;
  },
};
