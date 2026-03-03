/**
 * Applicant to user transfer utility module
 *
 * This module handles transferring applicant records to active user accounts.
 * It creates a new user record with default settings and payment configuration
 * when an applicant successfully activates their account.
 *
 * @module controller/users/account/utils/transfer
 * @exports {Object} Applicant transfer functions
 */

const { APP } = require('../../../../constants');

module.exports = {
  /**
   * Transfers an applicant to an active user account
   *
   * This function creates a new user account from an applicant record, setting
   * default application settings and initializing payment configuration. Used
   * during account activation to convert pending applicants to active users.
   *
   * @param {Object} applicant - The applicant document to transfer
   * @param {string} applicant.username - The applicant's username/email
   * @param {string} applicant.password - The applicant's hashed password
   * @param {Object} userModel - The User model for active accounts
   * @returns {Promise<Object>} - Created user document or error
   *
   * @example
   * ```javascript
   * const { transfer } = require('./controller/users/account/utils/transfer');
   * await transfer(applicantDocument, UserModel);
   * ```
   */
  transfer: (applicant, userModel) => {
    return userModel
      .create({
        ...applicant,
        settings: APP.SETTINGS,
        username: applicant.username,
        password: applicant.password,
        payment: {
          customer_id: '',
          payment_method: '',
        },
      })
      .catch((err) => {
        return err;
      });
  },
};
