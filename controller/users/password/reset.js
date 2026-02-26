/**
 * Password reset controller module
 *
 * This module handles password reset operations when users click reset links
 * from their email. It validates the new password, hashes it securely, updates
 * the user account, invalidates all existing tokens, and sends a confirmation email.
 *
 * The password reset process includes:
 * - Validating the new password is different from the current password
 * - Hashing the new password with bcrypt
 * - Updating the user account with the new password
 * - Incrementing token version to invalidate all existing tokens
 * - Clearing reset password hash fields
 * - Sending confirmation email
 *
 * @module controller/users/password/reset
 * @exports {Object} Password reset functions
 */

const bcrypt = require('bcryptjs');
const { sendEmail } = require('../../comms');
const { SERVER } = require('../../../constants');
const { emails } = require('../../comms/emails');
const logger = require('../../../services/utils/logger')(__filename);

const SALT = Number(process.env.SALT_WORK_FACTOR ?? SERVER.SALT_WORK_FACTOR);

module.exports = {
  /**
   * Resets a user's password using a reset hash
   *
   * This function resets a user's password by validating the new password is
   * different from the current password, hashing it securely, updating the
   * user account, and invalidating all existing tokens. It also sends a
   * confirmation email to notify the user of the password change.
   *
   * @param {Object} req - Express request object
   * @param {string} req.body.givenUsername - The username of the user resetting password
   * @param {string} req.body.newPassword - The new password to set
   * @param {Object} res - Express response object
   * @param {Object} model - The database model for user operations
   * @returns {Promise<void>} - Resolves when password reset is complete
   *
   * @example
   * ```javascript
   * const { reset } = require('./controller/users/password/reset');
   * await reset(req, res, UserModel);
   * ```
   */
  reset: async (req, res, model) => {
    try {
      let password = req.body.newPassword;

      // Generate salt and hash password using async/await
      const salt = await bcrypt.genSalt(SALT);
      const cipher = await bcrypt.hash(password, salt);

      const thisUser = await model.findOne({
        username: req.body.givenUsername,
      });

      if (!thisUser) {
        res.status(404).json('User not found.');
        return;
      }

      // Check if new password is same as current password using bcrypt.compare
      const isSamePassword = await bcrypt.compare(
        req.body.newPassword,
        thisUser.password
      );

      if (isSamePassword) {
        res
          .status(409)
          .json('Please try again with a different password.');
        return;
      }

      // Update the user's password
      await model.updateOne(
        { username: req.body.givenUsername },
        {
          $set: {
            password: cipher,
            tryPasswordAttempts: 0,
            resetPasswordHash: null,
            resetPasswordHashExpires: null,
            resetPasswordHashIssueDate: null,
            lastTimeUpdatedPassword: new Date(),
          },
          $inc: { tokenVersion: 1 },
        }
      );

      // Send success email only after password has been successfully updated
      // Email sending is non-blocking - log errors but don't fail password reset
      sendEmail(
        thisUser.email && thisUser.email !== ''
          ? thisUser.email
          : thisUser.username,
        emails.Reset,
        thisUser.firstName
      ).catch((emailErr) => {
        logger.error('Failed to send password reset email (non-blocking):', {
          username: thisUser.username,
          error: emailErr.message,
        });
      });

      // All existing tokens are invalidated by the token version increment

      res.json('Your password has been successfully reset.');
    } catch (error) {
      logger.error('Password reset error:', error);
      res
        .status(422)
        .json('Server processing error. Please try again later.');
    }
  },
};
