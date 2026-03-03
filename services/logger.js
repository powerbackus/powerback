/**
 * @fileoverview Central Logging Service
 *
 * This module provides the central logging service for the POWERBACK application
 * using Winston. It configures daily rotating log files, console output with
 * color coding, and smart timestamp formatting to reduce log clutter while
 * maintaining context.
 *
 * KEY FEATURES
 *
 * DAILY ROTATION
 * - Rotates log files daily
 * - Format: powerback-YYYY-MM-DD.log
 * - Compresses old logs (zippedArchive)
 * - Retains logs for 14 days
 * - Max file size: 5MB
 *
 * SMART TIMESTAMPS
 * - Shows full date only when date changes
 * - Shows time for all log entries
 * - UTC timestamps for server logs
 * - Reduces log clutter
 *
 * COLOR CODING
 * - Error: Red
 * - Warn: Yellow
 * - Info: Cyan
 * - Debug: Magenta
 * - Module names: Gray
 * - Timestamps: Gray
 *
 * MODULE-BASED LOGGING
 * - getLogger(moduleName): Create logger with module name
 * - requireLogger(__filename): Auto-extract module from file path
 * - Module name prefixes all log messages
 *
 * BUSINESS LOGIC
 *
 * LOG LEVELS
 * - Production: 'info' (default)
 * - Development: 'debug' (default)
 * - Configurable via LOG_LEVEL environment variable
 *
 * LOG FORMATS
 * - Console: Color-coded with smart timestamps
 * - File: JSON format with full timestamps
 * - Consistent structure for parsing
 *
 * TIMESTAMP TRACKING
 * - Tracks last date to detect date changes
 * - Shows full date on date change
 * - Shows time for all entries
 * - Reduces redundant date information
 *
 * DEPENDENCIES
 * - winston: Logging library
 * - winston-daily-rotate-file: Daily log rotation
 * - path: Path manipulation
 *
 * @requires path
 * @module services/logger
 * @requires winston
 * @requires winston-daily-rotate-file 
 */

const path = require('path');
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');


const logDir = process.env.NODE_ENV === 'production' ? process.env.LOG_DIR : 'logs';

const dailyRotate = new transports.DailyRotateFile({
  filename: path.resolve(process.cwd(), logDir, 'powerback-%DATE%.log'),
  format: format.combine(format.timestamp(), format.json()),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '14d',
  maxSize: '5m',
});

const logLevel =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Custom color scheme for different log levels
const levelColors = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m', // Yellow
  info: '\x1b[36m', // Cyan
  debug: '\x1b[35m', // Magenta
  verbose: '\x1b[32m', // Green
  silly: '\x1b[37m', // White
  reset: '\x1b[0m', // Reset color
  module: '\x1b[90m', // Gray for module names
  timestamp: '\x1b[90m', // Gray for timestamps
};

// Smart timestamp tracking
let lastDate = null;

// Smart timestamp formatter
const smartTimestamp = format.timestamp({
  format: () => {
    const now = new Date();
    // Use UTC for server logs (standard practice)
    const utcTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);
    
    const currentDate = {
      year: parseInt(utcTime.find(part => part.type === 'year').value),
      month: parseInt(utcTime.find(part => part.type === 'month').value),
      day: parseInt(utcTime.find(part => part.type === 'day').value),
      hours: parseInt(utcTime.find(part => part.type === 'hour').value),
      minutes: parseInt(utcTime.find(part => part.type === 'minute').value),
      seconds: parseInt(utcTime.find(part => part.type === 'second').value),
    };

    let timestampFormat = '';

    // If this is the first log or date has changed, show full date
    if (
      !lastDate ||
      lastDate.year !== currentDate.year ||
      lastDate.month !== currentDate.month ||
      lastDate.day !== currentDate.day
    ) {
      // Show year only if it's different from last time
      if (!lastDate || lastDate.year !== currentDate.year) {
        timestampFormat = `${currentDate.year}-`;
      }

      // Show month-day
      timestampFormat += `${String(currentDate.month).padStart(
        2,
        '0'
      )}-${String(currentDate.day).padStart(2, '0')} `;
    }

    // Always show time
    timestampFormat += `${String(currentDate.hours).padStart(
      2,
      '0'
    )}:${String(currentDate.minutes).padStart(2, '0')}:${String(
      currentDate.seconds
    ).padStart(2, '0')}`;

    // Update tracking
    lastDate = currentDate;

    return timestampFormat;
  },
});

// Custom format function with colors
const customFormat = format.printf(
  ({ timestamp, level, message, module, ...meta }) => {
    const color = levelColors[level] || levelColors.reset;
    const moduleColor = levelColors.module;
    const timestampColor = levelColors.timestamp;
    const reset = levelColors.reset;

    const label = module ? `${moduleColor}(${module})${reset} ` : '';
    const metaString = Object.keys(meta).length
      ? ` ${JSON.stringify(meta)}`
      : '';

    return `${timestampColor}[${timestamp}]${reset} ${color}${level.toUpperCase()}${reset}: ${label}${message}${metaString}`;
  }
);

// Base logger configuration
const baseLogger = createLogger({
  level: logLevel,
  transports: [
    new transports.Console({
      format: format.combine(smartTimestamp, customFormat),
    }),
    dailyRotate, // file transport with separate format below
  ],
});

/**
 * Returns a logger instance that prefixes logs with a module name.
 * @param {string} moduleName - Typically path.basename(__filename).replace('.js','')
 */
function getLogger(moduleName) {
  const logger = baseLogger.child({ module: moduleName });

  // Add a method to force full timestamps for important messages
  logger.debugWithFullTimestamp = (message, meta = {}) => {
    // Force a full timestamp by temporarily resetting the lastDate
    const originalLastDate = lastDate;
    lastDate = null;

    // Log with full timestamp
    logger.debug(message, meta);

    // Restore the original lastDate
    lastDate = originalLastDate;
  };

  return logger;
}

/**
 * Helper function to create a logger from a file path
 * Automatically extracts module name from __filename
 * @param {string} filePath - The __filename from the calling module
 * @returns {Object} Logger instance
 */
function requireLogger(filePath) {
  const path = require('path');
  const moduleName = path.join(
    path.basename(path.dirname(filePath)),
    path.basename(filePath).replace(/\.(js|ts)$/, '')
  );
  return getLogger(moduleName);
}

module.exports = { baseLogger, getLogger, requireLogger };
