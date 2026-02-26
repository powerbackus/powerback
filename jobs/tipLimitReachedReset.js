/**
 * @fileoverview PAC Tip Limit Reset Job
 *
 * This background job resets the tipLimitReached field for all users at the
 * beginning of each calendar year. The PAC (Political Action Committee) tip
 * limit is $5,000 per calendar year, so this reset allows users to give tips
 * again after the annual limit resets on January 1st.
 *
 * KEY FEATURES
 *
 * ANNUAL RESET
 * - Resets tipLimitReached to false for all users
 * - Runs at midnight Eastern Time on January 1st
 * - Allows users to give tips again after annual limit reset
 *
 * SCHEDULING
 * - Uses cron schedule: '0 0 1 1 *' (midnight on January 1st)
 * - Timezone: America/New_York (Eastern Time)
 * - Runs automatically each year
 *
 * DATABASE CONNECTION
 * - Checks MongoDB connection before running
 * - Connects if not already connected
 * - Handles connection errors gracefully
 *
 * BUSINESS LOGIC
 *
 * PAC TIP LIMITS
 * - PAC contributions limited to $5,000 annually
 * - Calendar year based (Jan 1 - Dec 31)
 * - Reset allows new tips after limit period ends
 *
 * RESET LOGIC
 * - Updates all users with tipLimitReached: true
 * - Sets tipLimitReached to false
 * - Logs number of users reset
 *
 * DEPENDENCIES
 * - node-cron: Cron scheduling
 * - mongoose: MongoDB connection checking
 * - models/User: User model
 * - services/utils/db: Database connection
 * - services/utils/logger: Logging
 *
 * @module jobs/tipLimitReachedReset
 * @requires node-cron
 * @requires mongoose
 * @requires ../models/User
 * @requires ../services/utils/db
 * @requires ../services/utils/logger
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const { User } = require('../models');
const { connect } = require('../services/utils/db');
const logger = require('../services/utils/logger')(__filename);
async function resetTipLimitReached() {
  try {
    logger.info('Starting tipLimitReached reset job');

    // Check if already connected to MongoDB
    if (mongoose.connection.readyState !== 1) {
      logger.info('Connecting to MongoDB...');
      await connect(logger);
      logger.info('MongoDB connected for canGiveTip reset job');
    }

    // Reset tipLimitReached to false for all users (allowing them to give tips again)
    const result = await User.updateMany(
      { tipLimitReached: true },
      { $set: { tipLimitReached: false } }
    );

    logger.info(`Reset tipLimitReached for ${result.modifiedCount} users`);

    return result;
  } catch (error) {
    logger.error('Error in canGiveTip reset job:', error.message);
    throw error;
  }
}

/**
 * Schedule the job to run annually at midnight Eastern Time on January 1st
 * Cron format: '0 0 1 1 *' = At 00:00 on January 1st
 */
function scheduleTipLimitReachedReset() {
  logger.info('Scheduling tipLimitReached reset job');

  cron.schedule(
    '0 0 1 1 *', // Midnight Eastern Time on January 1st
    async () => {
      logger.info('cron tick - tipLimitReached reset');
      try {
        await resetTipLimitReached();
        logger.info('tipLimitReached reset completed successfully');
      } catch (error) {
        logger.error('tipLimitReached reset failed:', error.message);
      }
    },
    {
      timezone: 'America/New_York', // Eastern Time
      scheduled: true,
    }
  );
}

module.exports = {
  resetTipLimitReached,
  scheduleTipLimitReachedReset,
};
