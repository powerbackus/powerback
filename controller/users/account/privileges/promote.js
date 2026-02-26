/**
 * @fileoverview User Compliance Promotion Controller
 *
 * This controller handles upgrading user compliance levels based on form
 * completion according to FEC regulations. It determines the appropriate
 * compliance tier (guest or compliant) based on profile information provided
 * and updates the user's account accordingly.
 *
 * COMPLIANCE TIER DETERMINATION
 *
 * GUEST TIER
 * - Default tier for all new accounts
 * - No additional information required
 * - Limits: $50 per donation, $200 annual cap
 *
 * COMPLIANT TIER
 * - Requires: Full name (first + last), valid zip code (5+ digits),
 *   city, state, address, either US citizenship or passport, AND employment information
 *   - If not employed: no additional info needed
 *   - If employed: both occupation and employer must be provided
 * - Limits: $3,500 per candidate per election
 *
 * BUSINESS LOGIC
 *
 * PROMOTION RULES
 * - Compliance can only increase (guest → compliant)
 * - Promotion based solely on form completion (not donation history)
 * - Only updates if compliance level actually changes
 *
 * EMAIL NOTIFICATION
 * - Sends promotion confirmation email when tier changes
 * - Email sending is non-blocking (errors logged but don't fail promotion)
 * - Uses Promoted email template
 *
 * DEPENDENCIES
 * - controller/comms: Email sending
 * - controller/comms/emails: Email templates
 * - constants/FEC: FEC compliance tier definitions and limits
 * - services/utils/logger: Logging
 *
 * @module controller/users/account/privileges/promote
 * @requires ../../../comms
 * @requires ../../../comms/emails
 * @requires ../../../../constants
 * @requires ../../../../services/utils/logger
 */

const { sendEmail } = require('../../../comms'),
  { emails } = require('../../../comms/emails'),
  logger = require('../../../../services/utils/logger')(__filename);
module.exports = {
  /**
   * Promotes a user to the appropriate compliance level based on their form completion.
   * Updates the user's compliance status in the database and sends a confirmation email.
   *
   *
   * @param {string} userId - The unique identifier for the user to promote
   * @param {Object} model - The database model for user operations
   * @returns {Promise<void>} - Resolves when promotion is complete
   *
   * @example
   * ```javascript
   * const promoteController = require('./controller/users/account/privileges/promote');
   * await promoteController.promote('user123', UserModel);
   * ```
   */
  promote: (userId, model) => {
    return new Promise((resolve, reject) => {
      model
        .findById(userId)
        .then((dbModel) => {
          // Check if user exists
          if (!dbModel) {
            logger.error('User not found for promotion', { userId });
            reject(new Error('User not found'));
            return;
          }

          /**
           * Determines the appropriate compliance level for a user based on
           * their form completion status according to FEC regulations.
           *
           * This function implements the exact same logic as the frontend useFormCompliance hook
           * to ensure consistency between client and server validation.
           *
           * Compliance levels are determined by form completion only:
           * - Guest: Basic account (no additional info required)
           * - Compliant: Name, address, valid zip code, and employment information provided
           *
           * @returns {string} The compliance level: 'guest' or 'compliant'
           */
          function determineCompliance() {
            // Check if user has provided both first and last name
            const userGaveFullName =
              dbModel.lastName !== '' && dbModel.firstName !== '';

            // Check if employment information is complete:
            // - If not employed: no additional info needed
            // - If employed: both occupation and employer must be provided
            const userGaveEmploymentInfo =
              !dbModel.isEmployed ||
              (dbModel.occupation !== '' && dbModel.employer !== '');

            // Check if user meets compliant tier requirements:
            // - Valid zip code (5+ digits)
            // - City, state, and address provided
            // - Either US citizen (country === 'United States') or passport provided
            // - Full name provided
            // - Employment information complete
            const isCompliant =
              dbModel.zip?.length >= 5 &&
              dbModel.city !== '' &&
              dbModel.state !== '' &&
              dbModel.address !== '' &&
              (dbModel.country === 'United States' ||
                dbModel.passport !== '') &&
              userGaveFullName &&
              userGaveEmploymentInfo;

            // Determine compliance based on requirements
            if (isCompliant) return 'compliant';
            return 'guest';
          }

          const compliance = determineCompliance();

          // Only update if the compliance level has changed
          if (dbModel.compliance === compliance) {
            logger.info('User compliance unchanged', {
              userId: userId,
              currentCompliance: dbModel.compliance,
              calculatedCompliance: compliance,
            });
            resolve({ compliance: dbModel.compliance, updated: false });
            return;
          } else {
            // Update user's compliance level in database
            model
              .findOneAndUpdate(
                { _id: userId },
                { compliance: compliance },
                { useFindAndModify: false }
              )
              .then((updatedModel) => {
                // Send confirmation email to user with compliance tier information
                // Email sending is non-blocking - log errors but don't fail promotion
                sendEmail(
                  updatedModel.email.length
                    ? updatedModel.email
                    : updatedModel.username,
                  emails.Promoted,
                  updatedModel.firstName,
                  compliance
                ).catch((emailErr) => {
                  logger.error(
                    'Failed to send promotion email (non-blocking):',
                    {
                      userId: userId,
                      email: updatedModel.email || updatedModel.username,
                      error: emailErr.message,
                    }
                  );
                });
                resolve({ compliance: compliance, updated: true });
              })
              .catch((updateErr) => {
                logger.error('Database update failed:', updateErr);
                reject(updateErr);
              });
          }
        })
        .catch((err) => {
          logger.error('User Controller promote() failed:', err);
          reject(err);
        });
    });
  },
};
