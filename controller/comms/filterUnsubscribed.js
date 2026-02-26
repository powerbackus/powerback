/**
 * @fileoverview Unsubscribe Filtering Utility Module
 *
 * This module provides batch filtering capabilities to exclude users who have
 * unsubscribed from specific email topics before sending email notifications.
 * It performs efficient batch MongoDB queries to identify subscribed users and
 * filters input arrays accordingly. Used by email notification services to
 * respect user preferences and comply with email regulations.
 *
 * KEY FUNCTIONS
 *
 * filterUnsubscribed(users, topic)
 * - Batch filters users who have unsubscribed from a topic
 * - Performs single MongoDB query for efficiency
 * - Handles both user objects and user IDs
 * - Returns filtered array of subscribed users
 *
 * isUnsubscribed(userId, topic)
 * - Checks if single user is unsubscribed from topic
 * - Used for single-user checks
 * - More efficient than filterUnsubscribed for single users
 *
 * BUSINESS LOGIC
 *
 * UNSUBSCRIBE STORAGE
 * - User preferences stored in settings.unsubscribedFrom array
 * - Array contains topic strings (e.g., 'election_updates', 'celebration_updates')
 * - Empty array or missing field means user is subscribed
 *
 * BATCH FILTERING
 * - Single MongoDB query for all users (O(1) database calls)
 * - Converts results to Set for O(1) lookup performance
 * - Preserves original array order and additional fields
 * - More efficient than checking each user individually
 *
 * FAIL-OPEN BEHAVIOR
 * - Returns all users if MongoDB not connected (e.g., during tests)
 * - Assumes subscribed if database unavailable
 * - Prevents blocking email sending due to database issues
 * - Logs warnings when filtering is skipped
 *
 * DEPENDENCIES
 * - mongoose: MongoDB connection checking
 * - models/User: User model for unsubscribe preference queries
 * - shared/emailTopics: Email topic constants
 * - services/utils/logger: Logging
 *
 * @module controller/comms/filterUnsubscribed
 * @requires mongoose
 * @requires ../../models/User
 * @requires ../../shared/emailTopics
 * @requires ../../services/utils/logger
 */

const mongoose = require('mongoose'),
  { User } = require('../../models'),
  logger = require('../../services/utils/logger')(__filename);

/**
 * Filters out users who have unsubscribed from a specific email topic
 *
 * Performs a single batch MongoDB query to identify subscribed users, then
 * filters the input array to return only users who are not unsubscribed.
 * This is more efficient than checking each user individually.
 *
 * @param {Array} users - Array of user objects or user IDs
 * @param {string} topic - Email topic to check (e.g., 'electionUpdates', 'districtUpdates')
 * @returns {Promise<Array>} Filtered array of users who are not unsubscribed
 *
 * @example
 * const subscribedUsers = await filterUnsubscribed(users, EMAIL_TOPICS.electionUpdates);
 * for (const user of subscribedUsers) {
 *   await sendEmail(user.email, ...);
 * }
 */
async function filterUnsubscribed(users, topic) {
  // Check MongoDB connection before querying
  // If DB is not connected (e.g., during tests), return all users to avoid blocking
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    logger.debug(
      `MongoDB not connected, skipping unsubscribe filter for ${topic}`
    );
    return users; // Return all users if DB not connected
  }

  if (!users || users.length === 0) {
    return users;
  }

  try {
    // Extract user IDs from mixed array (handles both user objects and IDs)
    const userIds = users.map((user) =>
      typeof user === 'object' && user._id ? user._id : user
    );

    // Batch query: find users who are NOT unsubscribed from this topic
    // Users are subscribed if: unsubscribedFrom doesn't exist, is empty, or doesn't include topic
    const subscribedUsers = await User.find({
      _id: { $in: userIds },
      $or: [
        { 'settings.unsubscribedFrom': { $nin: [topic] } },
        { 'settings.unsubscribedFrom': { $exists: false } },
        { settings: { $exists: false } },
      ],
    }).select('_id');

    // Convert to Set for O(1) lookup performance
    const subscribedUserIds = new Set(
      subscribedUsers.map((u) => u._id.toString())
    );

    // Filter original users array to preserve order and any additional fields
    const filtered = users.filter((user) => {
      const userId =
        typeof user === 'object' && user._id
          ? user._id.toString()
          : user.toString();
      return subscribedUserIds.has(userId);
    });

    const filteredCount = users.length - filtered.length;
    if (filteredCount > 0) {
      logger.info(
        `Filtered out ${filteredCount} unsubscribed user(s) from ${topic} notifications`
      );
    }

    return filtered;
  } catch (err) {
    logger.error('Error filtering unsubscribed users:', err);
    // On error, return all users to avoid blocking emails (fail-open behavior)
    return users;
  }
}

/**
 * Checks if a single user is unsubscribed from a topic
 *
 * Use this for single-user checks. For batch operations, prefer filterUnsubscribed()
 * which performs a single query for multiple users.
 *
 * @param {string|ObjectId} userId - User ID or user object
 * @param {string} topic - Email topic to check
 * @returns {Promise<boolean>} True if user is unsubscribed, false otherwise
 *
 * @example
 * if (await isUnsubscribed(userId, EMAIL_TOPICS.celebrationUpdates)) {
 *   return; // Skip email
 * }
 */
async function isUnsubscribed(userId, topic) {
  // Check MongoDB connection before querying
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    logger.debug(`MongoDB not connected, assuming user is not unsubscribed`);
    return false; // Fail-open: assume subscribed if DB unavailable
  }

  try {
    // Only select the unsubscribe field to minimize data transfer
    const user = await User.findById(userId).select(
      'settings.unsubscribedFrom'
    );

    if (!user) {
      return false; // User doesn't exist, assume subscribed
    }

    const unsubscribedFrom = user.settings?.unsubscribedFrom || [];
    return unsubscribedFrom.includes(topic) || false;
  } catch (err) {
    logger.error('Error checking unsubscribe status:', err);
    // On error, assume not unsubscribed to avoid blocking emails (fail-open)
    return false;
  }
}

module.exports = {
  filterUnsubscribed,
  isUnsubscribed,
};
