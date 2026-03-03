/**
 * User account removal controller module
 *
 * This module handles the secure deletion of user accounts from the system.
 * It creates a backup record in a separate collection before permanently
 * removing the user's account data and sends a confirmation email.
 *
 * The account removal process includes:
 * - Creating a backup record with user data
 * - Permanently deleting the user account
 * - Sending confirmation email to the user
 * - Logging the deletion action for audit purposes
 *
 * @module controller/users/account/remove
 * @exports {Object} User account removal functions
 */

// ./users/account/remove.js

const { sendEmail } = require('../../comms'),
  { emails } = require('../../comms/emails'),
  logger = require('../../../services/utils/logger')(__filename);

module.exports = {
  /**
   * Removes a user account with backup and confirmation
   *
   * This function securely removes a user account by first creating a backup
   * record in a separate collection, then permanently deleting the account.
   * It sends a confirmation email to the user and logs the action for audit
   * purposes.
   *
   * @param {Object} req - Express request object
   * @param {string} req.params.userId - The unique identifier for the user to remove
   * @param {string} req.ip - Client IP address for logging
   * @param {Object} res - Express response object
   * @param {Object} model - The database model for user operations
   * @param {Object} nextModel - The backup database model for storing deleted user data
   * @returns {Promise<void>} - Resolves when account removal is complete
   *
   * @example
   * ```javascript
   * const removeController = require('./controller/users/account/remove');
   * await removeController.remove(req, res, UserModel, DeletedUserModel);
   * ```
   */
  remove: async (req, res, model, nextModel) => {
    const userId = req.params.userId;
    const deletedUser = await model.findOne({ _id: { $eq: userId } });
    await nextModel.create({
      ...deletedUser,
      username: deletedUser.username,
      exId: userId,
    });
    const deleted = await deletedUser.delete().catch((err) => {
      logger.error('Failed to delete user account', {
        userId: userId,
        action: 'delete_account',
        error: err.message,
        ip: req.ip,
      });
      res.status(422).json(err);
    });
    if (deleted) {
      logger.info('Deleted user account', {
        userId: userId,
        action: 'delete_account',
        ip: req.ip,
      });
      sendEmail(
        deletedUser.email ? deletedUser.email : deletedUser.username,
        emails.Quitter,
        deletedUser.firstName ? deletedUser.firstName : null
      );
    }
  },
};
