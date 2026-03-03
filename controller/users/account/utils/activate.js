/**
 * User account activation controller module
 *
 * This module handles activating user accounts through email verification links.
 * It validates activation hashes, checks expiration, transfers applicants to active
 * users, and sends confirmation emails.
 *
 * The activation process includes:
 * - Validating the activation hash exists
 * - Checking hash expiration (5 minutes for join hashes)
 * - Transferring applicant to active user model
 * - Cleaning up any existing ex-user records
 * - Sending welcome email
 * - Removing the applicant record
 *
 * @module controller/users/account/utils/activate
 * @exports {Object} User account activation functions
 */

const { emails } = require('../../../comms/emails'),
  { sendEmail } = require('../../../comms');

const { transfer } = require('./transfer');

module.exports = {
  /**
   * Activates a user account using an activation hash
   *
   * This function validates an activation hash from an email link, checks if it's
   * expired, and if valid, transfers the applicant to an active user account.
   * It also cleans up any existing ex-user records and sends a welcome email.
   *
   * @param {string} hash - The activation hash from the email link
   * @param {Object} model - The Applicant model for pending accounts
   * @param {Object} nextModel - The User model for active accounts
   * @param {Object} storageModel - The ExUser model for deleted account records
   * @returns {Promise<Object>} - Confirmation object with activation status
   * @returns {boolean} confirmation.isHashConfirmed - Whether the hash was valid
   * @returns {boolean} confirmation.isLinkExpired - Whether the hash has expired
   *
   * @example
   * ```javascript
   * const { activate } = require('./controller/users/account/utils/activate');
   * const result = await activate(hash, ApplicantModel, UserModel, ExUserModel);
   * // Returns: { isHashConfirmed: true, isLinkExpired: false }
   * ```
   */
  activate: async (hash, model, nextModel, storageModel) => {
    let confirmation = {
      isHashConfirmed: true,
      isLinkExpired: false,
    };
    const userExists = await model.countDocuments({
        joinHash: { $eq: hash },
      }),
      verified = Boolean(userExists);
    if (!verified) return (confirmation.isHashConfirmed = false);
    if (verified) {
      const matchingUser = await model.findOne({
        joinHash: { $eq: hash },
      });

      if (!matchingUser.joinHashExpires) {
        // No expiration date set - invalid state, delete the Applicant
        await matchingUser.deleteOne();
        confirmation.isHashConfirmed = false;
        return confirmation;
      }

      // Check if hash has expired
      if (Date.now() - matchingUser.joinHashExpires.getTime() >= 0) {
        // Hash expired - delete the Applicant to allow retry signup
        await matchingUser.deleteOne();
        confirmation.isHashConfirmed = false;
        confirmation.isLinkExpired = true;
        return confirmation;
      }

      try {
        if (matchingUser.joinHash) {
          const username = matchingUser.username;
          const applicantData = matchingUser.toObject();
          delete applicantData._id;
          delete applicantData.__v;
          // Consume the hash immediately so a second request (e.g. double-click) never sends email
          await matchingUser.deleteOne();
          const createdUser = await transfer(applicantData, nextModel);
          // Only cleanup and send welcome email when we actually created the user.
          // A concurrent second request may get duplicate-key from transfer; skip email then.
          const transferSucceeded =
            createdUser && createdUser._id && !(createdUser instanceof Error);
          if (transferSucceeded) {
            const recordOfExUser = await storageModel.findOne({
              username: { $eq: username },
            });
            if (recordOfExUser) {
              await recordOfExUser.deleteOne();
            }
            await sendEmail(username, emails.JoinedUp, null);
          }
          return confirmation;
        } else {
          confirmation.isHashConfirmed = false;
          return confirmation;
        }
      } catch (err) {
        return err;
      }
    }
  },
};
