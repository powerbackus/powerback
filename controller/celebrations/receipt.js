/**
 * @fileoverview Celebration Receipt Controller
 *
 * This controller handles the generation and sending of receipt emails for
 * celebration donations. It enriches celebration data with related information
 * (politician, bill, donor) and sends personalized receipt emails to donors.
 * Supports different email templates for first-time vs returning users.
 *
 * BUSINESS LOGIC
 *
 * RECEIPT GENERATION PROCESS
 * 1. Calculates donation ordinal (position in user's donation sequence)
 * 2. Looks up politician data (donee)
 * 3. Retrieves donor information (prefers captured donorInfo, falls back to current)
 * 4. Looks up bill data
 * 5. Enriches celebration object with related data
 * 6. Sends personalized receipt email
 *
 * DONOR INFORMATION PRIORITY
 * - Prefers celebration.donorInfo (immutable snapshot at donation time)
 * - Falls back to current user data if donorInfo not available
 * - Ensures FEC compliance by using captured information
 *
 * EMAIL TEMPLATES
 * - 'New': Welcome email for user's first celebration
 * - 'Receipt': Standard receipt email for subsequent celebrations
 * - Templates include FEC compliance disclaimers
 *
 * DEPENDENCIES
 * - controller/congress: Bill and politician lookups
 * - controller/comms/emails: Email templates
 * - controller/comms: Email sending
 * - controller/users: User contact information
 * - controller/celebrations/count: Donation ordinal calculation
 * - services/utils/logger: Logging
 *
 * @module controller/celebrations/receipt
 * @requires ../congress
 * @requires ../comms/emails
 * @requires ../comms
 * @requires ../users
 * @requires ./count
 * @requires ../../services/utils/logger
 */

const logger = require('../../services/utils/logger')(__filename);

const { lookupBill, lookupPol } = require('../congress'),
  { emails } = require('../comms/emails'),
  { sendEmail } = require('../comms'),
  { contact } = require('../users'),
  { count } = require('./count');

module.exports = {
  /**
   * Sends a receipt email for a completed celebration donation
   *
   * This function processes a celebration record by:
   * 1. Calculating the donation ordinal (position in sequence)
   * 2. Looking up related data (politician, donor, bill information)
   * 3. Enriching the celebration object with this data
   * 4. Sending a personalized receipt email to the donor
   *
   * @async
   * @function receipt
   * @param {Object} celebration - The celebration record containing donation details
   * @param {string} celebration.pol_id - ID of the politician receiving the donation
   * @param {string} celebration.bill_id - ID of the bill associated with the donation
   * @param {ObjectId} celebration.donatedBy - MongoDB ObjectId of the donor user
   * @param {number} [celebration.ordinal] - Will be set to the donation sequence number
   * @param {Object} [celebration.donee] - Will be populated with full politician object
   * @param {Object} [celebration.bill] - Will be populated with bill data
   * @param {Object} userModel - Database model for user operations
   * @param {Object} polModel - Database model for politician operations
   * @param {string} [emailTemplate='Receipt'] - Email template to use ('New' for first-time users, 'Receipt' for returning users)
   * @returns {Promise<void>} Resolves when email is sent successfully
   *
   * @throws {Error} If any database lookup fails
   * @throws {Error} If email sending fails
   *
   * @example
   * ```javascript
   * const celebration = {
   *   pol_id: 'A000055',
   *   bill_id: 'hr1234-118',
   *   donatedBy: ObjectId('507f1f77bcf86cd799439011') // MongoDB ObjectId
   * };
   *
   * await receipt(celebration, UserModel, PolModel, 'New');
   * // Sends welcome email for first-time users
   * ```
   */
  receipt: async (
    celebration,
    userModel,
    polModel,
    emailTemplate = 'Receipt'
  ) => {
    // Calculate donation ordinal (position in sequence)
    celebration.ordinal = await count(celebration);

    // Look up related data in parallel for efficiency
    let donee, donor, bill;
    try {
      donee = await lookupPol(celebration.pol_id, polModel);

      // Use captured donor information if available, otherwise look up current user info
      if (celebration.donorInfo) {
        donor = celebration.donorInfo;
        logger.debug('Using captured donor information for receipt');
      } else {
        donor = await contact(celebration.donatedBy, userModel);
        logger.debug('Using current user information for receipt (fallback)');
      }

      bill = await lookupBill(celebration.bill_id);
    } catch (err) {
      logger.error('Error looking up bill:', err.message);
      throw err; // Re-throw to prevent continuing with undefined variables
    }

    // Enrich celebration object with related data
    celebration.donee = donee;
    celebration.bill = bill;

    // Send personalized receipt email using captured or current donor information
    const recipientEmail = donor.email || donor.username || '';
    const recipientName = donor.firstName || 'Powered Citizen';

    // Validate that we have a recipient email before sending
    if (!recipientEmail) {
      logger.warn('No recipient email found for celebration receipt', {
        donorInfo: !!celebration.donorInfo,
        celebrationId: celebration._id,
        hasUsername: !!donor.username,
        hasEmail: !!donor.email,
      });
      throw new Error('No recipient email available for receipt');
    }

    // Select the appropriate email template
    const emailTemplateFunction = emails[emailTemplate] ?? emails.Receipt;

    logger.info('Sending celebration email:', {
      emailTemplate: emailTemplate,
      recipientEmail: recipientEmail,
      recipientName: recipientName,
      celebrationId: celebration._id,
    });

    await sendEmail(
      recipientEmail,
      emailTemplateFunction,
      celebration,
      recipientName
    );
  },
};
