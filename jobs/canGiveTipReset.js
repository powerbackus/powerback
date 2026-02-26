/**
 * @fileoverview PAC Tip Limit Reset Job (Legacy)
 *
 * This is a legacy version of the tip limit reset job. It appears to be a
 * duplicate or older version of tipLimitReachedReset.js. The functionality
 * is the same: resets tipLimitReached field for all users annually.
 *
 * Note: This file may be deprecated in favor of tipLimitReachedReset.js.
 * Consider consolidating or removing if no longer needed.
 *
 * KEY FEATURES
 *
 * ANNUAL RESET
 * - Resets tipLimitReached to false for all users
 * - Runs at midnight Eastern Time on January 1st
 * - Allows users to give tips again after annual limit reset
 *
 * DEPENDENCIES
 * - node-cron: Cron scheduling
 * - mongoose: MongoDB connection checking
 * - models/User: User model
 * - services/db: Database connection (legacy path)
 * - services/utils/logger: Logging
 *
 * @module jobs/canGiveTipReset
 * @requires node-cron
 * @requires mongoose
 * @requires ../models/User
 * @requires ../services/db
 * @requires ../services/utils/logger
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const { User } = require('../models');
const { connect } = require('../services/db');
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
