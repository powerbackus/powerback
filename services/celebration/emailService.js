/**
 * @fileoverview Celebration Email Service
 *
 * This service handles all email notifications related to celebrations,
 * including receipt emails, PAC limit notifications, and celebration status
 * updates. It respects user email preferences and unsubscribe settings.
 *
 * KEY FUNCTIONS
 *
 * sendPACLimitEmail(userId, newTotal, pacLimit)
 * - Sends email notification when user reaches PAC tip limit ($5,000)
 * - Uses PacLimitReached email template
 * - Falls back to username if email not provided
 * - Logs email sending for monitoring
 *
 * sendReceiptEmail(celebration, userModel, polModel, emailTemplate)
 * - Sends celebration receipt email using specified template
 * - Templates: 'New' (first celebration) or 'Receipt' (subsequent)
 * - Delegates to celebration receipt controller
 * - Handles errors gracefully
 *
 * handleCelebrationEmail(celebration, userId, celebrations, userModel, polModel)
 * - Main function for handling celebration-related emails
 * - Checks user email receipt preferences
 * - Determines appropriate template (New vs Receipt)
 * - Only sends if email receipts are enabled in user settings
 *
 * BUSINESS LOGIC
 *
 * EMAIL PREFERENCES
 * - Respects user.settings.emailReceipts flag
 * - Only sends emails if user has enabled email receipts
 * - Logs when emails are skipped due to preferences
 *
 * TEMPLATE SELECTION
 * - 'New' template: Used for user's first celebration
 * - 'Receipt' template: Used for subsequent celebrations
 * - Determined by checking if user has existing celebrations
 *
 * EMAIL ADDRESS RESOLUTION
 * - Prefers user.email if provided and not empty
 * - Falls back to user.username (which is always an email)
 * - Logs warning if no email address found
 *
 * ERROR HANDLING
 * - Email failures don't block celebration creation
 * - Errors are logged but don't throw (except PAC limit email)
 * - PAC limit email errors are thrown to surface critical issues
 *
 * DEPENDENCIES
 * - models/User: User data access
 * - controller/comms/emails: Email templates
 * - controller/comms/sendEmail: Email sending function
 * - controller/celebrations/receipt: Receipt generation
 * - controller/users: User settings access
 *
 * @module services/celebration/emailService
 * @requires ../../models
 * @requires ../../controller/comms/emails
 * @requires ../../controller/comms/sendEmail
 * @requires ../../controller/celebrations/receipt
 * @requires ../../controller/users
 * @requires ../utils/logger
 */

const { User } = require('../../models');
const { emails } = require('../../controller/comms/emails');
const { sendEmail } = require('../../controller/comms/sendEmail');
const logger = require('../utils/logger')(__filename);

/**
 * Sends PAC limit reached email notification
 * @param {string} userId - User ID
 * @param {number} newTotal - New total tip amount
 * @param {number} pacLimit - PAC limit amount
 * @returns {Promise<void>}
 */
async function sendPACLimitEmail(userId, newTotal, pacLimit) {
  try {
    logger.debug('Starting PAC limit email process', {
      userId: userId,
    });

    const user = await User.findById(userId);

    // Use email if provided, otherwise fall back to username (which is always an email)
    const emailAddress =
      user?.email && user.email.trim() !== ''
        ? user.email
        : user?.username;

    if (user && emailAddress) {
      logger.debug('Calling sendEmail for PAC limit', {
        email: emailAddress,
        template: 'PacLimitReached',
        firstName: user.firstName ?? 'Powerbacker',
      });

      await sendEmail(
        emailAddress,
        emails.PacLimitReached,
        user.firstName ?? 'Powerbacker',
        newTotal,
        pacLimit
      );

      logger.debug('PAC limit reached email sent', {
        userId: userId,
        email: emailAddress,
        totalTips: newTotal,
      });
    } else {
      logger.warn('PAC limit reached but no user email found', {
        userId: userId,
        user: user ? 'found' : 'not found',
        email: user?.email ?? 'no email',
      });
    }
  } catch (emailError) {
    logger.error('Failed to send PAC limit reached email:', {
      error: emailError.message,
      stack: emailError.stack,
      userId: userId,
    });
    // Don't fail the celebration creation if email fails
    throw emailError;
  }
}

/**
 * Sends celebration receipt email with appropriate template
 * @param {Object} celebration - Celebration object
 * @param {Object} userModel - User model
 * @param {Object} polModel - Politician model
 * @param {string} emailTemplate - Template to use ('New' or 'Receipt')
 * @returns {Promise<void>}
 */
async function sendReceiptEmail(
  celebration,
  userModel,
  polModel,
  emailTemplate = 'Receipt'
) {
  const { receipt } = require('../../controller/celebrations/receipt');

  try {
    await receipt(celebration, userModel, polModel, emailTemplate);
  } catch (error) {
    logger.error('Failed to send celebration receipt email:', {
      error: error.message,
      stack: error.stack,
      celebrationId: celebration._id,
      emailTemplate: emailTemplate,
    });
    throw error;
  }
}

/**
 * Checks if user has email receipts enabled and sends appropriate email
 * @param {Object} celebration - Celebration object
 * @param {string} userId - User ID
 * @param {Array} celebrations - User's existing celebrations
 * @param {Object} userModel - User model
 * @param {Object} polModel - Politician model
 * @returns {Promise<void>}
 */
async function handleCelebrationEmail(
  celebration,
  userId,
  celebrations,
  userModel,
  polModel
) {
  try {
    // Get user settings to check if email receipts are enabled
    const UserController = require('../../controller/users');
    const {
      settings: { autoTweet, showToolTips, ...autoEmailsOn },
    } = (await UserController.contact(userId, userModel)) ?? {};

    if (autoEmailsOn.emailReceipts) {
      // Convert to plain object with all fields if it's a Mongoose document
      const celebrationForEmail = celebration.toObject
        ? celebration.toObject() ?? {}
        : celebration;

      // Check if this is the user's first celebration
      const isFirstCelebration = celebrations && celebrations.length === 0;
      const emailTemplate = isFirstCelebration ? 'New' : 'Receipt';

      await sendReceiptEmail(
        celebrationForEmail,
        userModel,
        polModel,
        emailTemplate
      );
    } else {
      logger.warn('Email receipts disabled for user', {
        userId: userId,
      });
    }
  } catch (error) {
    logger.error('Failed to handle celebration email:', {
      error: error.message,
      stack: error.stack,
      userId: userId,
      celebrationId: celebration._id,
    });
    // Don't fail the celebration creation if email fails
  }
}

module.exports = {
  handleCelebrationEmail,
  sendPACLimitEmail,
  sendReceiptEmail,
};
