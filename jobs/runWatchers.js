/**
 * @fileoverview Background Watchers Orchestration Module
 *
 * This module orchestrates all background watcher jobs that monitor external
 * APIs and update the database accordingly. It schedules watchers to run on
 * a daily schedule (3 PM Eastern Time on weekdays) and manages their execution
 * with error handling and logging.
 *
 * WATCHER JOBS
 *
 * houseWatcher
 * - Monitors House membership changes from Congress.gov API
 * - Adds new politicians to database
 * - Updates has_stakes flags based on FEC data
 * - Sends alerts for membership changes
 *
 * challengersWatcher
 * - Monitors challenger status for competitive races
 * - Tracks challenger appearances/disappearances
 * - Updates has_stakes flags
 * - Sends email alerts to users in affected districts
 *
 * checkHJRes54
 * - Monitors H.J.Res.54 (We The People Amendment) bill status
 * - Tracks bill changes and updates database
 * - Uses snapshot diffing to detect changes
 *
 * electionDatesUpdater
 * - Updates election dates from OpenFEC API
 * - Maintains election dates snapshot
 * - Used for Gold tier per-election limit calculations
 *
 * defunctCelebrationWatcher
 * - Monitors Congressional session status
 * - Converts active celebrations to defunct when sessions end
 * - Sends warning emails during warning period
 *
 * BUSINESS LOGIC
 *
 * SCHEDULING
 * - Runs daily at 3 PM Eastern Time on weekdays
 * - Uses cron schedule from SERVER.CRON_SCHEDULES.WEEKDAY_3PM
 * - Timezone: America/New_York (Eastern Time)
 *
 * EXECUTION ORDER
 * 1. houseWatcher (House membership)
 * 2. challengersWatcher (Challenger status)
 * 3. checkHJRes54 (Bill status)
 * 4. electionDatesUpdater (Election dates)
 * 5. defunctCelebrationWatcher (Defunct celebrations)
 *
 * ERROR HANDLING
 * - Each watcher runs independently
 * - Failures in one watcher don't stop others
 * - Results logged for monitoring
 * - Summary logged at end (completed/failed counts)
 *
 * RUN CONTROL
 * - Set START_WATCHERS=1 to run; leave unset or blank to disable
 * - When disabled, skips initial run (and server does not load this module)
 * - Useful for maintenance or testing
 *
 * DEPENDENCIES
 * - node-cron: Cron scheduling
 * - ./checkHJRes54: Bill watcher
 * - ./houseWatcher: House membership watcher
 * - ./challengersWatcher: Challenger status watcher
 * - ./electionDatesUpdater: Election dates updater
 * - ./defunctCelebrationWatcher: Defunct celebration watcher
 * - ./tipLimitReachedReset: PAC tip limit reset scheduler
 * - constants: SERVER cron schedules
 * - services/utils/logger: Logging
 *
 * @module jobs/runWatchers
 * @requires node-cron
 * @requires ./checkHJRes54
 * @requires ./houseWatcher
 * @requires ./challengersWatcher
 * @requires ./electionDatesUpdater
 * @requires ./defunctCelebrationWatcher
 * @requires ./tipLimitReachedReset
 * @requires ../constants
 * @requires ../services/utils/logger
 */

const cron = require('node-cron');

const { SERVER } = require('../constants');
const logger = require('../services/utils/logger')(__filename);

const checkHJRes54 = require('./checkHJRes54');
const houseWatcher = require('./houseWatcher');
const challengersWatcher = require('./challengersWatcher');
const { electionDatesUpdater } = require('./electionDatesUpdater');
const defunctCelebrationWatcher = require('./defunctCelebrationWatcher');
const { scheduleTipLimitReachedReset } = require('./tipLimitReachedReset');

const POLL_SCHEDULE = SERVER.CRON_SCHEDULES.WEEKDAY_3PM;

/**
 * Main function that orchestrates all background watcher jobs
 *
 * This function sets up cron scheduling for all watchers and runs them
 * in sequence. It handles errors gracefully, allowing one watcher to fail
 * without stopping others.
 *
 * @function runWatchers
 * @returns {void}
 */
function runWatchers() {
  // Set default NODE_ENV if not provided
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const runWatchers = Boolean(process.env.START_WATCHERS);
  const isTestMode = process.env.NODE_ENV === 'test';

  if (!isTestMode && runWatchers) {
    logger.info('runWatchers booted');
  }

  // Schedule the tipLimitReached reset job
  scheduleTipLimitReachedReset();

  async function runAll(POLL_SCHEDULE) {
    logger.info(
      'running houseWatcher -> challengersWatcher -> checkHJRes54 -> electionDatesUpdater -> defunctCelebrationWatcher'
    );

    const watchers = [
      { name: 'houseWatcher', fn: () => houseWatcher(POLL_SCHEDULE) },
      {
        name: 'challengersWatcher',
        fn: () => challengersWatcher(POLL_SCHEDULE),
      },
      { name: 'checkHJRes54', fn: () => checkHJRes54(POLL_SCHEDULE) },
      { name: 'electionDatesUpdater', fn: () => electionDatesUpdater() },
      {
        name: 'defunctCelebrationWatcher',
        fn: () => defunctCelebrationWatcher(POLL_SCHEDULE),
      },
    ];

    const results = [];

    for (const watcher of watchers) {
      try {
        await watcher.fn();
        results.push({ name: watcher.name, status: 'completed' });
        logger.info(`${watcher.name} completed successfully`);
      } catch (err) {
        results.push({
          name: watcher.name,
          status: 'failed',
          error: err.message,
        });
        logger.error(`${watcher.name} failed:`, err.message);
      }
    }

    const completed = results.filter((r) => r.status === 'completed').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    if (failed === 0) {
      logger.info('all watchers completed successfully');
    } else {
      logger.warn(
        `watchers completed: ${completed}/${watchers.length} (${failed} failed)`
      );
      results
        .filter((r) => r.status === 'failed')
        .forEach((r) => {
          logger.error(`  ${r.name}: ${r.error}`);
        });
    }
  }

  // once a day at 3pm Eastern Time (Washington DC timezone)
  cron.schedule(
    POLL_SCHEDULE,
    () => {
      logger.info('cron tick - runWatchers');
      runAll(POLL_SCHEDULE);
    },
    { timezone: 'America/New_York' }
  );

  // initial run - skip in test mode or if watchers are paused
  if (runWatchers && !isTestMode) {
    logger.info('Running initial watcher execution...');
    runAll(POLL_SCHEDULE).catch((err) =>
      logger.error('initial runWatchers run failed', err.message)
    );
  } else if (!runWatchers && !isTestMode) {
    logger.info(
      'Watchers disabled (START_WATCHERS not set) - skipping initial execution'
    );
  }
}

module.exports = runWatchers;
