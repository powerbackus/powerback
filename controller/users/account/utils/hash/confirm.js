/**
 * Password reset hash confirmation utility module
 *
 * This module handles confirming password reset hashes from email links.
 * It validates the hash exists, checks expiration, and provides confirmation
 * status for password reset operations.
 *
 * @module controller/users/account/utils/hash/confirm
 * @exports {Object} Password reset hash confirmation functions
 */

const { invalidate } = require('../../../password/utils/invalidate');

module.exports = {
  /**
   * Confirms a password reset hash and checks expiration
   *
   * This function validates that a password reset hash exists in the database
   * and checks if it has expired. Used to verify password reset links before
   * allowing users to reset their passwords.
   *
   * @param {string} hash - The password reset hash from the email link
   * @param {Object} model - The database model for user operations
   * @returns {Promise<Object>} - Confirmation object with validation status
   * @returns {boolean} confirmation.isHashConfirmed - Whether the hash was found
   * @returns {boolean} confirmation.isLinkExpired - Whether the hash has expired
   *
   * @example
   * ```javascript
   * const { confirm } = require('./controller/users/account/utils/hash/confirm');
   * const result = await confirm(hash, UserModel);
   * // Returns: { isHashConfirmed: true, isLinkExpired: false }
   * ```
   */
  confirm: async (hash, model) => {
    let confirmation = {
      // firstName: '',
      isHashConfirmed: true,
      isLinkExpired: false,
    };
    const userExists = await model.countDocuments({
      resetPasswordHash: { $eq: hash },
    });

    const verified = Boolean(userExists);

    if (!verified) return;
    if (verified) {
      const matchingUser = await model.findOne({
        resetPasswordHash: { $eq: hash },
      });
      if (!matchingUser.resetPasswordHashExpires) return;
      else if (
        Date.now() - matchingUser.resetPasswordHashExpires.getTime() >=
        0
      )
        confirmation.isLinkExpired = true;
    } else {
      await invalidate(hash, model);
      confirmation.isHashConfirmed = false;
    }
    return confirmation;
  },
};
