/**
 * @fileoverview Defunct Celebration Service
 *
 * This service manages the conversion of active Celebrations to defunct status
 * when Congressional sessions end without action on target bills. It handles
 * status transitions, email notifications, and warning emails before session
 * ends. The service ensures FEC compliance and proper audit trails.
 *
 * KEY FUNCTIONS
 *
 * convertActiveCelebrationsToDefunct(Celebration, User)
 * - Converts all active Celebrations to defunct status at session end
 * - Groups celebrations by user for batch processing
 * - Sends notification emails (respects unsubscribe preferences)
 * - Returns summary of conversion results
 *
 * convertUserCelebrationsToDefunct(user, celebrations, Celebration, sessionInfo, shouldSendEmail)
 * - Converts specific user's Celebrations to defunct
 * - Uses StatusService for proper status transitions
 * - Sends notification email if user is subscribed
 *
 * sendWarningEmails(Celebration, User)
 * - Sends warning emails to users with active Celebrations
 * - Only sends if in warning period (1 month before session end)
 * - Respects unsubscribe preferences
 * - Uses DefunctCelebrationWarning email template
 *
 * checkAndConvertIfNeeded(Celebration, User)
 * - Main entry point for checking session status
 * - Converts to defunct if session has ended
 * - Sends warnings if in warning period
 * - Returns action taken and results
 *
 * groupCelebrationsByUser(celebrations)
 * - Groups celebrations by user ID
 * - Handles various donatedBy field formats (ObjectId, string, stringified object)
 * - Validates ObjectIds and filters invalid entries
 *
 * BUSINESS LOGIC
 *
 * SESSION END DETECTION
 * - Uses CongressionalSessionService to detect session end
 * - Converts all active Celebrations when session ends
 * - Excludes seeded celebrations (idempotencyKey starting with "seed:")
 *
 * EMAIL NOTIFICATIONS
 * - Respects user unsubscribe preferences (EMAIL_TOPICS.celebrationUpdates)
 * - Sends warning emails during warning period (1 month before end)
 * - Sends notification emails when Celebrations become defunct
 * - Only subscribed users receive emails
 *
 * STATUS TRANSITIONS
 * - Uses StatusService for proper status transitions
 * - Records congressional session information in status ledger
 * - Maintains FEC compliance and audit trails
 *
 * DEPENDENCIES
 * - services/congress/CongressionalSessionService: Session detection
 * - services/celebration/statusService: Status transitions
 * - controller/comms: Email sending and unsubscribe filtering
 *
 * @module services/celebration/defunctService
 * @requires ../congress/CongressionalSessionService
 * @requires ../../controller/comms
 * @requires ../../constants
 * @requires ../utils/logger
 * @requires ./statusService
 */

const { CongressionalSessionService } = require('../congress'),
  { sendEmail, emails, filterUnsubscribed } = require('../../controller/comms'),
  { EMAIL_TOPICS } = require('../../constants'),
  logger = require('../utils/logger')(__filename),
  { StatusService } = require('./statusService');
class DefunctCelebrationService {
  /**
   * Convert all active Celebrations to defunct status
   * @param {Object} Celebration - Celebration model
   * @param {Object} User - User model
   * @returns {Promise<Object>} Summary of conversion results
   */
  static async convertActiveCelebrationsToDefunct(Celebration, User) {
    try {
      logger.info(
        'Starting conversion of active Celebrations to defunct status'
      );

      // Find all active Celebrations that haven't been resolved
      // Exclude seeded celebrations (those with idempotencyKey starting with "seed:")
      const activeCelebrations = await Celebration.find({
        defunct: false,
        resolved: false,
        paused: false,
        idempotencyKey: { $not: /^seed:/ },
      }).populate('donatedBy', 'firstName email');

      if (activeCelebrations.length === 0) {
        logger.info('No active Celebrations found to convert');
        return {
          success: true,
          convertedCount: 0,
          usersNotified: 0,
        };
      }

      logger.info(
        `Found ${activeCelebrations.length} active Celebrations to convert`
      );

      // Group celebrations by user for batch processing
      const celebrationsByUser =
        this.groupCelebrationsByUser(activeCelebrations);

      // Extract user IDs and batch fetch users with settings for unsubscribe check
      // User IDs are already validated by groupCelebrationsByUser
      const userIds = Object.keys(celebrationsByUser);
      const users = await User.find({ _id: { $in: userIds } }).select(
        '_id firstName email settings.unsubscribedFrom'
      );

      // Filter out users unsubscribed from celebration updates (for email only)
      const subscribedUsers = await filterUnsubscribed(
        users,
        EMAIL_TOPICS.celebrationUpdates
      );
      const subscribedUserIds = new Set(
        subscribedUsers.map((u) => u._id.toString())
      );

      let usersNotified = 0;
      const sessionInfo = await CongressionalSessionService.getSessionInfo();

      // Process ALL users' celebrations (including unsubscribed) for defunct conversion
      // Only email sending is skipped for unsubscribed users
      for (const [userId, celebrations] of Object.entries(celebrationsByUser)) {
        try {
          // Find user in full users array (not just subscribed)
          const user = users.find((u) => u._id.toString() === userId);
          if (!user) {
            logger.warn(`User ${userId} not found, skipping celebrations`);
            continue;
          }

          // Process celebrations for defunct conversion (regardless of unsubscribe status)
          const result = await this.convertUserCelebrationsToDefunct(
            user,
            celebrations,
            Celebration,
            sessionInfo,
            subscribedUserIds.has(userId) // Pass unsubscribe status for email filtering
          );

          if (result.emailSent) {
            usersNotified++;
          }
        } catch (error) {
          logger.error(`Error processing user ${userId}:`, error);
        }
      }

      const summary = {
        success: true,
        convertedCount: activeCelebrations.length,
        usersNotified,
        sessionInfo,
      };

      logger.info('Defunct celebration conversion completed', summary);
      return summary;
    } catch (error) {
      logger.error('Error converting Celebrations to defunct:', error);
      throw error;
    }
  }

  /**
   * Convert a specific user's Celebrations to defunct status
   * @param {Object} user - User document
   * @param {Array} celebrations - Array of Celebration documents
   * @param {Object} Celebration - Celebration model
   * @param {Object} sessionInfo - Congressional session information
   * @param {boolean} shouldSendEmail - Whether to send email notification (false if unsubscribed)
   * @returns {Promise<Object>} Conversion result
   */
  static async convertUserCelebrationsToDefunct(
    user,
    celebrations,
    Celebration,
    sessionInfo,
    shouldSendEmail = true
  ) {
    try {
      logger.info(
        `Converting ${celebrations.length} celebrations for user ${user._id}`
      );

      const defunctCelebrations = [];

      // Convert each celebration to defunct
      for (const celebration of celebrations) {
        try {
          // Use StatusService to properly transition to defunct status
          await StatusService.makeDefunct(
            celebration,
            'Congressional session ended without action on target bill',
            {
              session_number: sessionInfo.sessionNumber,
              session_end_date: sessionInfo.sessionEndDate,
              session_type: sessionInfo.sessionType,
            },
            {},
            Celebration
          );

          // Prepare celebration data for email
          defunctCelebrations.push({
            pol_name: celebration.pol_name,
            bill_id: celebration.bill_id,
            donation: celebration.donation,
            createdAt: celebration.createdAt,
            idempotencyKey: celebration.idempotencyKey,
          });

          logger.debug(`Converted celebration ${celebration._id} to defunct`);
        } catch (error) {
          logger.error(
            `Error converting celebration ${celebration._id}:`,
            error
          );
        }
      }

      // Send notification email if user has email and is subscribed
      let emailSent = false;
      if (shouldSendEmail && user.email && defunctCelebrations.length > 0) {
        try {
          await this.sendDefunctNotificationEmail(
            user,
            defunctCelebrations,
            sessionInfo
          );
          emailSent = true;
          logger.info(`Sent defunct notification email to user ${user._id}`);
        } catch (error) {
          logger.error(
            `Error sending defunct notification email to user ${user._id}:`,
            error
          );
        }
      } else if (!shouldSendEmail && defunctCelebrations.length > 0) {
        logger.debug(
          `Skipping email notification for user ${user._id} (unsubscribed from celebration_updates)`
        );
      }

      return {
        success: true,
        defunctCelebrations,
        emailSent,
      };
    } catch (error) {
      logger.error(
        `Error converting user ${user._id} celebrations to defunct:`,
        error
      );
      throw error;
    }
  }

  /**
   * Send warning emails to users with active Celebrations
   * @param {Object} Celebration - Celebration model
   * @param {Object} User - User model
   * @returns {Promise<Object>} Summary of warning emails sent
   */
  static async sendWarningEmails(Celebration, User) {
    try {
      logger.info('Starting to send warning emails for active Celebrations');

      const sessionInfo = await CongressionalSessionService.getSessionInfo();

      if (!sessionInfo.inWarningPeriod) {
        logger.info('Not in warning period, skipping warning emails');
        return {
          success: true,
          emailsSent: 0,
          usersNotified: 0,
        };
      }

      // Find users with active Celebrations
      // Exclude seeded celebrations (those with idempotencyKey starting with "seed:")
      const activeCelebrations = await Celebration.find({
        defunct: false,
        resolved: false,
        paused: false,
        idempotencyKey: { $not: /^seed:/ },
      }).populate('donatedBy', 'firstName email');

      if (activeCelebrations.length === 0) {
        logger.info('No active Celebrations found for warning emails');
        return {
          success: true,
          emailsSent: 0,
          usersNotified: 0,
        };
      }

      // Group celebrations by user
      const celebrationsByUser =
        this.groupCelebrationsByUser(activeCelebrations);

      // Extract user IDs from celebrations (already populated and validated by groupCelebrationsByUser)
      const userIds = Object.keys(celebrationsByUser);

      // Fetch full user objects with settings for unsubscribe check
      // Only fetch users we need (already have basic info from populate)
      const users = await User.find({
        _id: { $in: userIds },
        email: { $exists: true, $ne: '' },
      }).select('_id firstName email settings.unsubscribedFrom');

      // Filter out users unsubscribed from celebration updates
      const subscribedUsers = await filterUnsubscribed(
        users,
        EMAIL_TOPICS.celebrationUpdates
      );
      const subscribedUserIds = new Set(
        subscribedUsers.map((u) => u._id.toString())
      );

      let emailsSent = 0;
      let usersNotified = 0;

      // Send warning email to each subscribed user
      for (const [userId, celebrations] of Object.entries(celebrationsByUser)) {
        // Skip if user is unsubscribed
        if (!subscribedUserIds.has(userId)) {
          continue;
        }

        try {
          const user = subscribedUsers.find((u) => u._id.toString() === userId);
          if (!user || !user.email) {
            continue;
          }

          const emailSent = await this.sendWarningEmail(
            user,
            celebrations,
            sessionInfo
          );

          if (emailSent) {
            emailsSent++;
            usersNotified++;
            logger.info(`Sent warning email to user ${user._id}`);
          }
        } catch (error) {
          logger.error(`Error sending warning email to user ${userId}:`, error);
        }
      }

      const summary = {
        success: true,
        usersNotified,
        sessionInfo,
        emailsSent,
      };

      logger.info('Warning emails completed', summary);
      return summary;
    } catch (error) {
      logger.error('Error sending warning emails:', error);
      throw error;
    }
  }

  /**
   * Group celebrations by user ID
   * @param {Array} celebrations - Array of Celebration documents
   * @returns {Object} Celebrations grouped by user ID
   */
  static groupCelebrationsByUser(celebrations) {
    const mongoose = require('mongoose');
    const grouped = {};

    for (const celebration of celebrations) {
      if (!celebration.donatedBy) {
        logger.warn(
          `Skipping celebration ${
            celebration._id || 'unknown'
          } - missing donatedBy field`
        );
        continue;
      }

      // Handle case where donatedBy might be a stringified object instead of ObjectId
      let userId;
      if (
        typeof celebration.donatedBy === 'string' &&
        celebration.donatedBy.startsWith('{')
      ) {
        // It's a stringified object - try to parse and extract _id
        try {
          const parsed = JSON.parse(celebration.donatedBy);
          userId = parsed._id || parsed.id;
          if (!userId) {
            logger.warn(
              `Skipping celebration ${
                celebration._id || 'unknown'
              } - donatedBy is stringified object without _id`
            );
            continue;
          }
        } catch (parseError) {
          logger.warn(
            `Skipping celebration ${
              celebration._id || 'unknown'
            } - failed to parse donatedBy: ${parseError.message}`
          );
          continue;
        }
      } else {
        // Normal case: ObjectId or ObjectId string
        userId = celebration.donatedBy.toString();
      }

      // Validate that userId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        logger.warn(
          `Skipping celebration ${
            celebration._id || 'unknown'
          } - invalid ObjectId: ${userId}`
        );
        continue;
      }

      if (!grouped[userId]) {
        grouped[userId] = [];
      }
      grouped[userId].push(celebration);
    }

    return grouped;
  }

  /**
   * Send warning email to user
   * @param {Object} user - User document
   * @param {Array} celebrations - Array of Celebration documents
   * @param {Object} sessionInfo - Congressional session information
   * @returns {Promise<boolean>} True if email was sent successfully
   */
  static async sendWarningEmail(user, celebrations, sessionInfo) {
    try {
      const payload = {
        firstName: user.firstName,
        activeCelebrationsCount: celebrations.length,
        sessionEndDate: sessionInfo.sessionEndDate,
        nextElectionDate: sessionInfo.nextElectionDate,
      };

      await sendEmail(
        user.email,
        emails.DefunctCelebrationWarning,
        payload,
        user.firstName
      );

      return true;
    } catch (error) {
      logger.error(`Error sending warning email to ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Send defunct notification email to user
   * @param {Object} user - User document
   * @param {Array} defunctCelebrations - Array of defunct celebration details
   * @param {Object} sessionInfo - Congressional session information
   * @returns {Promise<boolean>} True if email was sent successfully
   */
  static async sendDefunctNotificationEmail(
    user,
    defunctCelebrations,
    sessionInfo
  ) {
    try {
      const payload = {
        nextElectionDate: sessionInfo.nextElectionDate,
        sessionEndDate: sessionInfo.sessionEndDate,
        firstName: user.firstName,
        defunctCelebrations,
      };

      await sendEmail(
        user.email,
        emails.DefunctCelebrationNotification,
        payload,
        user.firstName
      );

      return true;
    } catch (error) {
      logger.error(
        `Error sending defunct notification email to ${user.email}:`,
        error
      );
      return false;
    }
  }

  /**
   * Check if defunct conversion is needed and execute if so
   * @param {Object} Celebration - Celebration model
   * @param {Object} User - User model
   * @returns {Promise<Object>} Result of the check and any conversion
   */
  static async checkAndConvertIfNeeded(Celebration, User) {
    try {
      const sessionInfo = await CongressionalSessionService.getSessionInfo();

      if (sessionInfo.hasEnded) {
        logger.info(
          'Congressional session has ended, converting active Celebrations to defunct'
        );
        return await this.convertActiveCelebrationsToDefunct(Celebration, User);
      } else if (sessionInfo.inWarningPeriod) {
        logger.info('In warning period, sending warning emails');
        return await this.sendWarningEmails(Celebration, User);
      } else {
        logger.debug(
          'No action needed - session active and not in warning period'
        );
        return {
          success: true,
          action: 'none',
          reason: 'Session active and not in warning period',
        };
      }
    } catch (error) {
      logger.error('Error in checkAndConvertIfNeeded:', error);
      throw error;
    }
  }
}

module.exports = DefunctCelebrationService;
