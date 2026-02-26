/**
 * User account creation controller module
 *
 * This module handles the creation of new user accounts in the system.
 * It generates secure hash tokens for account activation and sends welcome
 * emails to new users with activation links.
 *
 * The account creation process includes:
 * - Setting default application settings
 * - Generating secure activation hashes
 * - Sending welcome emails with activation links
 * - Storing account creation timestamps
 *
 * @module controller/users/account/create
 * @exports {Object} User account creation functions
 */

const { generate } = require('../account/utils/hash'),
  { emails } = require('../../comms/emails'),
  { APP } = require('../../../constants'),
  { sendEmail } = require('../../comms'),
  logger = require('../../../services/utils/logger')(__filename);

module.exports = {
  /**
   * Creates a new user account with activation requirements
   *
   * This function creates a new user account in the database with default
   * settings and generates a secure activation hash. It also sends a welcome
   * email to the user with an activation link that must be clicked to
   * activate the account.
   *
   * @param {Object} newPowerbacker - User account data to create
   * @param {string} newPowerbacker.username - User's email/username
   * @param {string} newPowerbacker.password - User's hashed password
   * @param {Object} model - The database model for user operations
   * @returns {Promise<Object>} - Created user account or error
   *
   * @example
   * ```javascript
   * const createController = require('./controller/users/account/create');
   * const newUser = {
   *   username: 'user@example.com',
   *   password: 'hashedPassword123'
   * };
   * await createController.create(newUser, UserModel);
   * ```
   */
  create: async (newPowerbacker, model) => {
    logger.debug(`Account creation started for: ${newPowerbacker.username}`);
    const hashObj = await generate('join');
    logger.debug(`Hash generated: ${hashObj.hash?.substring(0, 10) || 'N/A'}`);
    try {
      const created = await model.create({
        ...newPowerbacker,
        settings: APP.SETTINGS,
        joinHash: hashObj.hash,
        joinHashExpires: hashObj.expires,
        joinHashIssueDate: hashObj.issueDate,
      });
      if (created) {
        logger.debug(`New user account created: ${created.id}`);
        logger.debug(`Sending email to ${newPowerbacker.username}`);
        const URL_ROOT =
          process.env.ORIGIN ??
          (process.env.NODE_ENV === 'production'
            ? process.env.PROD_URL
            : process.env.DEV_URL);

        try {
          logger.debug(
            `About to call sendEmail - to: ${newPowerbacker.username}, template: ${emails.JoiningUp?.name || 'JoiningUp'}, hash: ${hashObj.hash?.substring(0, 10) || 'N/A'}, URL_ROOT: ${URL_ROOT}`
          );
          logger.debug(
            `sendEmail function type: ${typeof sendEmail}, is function: ${typeof sendEmail === 'function'}`
          );

          await sendEmail(
            newPowerbacker.username,
            emails.JoiningUp,
            hashObj.hash,
            null, // firstName
            URL_ROOT
          );
          logger.info(`Email sent to ${newPowerbacker.username}`);
        } catch (err) {
          logger.warn(
            `Error sending email to ${newPowerbacker.username}: ${err}`
          );
          logger.debug(`Destroying user account ${created.id}`);
          await created.delete().catch((err) => {
            logger.error('Error destroying user account', {
              action: 'delete_new_account_on_email_error',
              userId: created.id,
              error: err.message,
            });
          });
          logger.debug(`User account ${created.id} destroyed`);
          throw err;
        }
      }
    } catch (err) {
      logger.error(
        `Error creating user account ${newPowerbacker.username}: ${err}`
      );
      return err;
    }
  },
};
