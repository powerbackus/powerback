/**
 * @fileoverview Logger Utility Module
 *
 * This module provides a convenient way to create logger instances from
 * __filename. It encapsulates the common pattern of importing getLogger and
 * path to create a logger with a module name derived from the file path.
 *
 * The logger uses Winston with daily rotating file transport and console
 * output with color-coded log levels and smart timestamp formatting.
 *
 * KEY FEATURES
 *
 * MODULE-BASED LOGGING
 * - Automatically extracts module name from file path
 * - Prefixes logs with module name for easy filtering
 * - Supports both getLogger(moduleName) and requireLogger(__filename)
 *
 * SMART TIMESTAMPS
 * - Shows full date only when date changes
 * - Shows time for all log entries
 * - Reduces log clutter while maintaining context
 * - UTC timestamps for server logs
 *
 * DAILY ROTATION
 * - Rotates log files daily
 * - Compresses old logs (zippedArchive)
 * - Retains logs for 14 days
 * - Max file size: 5MB
 *
 * COLOR CODING
 * - Error: Red
 * - Warn: Yellow
 * - Info: Cyan
 * - Debug: Magenta
 * - Module names: Gray
 * - Timestamps: Gray
 *
 * DEPENDENCIES
 * - winston: Logging library
 * - winston-daily-rotate-file: Daily log rotation
 * - path: Path manipulation
 *
 * @module services/utils/logger
 * @requires winston
 * @requires winston-daily-rotate-file
 * @requires path
 */

const { requireLogger } = require('../logger');

/**
 * Creates a logger instance for the calling module.
 *
 * Automatically extracts the module name from __filename using the pattern:
 * path.join(path.basename(path.dirname(__filename)), path.basename(__filename).replace('.js', ''))
 *
 * @param {string} filePath - The __filename from the calling module
 * @returns {Object} Logger instance with module name prefix
 *
 * @example
 * ```javascript
 * const logger = require('./services/utils/logger')(__filename);
 * logger.info('Module initialized');
 * ```
 */
module.exports = requireLogger;
