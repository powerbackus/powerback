/**
 * @fileoverview Defunct Celebration Watcher Job
 *
 * This background job monitors Congressional session status and automatically
 * converts active Celebrations to defunct status when sessions end. It also
 * sends warning emails during the warning period to notify users that their
 * celebrations may become defunct soon.
 *
 * KEY FEATURES
 *
 * SESSION MONITORING
 * - Checks current Congressional session status
 * - Detects when sessions end
 * - Logs session status for monitoring
 *
 * DEFUNCT CONVERSION
 * - Converts active celebrations to defunct when sessions end
 * - Updates celebration status via StatusService
 * - Sends notification emails to affected users
 *
 * WARNING EMAILS
 * - Sends warning emails during warning period
 * - Notifies users that celebrations may become defunct
 * - Gives users time to understand what's happening
 *
 * MANUAL TRIGGERS
 * - manualTrigger: For testing or immediate execution
 * - forceConversion: Force all active celebrations to defunct
 * - forceWarningEmails: Force sending of warning emails
 *
 * BUSINESS LOGIC
 *
 * CONVERSION PROCESS
 * - Checks if session has ended
 * - Finds all active celebrations
 * - Converts to defunct status
 * - Sends notification emails
 *
 * WARNING PERIOD
 * - Sends warnings before session ends
 * - Gives users advance notice
 * - Helps users understand what's happening
 *
 * ERROR HANDLING
 * - Does not throw errors (allows job to continue)
 * - Logs errors for monitoring
 * - Job continues running even if one execution fails
 *
 * DEPENDENCIES
 * - services/congress/CongressionalSessionService: Session status checking
 * - services/celebration/DefunctCelebrationService: Defunct conversion logic
 * - models/Celebration: Celebration model
 * - models/User: User model
 * - services/utils/logger: Logging
 *
 * @module jobs/defunctCelebrationWatcher
 * @requires ../services/congress/CongressionalSessionService
 * @requires ../services/celebration/DefunctCelebrationService
 * @requires ../models/Celebration
 * @requires ../models/User
 * @requires ../services/utils/logger
 * @requires ../services/utils (postToSocial for session_end webhook)
 */

const { CongressionalSessionService } = require('../services/congress');
const { DefunctCelebrationService } = require('../services/celebration');
const { Celebration, User } = require('../models');
const logger = require('../services/utils/logger')(__filename);
const { postToSocial } = require('../services/utils');
module.exports = async function defunctCelebrationWatcher(POLL_SCHEDULE) {
  logger.info('Starting defunct celebration watcher job');

  try {
    // Log current session status for monitoring
    await CongressionalSessionService.logSessionStatus();

    // Check if any action is needed and execute if so
    const result = await DefunctCelebrationService.checkAndConvertIfNeeded(
      Celebration,
      User
    );

    // Log the result
    if (result.success) {
      if (result.action === 'none') {
        logger.info('No action needed:', result.reason);
      } else if (result.convertedCount > 0) {
        logger.info('Defunct conversion completed', {
          convertedCount: result.convertedCount,
          usersNotified: result.usersNotified,
        });
        try {
          const congress = result.sessionInfo?.currentCongress ?? 0;
          const session = result.sessionInfo?.currentSession ?? 0;
          const sessionLabel =
            congress && session
              ? `${congress}th Congress, ${session === 1 ? '1st' : '2nd'} Session`
              : 'Congressional session';
          await postToSocial({
            eventType: 'session_end',
            dedupeKey: `session_end:${congress}:${session}:${Date.now()}`,
            sessionLabel,
            convertedCount: result.convertedCount,
          });
          logger.info('Posted social session_end event');
        } catch (postErr) {
          logger.error('Failed to post social session_end event:', {
            message: postErr.message,
          });
        }
      } else if (result.emailsSent > 0) {
        logger.info('Warning emails sent', {
          emailsSent: result.emailsSent,
          usersNotified: result.usersNotified,
        });
      }
    } else {
      logger.error('Defunct celebration processing failed:', result);
    }
  } catch (error) {
    logger.error('Error in defunct celebration watcher:', error);

    // Don't throw the error to prevent job failure
    // The job should continue running even if one execution fails
  }

  logger.info('Defunct celebration watcher job completed');
};

/**
 * Manual trigger function for testing or immediate execution
 *
 * This function can be called manually to trigger defunct celebration
 * processing outside of the scheduled job.
 *
 * @async
 * @function manualTrigger
 * @returns {Promise<Object>} Result of the processing
 */
module.exports.manualTrigger = async function () {
  logger.info('Manual trigger of defunct celebration processing');

  try {
    const result = await DefunctCelebrationService.checkAndConvertIfNeeded(
      Celebration,
      User
    );
    logger.info('Manual trigger completed:', result);
    return result;
  } catch (error) {
    logger.error('Error in manual trigger:', error);
    throw error;
  }
};

/**
 * Force conversion function for administrative use
 *
 * This function forces the conversion of all active Celebrations to defunct
 * status, regardless of session status. Use with caution.
 *
 * @async
 * @function forceConversion
 * @returns {Promise<Object>} Result of the forced conversion
 */
module.exports.forceConversion = async function () {
  logger.warn('Force conversion of active Celebrations to defunct status');

  try {
    const result =
      await DefunctCelebrationService.convertActiveCelebrationsToDefunct(
        Celebration,
        User
      );
    logger.info('Force conversion completed:', result);
    return result;
  } catch (error) {
    logger.error('Error in force conversion:', error);
    throw error;
  }
};

/**
 * Force warning emails function for administrative use
 *
 * This function forces the sending of warning emails to all users with
 * active Celebrations, regardless of session status. Use with caution.
 *
 * @async
 * @function forceWarningEmails
 * @returns {Promise<Object>} Result of the forced warning emails
 */
module.exports.forceWarningEmails = async function () {
  logger.warn('Force sending of warning emails for active Celebrations');

  try {
    const result = await DefunctCelebrationService.sendWarningEmails(
      Celebration,
      User
    );
    logger.info('Force warning emails completed:', result);
    return result;
  } catch (error) {
    logger.error('Error in force warning emails:', error);
    throw error;
  }
};
