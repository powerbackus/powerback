/**
 * Password reset request controller module
 *
 * This module handles password reset requests initiated by users who have
 * forgotten their passwords. It generates secure reset hashes, stores them
 * in the user account, and sends password reset emails with reset links.
 *
 * The password reset process includes:
 * - Verifying the email/username exists
 * - Generating a secure reset hash with expiration
 * - Storing the hash in the user account
 * - Sending a password reset email with the reset link
 *
 * @module controller/users/password/forgot
 * @exports {Object} Password reset request functions
 */

const { sendEmail } = require('../../comms/');
const { emails } = require('../../comms/emails');
const { verify, generate } = require('../account');

module.exports = {
  /**
   * Initiates a password reset request for a user
   *
   * This function handles password reset requests by verifying the email/username
   * exists, generating a secure reset hash with expiration, storing it in the
   * user account, and sending a password reset email with the reset link.
   *
   * @param {string} email - The email address or username to reset password for
   * @param {Object} model - The database model for user operations
   * @returns {Promise<void>} - Resolves when reset request is processed
   *
   * @example
   * ```javascript
   * const { forgot } = require('./controller/users/password/forgot');
   * await forgot('user@example.com', UserModel);
   * ```
   */
  forgot: async (email, model) => {
    let verification = await verify(email, 'email', model);
    if (!verification) {
      verification = await verify(email, 'username', model);
    }
    if (!verification) {
      return;
    } else {
      const hashObj = await generate();
      if (!hashObj || hashObj === 'undefined') {
        return;
      } else {
        const matchingUser = await model.findOneAndUpdate(
          {
            $or: [{ username: { $eq: email } }, { email: { $eq: email } }],
          },
          {
            resetPasswordHash: hashObj.hash,
            resetPasswordHashExpires: hashObj.expires,
            resetPasswordHashIssueDate: hashObj.issueDate,
          },
          {
            useFindAndModify: false,
          }
        );

        if (matchingUser) {
          // put something here to send a DIFFERENT email to locked accounts
          const URI_ROOT =
            process.env.NODE_ENV === 'production'
              ? process.env.PROD_URL
              : process.env.DEV_URL;

          sendEmail(
            email,
            emails.Forgot,
            hashObj.hash,
            null, // firstName
            URI_ROOT
          );
        }
      }
    }
  },
};
