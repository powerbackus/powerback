/**
 * @fileoverview Background Jobs Entry Point
 *
 * This module serves as the entry point for all background jobs in the POWERBACK
 * application. It initializes and starts the watcher system which monitors
 * congressional data, election dates, celebrations, and other time-sensitive
 * information.
 *
 * BACKGROUND JOBS
 *
 * The watcher system includes:
 * - houseWatcher: Monitors House membership changes
 * - challengersWatcher: Monitors challenger status for competitive races
 * - checkHJRes54: Monitors H.J.Res.54 bill status
 * - electionDatesUpdater: Updates election dates from OpenFEC API
 * - defunctCelebrationWatcher: Converts celebrations to defunct when sessions end
 * - tipLimitReachedReset: Resets PAC tip limits annually
 *
 * DEPENDENCIES
 * - ./runWatchers: Main watcher orchestration function
 *
 * @module jobs
 * @requires ./runWatchers
 */

const runWatchers = require('./runWatchers');

runWatchers();
