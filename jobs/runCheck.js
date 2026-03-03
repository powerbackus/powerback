/**
 * @fileoverview Database Connection and Check Execution Utility
 *
 * This utility function ensures database connectivity before running a check
 * function. It's used by background watcher jobs to ensure they have database
 * access before executing their monitoring logic.
 *
 * BUSINESS LOGIC
 *
 * DATABASE CONNECTION
 * - Connects to MongoDB before running check
 * - Uses connect utility from services/utils/db
 * - Ensures database is available before execution
 *
 * ERROR HANDLING
 * - Catches and logs errors from check function
 * - Does not re-throw errors (allows job to continue)
 * - Logs errors for monitoring and debugging
 *
 * USAGE
 * Used by watcher jobs to wrap their check functions, ensuring database
 * connectivity and proper error handling.
 *
 * DEPENDENCIES
 * - services/utils/db: Database connection utility
 *
 * @module jobs/runCheck
 * @requires ../services/utils/db
 */

const { connect } = require('../services/utils/db');

/**
 * Runs a check function with database connection
 *
 * This function ensures database connectivity before executing a check
 * function, and handles errors gracefully.
 *
 * @param {Object} logger - Logger instance for error logging
 * @param {Function} check - Check function to execute after connecting
 * @returns {Promise<void>} Resolves when check completes
 *
 * @example
 * ```javascript
 * const runCheck = require('./jobs/runCheck');
 * await runCheck(logger, async () => {
 *   // Check logic here
 * });
 * ```
 */
module.exports = async function runCheck(logger, check) {
  await connect(logger);
  try {
    await check();
  } catch (err) {
    logger.error('runCheck error:', {
      message: err.message,
      stack: err.stack,
    });
  }
};
