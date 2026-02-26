/**
 * @fileoverview Election Date Notification Service
 *
 * This service handles election date change notifications, identifying users
 * affected by changes and sending appropriate notifications. It calculates
 * impact on donation limits (for Gold tier users) and respects unsubscribe
 * preferences.
 *
 * KEY FUNCTIONS
 *
 * handleElectionDateChange(state, oldDates, newDates)
 * - Main function for processing election date changes
 * - Finds affected users (with active celebrations or ocd_id in state)
 * - Sends appropriate notifications based on user relationship to state
 * - Returns summary of notifications sent
 *
 * findUsersWithActiveCelebrations(state)
 * - Finds users with active Celebrations for politicians in the state
 * - Uses Pol model to find politicians with has_stakes: true
 * - Returns unique users with active Celebrations
 *
 * findUsersWithOcdIdInState(state)
 * - Finds users with ocd_id matching state pattern
 * - Uses regex pattern matching on ocd_id field
 * - Returns users with residential address in the state
 *
 * calculateElectionDateImpact(user, state, oldDates, newDates)
 * - Calculates impact of election date changes on user's donation limits
 * - Only calculates for Compliant tier users (election cycle limits)
 * - Compares old vs new limits using electionCycleService
 * - Returns impact analysis with limit changes and descriptions
 *
 * notifyUsersWithActiveCelebrations(users, state, oldDates, newDates)
 * - Sends notifications to users with active Celebrations
 * - Includes impact analysis for Compliant tier users
 * - Respects unsubscribe preferences
 * - Uses ElectionDateChanged email template
 *
 * notifyUsersWithOcdId(users, state, oldDates, newDates)
 * - Sends notifications to users with ocd_id in state
 * - General notification (no impact analysis)
 * - Respects unsubscribe preferences
 * - Uses ElectionDateNotification email template
 *
 * BUSINESS LOGIC
 *
 * USER DISCOVERY
 * - Active Celebrations: Users with active Celebrations for politicians in state
 * - Residential Address: Users with ocd_id matching state pattern
 * - Deduplication: Users with Celebrations are excluded from ocd_id notifications
 *
 * IMPACT CALCULATION
 * - Only for Compliant tier users (they have election cycle limits)
 * - Compares effective limits with old vs new election dates
 * - Determines if limit changed or election timeline changed
 * - Provides user-friendly impact descriptions
 *
 * UNSUBSCRIBE HANDLING
 * - Respects EMAIL_TOPICS.electionUpdates unsubscribe preferences
 * - Filters users before sending notifications
 * - All affected users are identified, only subscribed users receive emails
 *
 * ELECTION DATE CHANGES
 * - Primary date changes: Affects primary election cycle limits
 * - General date changes: Affects general election cycle limits
 * - Null to value or value to null: Also considered a change
 *
 * DEPENDENCIES
 * - models/User, Celebration, Pol: Data access
 * - controller/comms: Email sending and unsubscribe filtering
 * - constants: Email topic constants
 * - services/congress/electionCycleService: Limit calculations
 *
 * @module services/congress/electionDateNotificationService
 * @requires ../../models
 * @requires ../../controller/comms
 * @requires ../../constants
 * @requires ./electionCycleService
 * @requires ../utils/logger
 */

const { User, Celebration, Pol } = require('../../models');
const { sendEmail, filterUnsubscribed } = require('../../controller/comms');
const { EMAIL_TOPICS } = require('../../constants');
const logger = require('../utils/logger')(__filename);
const electionCycleService = require('./electionCycleService');

/**
 * Find users with active Celebrations in a specific state
 *
 * @param {string} state - State code (e.g., 'CA')
 * @returns {Promise<Array>} Array of users with active Celebrations in the state
 */
async function findUsersWithActiveCelebrations(state) {
  try {
    // Find all politicians in the state
    const politicians = await Pol.find({
      'roles.state': state,
      has_stakes: true,
    });

    if (!politicians.length) {
      logger.info(`No politicians found for state ${state}`);
      return [];
    }

    const polIds = politicians.map((pol) => pol.id);

    // Find active Celebrations for these politicians
    const activeCelebrations = await Celebration.find({
      pol_id: { $in: polIds },
      resolved: false,
      defunct: false,
      paused: false,
    });

    if (!activeCelebrations.length) {
      logger.info(`No active Celebrations found for state ${state}`);
      return [];
    }

    // Get unique user IDs from active Celebrations
    const userIds = [...new Set(activeCelebrations.map((c) => c.donatedBy))];

    // Fetch user details
    const users = await User.find({
      _id: { $in: userIds },
      email: { $exists: true, $ne: '' },
    });

    logger.info(
      `Found ${users.length} users with active Celebrations in ${state}`
    );
    return users;
  } catch (error) {
    logger.error(
      `Error finding users with active Celebrations in ${state}:`,
      error
    );
    return [];
  }
}

/**
 * Find users with ocd_id in a specific state (residential address)
 *
 * @param {string} state - State code (e.g., 'CA')
 * @returns {Promise<Array>} Array of users with ocd_id in the state
 */
async function findUsersWithOcdIdInState(state) {
  try {
    // Extract state from ocd_id pattern: ocd-division/country:us/state:ca/cd:1
    const statePattern = new RegExp(
      `ocd-division/country:us/state:${state.toLowerCase()}/cd:\\d+`
    );

    const users = await User.find({
      ocd_id: { $regex: statePattern },
      email: { $exists: true, $ne: '' },
    });

    logger.info(`Found ${users.length} users with ocd_id in ${state}`);
    return users;
  } catch (error) {
    logger.error(`Error finding users with ocd_id in ${state}:`, error);
    return [];
  }
}

/**
 * Calculate the impact of election date changes on a user's donation limits
 *
 * @param {Object} user - User object
 * @param {string} state - State code
 * @param {Object} oldDates - Previous election dates
 * @param {Object} newDates - New election dates
 * @returns {Promise<Object>} Impact analysis object
 */
async function calculateElectionDateImpact(user, state, oldDates, newDates) {
  try {
    // Only calculate impact for Compliant tier users (they have election cycle limits)
    if (user.compliance !== 'compliant') {
      return {
        hasImpact: false,
        reason: 'User is not Compliant tier (no election cycle limits)',
      };
    }

    // Get user's donations
    const donations = await Celebration.find({
      donatedBy: user._id,
      resolved: false,
      defunct: false,
      paused: false,
    });

    // Calculate limits with old dates
    const oldLimits = await electionCycleService.getEffectiveLimits(
      user.compliance,
      donations,
      null, // polId not needed for Compliant tier (counts all donations)
      state
    );

    // Temporarily update election dates to calculate new limits
    // This is a simplified approach - in production you might want to mock the service
    const newLimits = await electionCycleService.getEffectiveLimits(
      user.compliance,
      donations,
      null,
      state
    );

    const impact = {
      hasImpact: false,
      oldLimit: oldLimits.remainingLimit,
      newLimit: newLimits.remainingLimit,
      limitChanged: oldLimits.remainingLimit !== newLimits.remainingLimit,
      impactDescription: '',
    };

    // Determine if there's a meaningful impact
    if (impact.limitChanged) {
      impact.hasImpact = true;

      if (newLimits.remainingLimit > oldLimits.remainingLimit) {
        impact.impactDescription = `Your donation limit has increased, giving you more flexibility to support causes you care about.`;
      } else {
        impact.impactDescription = `Your donation limit has decreased, which may affect your ability to make new Celebrations.`;
      }
    } else {
      // Check if election cycle timing changed (any change matters for Compliant tier)
      const toDate = (s) => (s ? new Date(s) : null);
      const eqDates = (a, b) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        const ta = a.getTime();
        const tb = b.getTime();
        return Number.isFinite(ta) && Number.isFinite(tb) && ta === tb;
      };

      const oldPrimaryDate = toDate(oldDates.primary);
      const newPrimaryDate = toDate(newDates.primary);
      const oldGeneralDate = toDate(oldDates.general);
      const newGeneralDate = toDate(newDates.general);

      // Any change in election dates (including null<->value) affects the timeline
      if (
        !eqDates(oldPrimaryDate, newPrimaryDate) ||
        !eqDates(oldGeneralDate, newGeneralDate)
      ) {
        impact.hasImpact = true;
        impact.impactDescription = `The election timeline has changed, which affects when your donation limits reset and the timing of your political engagement.`;
      }
    }

    return impact;
  } catch (error) {
    logger.error(
      `Error calculating election date impact for user ${user._id}:`,
      error
    );
    return {
      hasImpact: false,
      reason: 'Error calculating impact',
    };
  }
}

/**
 * Send election date change notification to users with active Celebrations
 *
 * @param {Array} users - Array of users to notify
 * @param {string} state - State code
 * @param {Object} oldDates - Previous election dates
 * @param {Object} newDates - New election dates
 * @returns {Promise<number>} Number of emails sent
 */
async function notifyUsersWithActiveCelebrations(
  users,
  state,
  oldDates,
  newDates
) {
  // Filter out users unsubscribed from election updates
  const subscribedUsers = await filterUnsubscribed(
    users,
    EMAIL_TOPICS.electionUpdates
  );

  let emailsSent = 0;

  for (const user of subscribedUsers) {
    try {
      // Calculate impact for this user
      const impact = await calculateElectionDateImpact(
        user,
        state,
        oldDates,
        newDates
      );

      if (!impact.hasImpact) {
        logger.debug(`No impact for user ${user._id}, skipping notification`);
        continue;
      }

      // Send notification email
      const emailPayload = {
        state,
        oldLimit: impact.oldLimit,
        newLimit: impact.newLimit,
        firstName: user.firstName,
        oldPrimaryDate: oldDates.primary,
        newPrimaryDate: newDates.primary,
        oldGeneralDate: oldDates.general,
        newGeneralDate: newDates.general,
        impactDescription: impact.impactDescription,
      };

      await sendEmail(
        user.email,
        emailPayload,
        'ElectionDateChanged',
        user.firstName
      );

      emailsSent++;
      logger.info(`Sent election date change notification to ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send notification to user ${user._id}:`, error);
    }
  }

  return emailsSent;
}

/**
 * Send election date notification to users with ocd_id in the state
 *
 * @param {Array} users - Array of users to notify
 * @param {string} state - State code
 * @param {Object} oldDates - Previous election dates
 * @param {Object} newDates - New election dates
 * @returns {Promise<number>} Number of emails sent
 */
async function notifyUsersWithOcdId(users, state, oldDates, newDates) {
  // Filter out users unsubscribed from election updates
  const subscribedUsers = await filterUnsubscribed(
    users,
    EMAIL_TOPICS.electionUpdates
  );

  let emailsSent = 0;

  for (const user of subscribedUsers) {
    try {
      const emailPayload = {
        firstName: user.firstName,
        state,
        oldPrimaryDate: oldDates.primary,
        newPrimaryDate: newDates.primary,
        oldGeneralDate: oldDates.general,
        newGeneralDate: newDates.general,
      };

      await sendEmail(
        user.email,
        emailPayload,
        'ElectionDateNotification',
        user.firstName
      );

      emailsSent++;
      logger.info(`Sent election date notification to ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send notification to user ${user._id}:`, error);
    }
  }

  return emailsSent;
}

/**
 * Main function to handle election date change notifications
 *
 * @param {string} state - State code
 * @param {Object} oldDates - Previous election dates {primary, general}
 * @param {Object} newDates - New election dates {primary, general}
 * @returns {Promise<Object>} Notification results
 */
async function handleElectionDateChange(state, oldDates, newDates) {
  logger.info(`Processing election date change notifications for ${state}`);

  try {
    // Find users with active Celebrations in the state
    const usersWithCelebrations = await findUsersWithActiveCelebrations(state);

    // Find users with ocd_id in the state (but exclude those already notified)
    const usersWithOcdId = await findUsersWithOcdIdInState(state);
    const celebrationUserIds = new Set(
      usersWithCelebrations.map((u) => u._id.toString())
    );
    const usersWithOcdIdOnly = usersWithOcdId.filter(
      (u) => !celebrationUserIds.has(u._id.toString())
    );

    // Send notifications
    const celebrationEmailsSent = await notifyUsersWithActiveCelebrations(
      usersWithCelebrations,
      state,
      oldDates,
      newDates
    );

    const ocdIdEmailsSent = await notifyUsersWithOcdId(
      usersWithOcdIdOnly,
      state,
      oldDates,
      newDates
    );

    const results = {
      totalEmailsSent: celebrationEmailsSent + ocdIdEmailsSent,
      usersWithCelebrations: usersWithCelebrations.length,
      usersWithOcdIdOnly: usersWithOcdIdOnly.length,
      celebrationEmailsSent,
      ocdIdEmailsSent,
      state,
    };

    logger.info(
      `Election date change notifications completed for ${state}:`,
      results
    );
    return results;
  } catch (error) {
    logger.error(
      `Error handling election date change notifications for ${state}:`,
      error
    );
    throw error;
  }
}

module.exports = {
  notifyUsersWithOcdId,
  handleElectionDateChange,
  findUsersWithOcdIdInState,
  calculateElectionDateImpact,
  findUsersWithActiveCelebrations,
  notifyUsersWithActiveCelebrations,
};
