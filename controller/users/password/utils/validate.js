/**
 * Password reset validation utility module
 *
 * This module validates password reset attempts by checking reset hashes,
 * verifying usernames, tracking attempt counts, and locking accounts after
 * too many failed attempts. Used to secure the password reset process.
 *
 * The validation process includes:
 * - Verifying the reset hash exists and account is not locked
 * - Incrementing attempt counter
 * - Validating username matches
 * - Locking account after 2 failed attempts
 * - Sending lock notification email
 *
 * @module controller/users/password/utils/validate
 * @exports {Object} Password reset validation functions
 */

const { lock } = require('../../account/utils');
const { sendEmail } = require('../../../comms');
const { emails } = require('../../../comms/emails');
const { invalidate } = require('./invalidate');
const { increment } = require('./increment');

module.exports = {
  /**
   * Validates a password reset attempt
   *
   * This function validates password reset attempts by checking if the reset hash
   * exists, verifying the account is not locked, incrementing attempt counters,
   * and validating the username matches. If too many attempts fail, it locks
   * the account and sends a notification email.
   *
   * @param {Object} params - Validation parameters
   * @param {string} params.hash - The password reset hash to validate
   * @param {Object} params.model - The database model for user operations
   * @param {string} params.emailTemplate - Email template for lock notifications (unused)
   * @param {string} params.givenUsername - The username provided by the user
   * @returns {Promise<boolean|number>} - True if valid, attempt count if invalid, undefined if hash not found
   *
   * @example
   * ```javascript
   * const { validate } = require('./controller/users/password/utils/validate');
   * const result = await validate({ hash, model, emailTemplate, givenUsername });
   * // Returns: true if valid, attempt count if invalid
   * ```
   */
  validate: async ({ hash, model, emailTemplate, givenUsername }) => {
    let matchingUser = await model.findOne({ resetPasswordHash: hash });
    if (matchingUser === null) return;
    if (matchingUser.locked) return; // define ?
    await increment(matchingUser, 'tryPasswordAttempts', model);
    if (matchingUser.username === givenUsername) {
      return true;
    } else if (matchingUser.tryPasswordAttempts >= 2) {
      const locked = await lock('resetPasswordHash', hash, model);
      if (locked.ok)
        sendEmail(
          matchingUser.email && matchingUser.email !== ''
            ? matchingUser.email
            : matchingUser.username,
          emails.Locked,
          null // firstName
        );
      await invalidate(hash, model);
    }
    return matchingUser.tryPasswordAttempts + 1;
  },
};
