/**
 * User account update controller module
 *
 * This module handles updating user account information in the system.
 * It provides secure update functionality by filtering out sensitive fields
 * that should not be directly updated by the client, such as passwords,
 * tokens, and internal metadata.
 *
 * The update process includes:
 * - Filtering out sensitive fields from client updates
 * - Validating update data
 * - Logging update actions for audit purposes
 * - Returning pruned user data to the client
 *
 * @module controller/users/account/update
 * @exports {Object} User account update functions
 */

const logger = require('../../../services/utils/logger')(__filename);

const { prune } = require('../account/utils/prune');

module.exports = {
  /**
   * Updates user account information with security filtering
   *
   * This function updates a user's account information while filtering out
   * sensitive fields that should not be directly updated by the client.
   * It logs the update action and returns pruned user data.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.params.userId - The unique identifier for the user to update
   * @param {Object} req.body - Update data from the client
   * @param {string} req.ip - Client IP address for logging
   * @param {Object} res - Express response object
   * @param {Object} model - The database model for user operations
   * @returns {Promise<void>} - Resolves when update is complete
   *
   * @example
   * ```javascript
   * const updateController = require('./controller/users/account/update');
   * await updateController.update(req, res, UserModel);
   * ```
   */
  update: (req, res, model) => {
    const {
      _id,
      locked,
      payment,
      password,
      settings,
      username,
      createdAt,
      donations,
      updatedAt,
      compliance,
      understands,
      tokenVersion,
      resetPasswordHash,
      tryPasswordAttempts,
      lastTimeUpdatedPassword,
      resetPasswordHashExpires,
      resetPasswordHashIssueDate,
      ...safeForClientToUpdate
    } = req.body;

    logger.debug('Update request received', {
      hasSettings: !!settings,
      settingsKeys: settings ? Object.keys(settings) : [],
      safeForClientToUpdateKeys: Object.keys(safeForClientToUpdate),
      bodyKeys: Object.keys(req.body),
    });

    // Build update object using $set for proper nested object updates
    const updateObj = { $set: {} };

    // Add non-settings fields to $set
    if (Object.keys(safeForClientToUpdate).length > 0) {
      updateObj.$set = { ...updateObj.$set, ...safeForClientToUpdate };
    }

    // Handle settings separately with $set for proper nested object update
    if (settings) {
      updateObj.$set.settings = settings;
    }

    // Only proceed if there's something to update
    if (Object.keys(updateObj.$set).length === 0) {
      logger.warn('Update request has no fields to update');
      return res
        .status(400)
        .json({ error: { message: 'No fields to update' } });
    }

    logger.debug('Update object', { updateObj });

    model
      .findOneAndUpdate(
        { _id: req.params.userId },
        updateObj, // remove any reset password links if email address is tried to be updated. then send email to OLD email address user letting them know of this change. link inside this email lets them confirm email address change, or to undo the change. this link should be valid for 7 days. https://security.stackexchange.com/questions/184497/should-a-password-reset-link-be-valid-after-changing-email
        {
          useFindAndModify: false,
          new: true, // Return the updated document
        }
      )
      .then((dbModel) => {
        logger.info('Updated user profile', {
          action: 'update_profile',
          userId: req.jwt?.payload?.sub,
          ip: req.ip,
        });

        res.json(prune(dbModel._doc));
      })
      .catch((err) => {
        logger.error('User profile update failed', {
          action: 'update_profile',
          userId: req.jwt?.payload?.sub,
          error: err.message,
          ip: req.ip,
        });

        res.status(422).json(err);
      });
  },
};
