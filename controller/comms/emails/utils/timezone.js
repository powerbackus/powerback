const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const localizedFormat = require('dayjs/plugin/localizedFormat');
const timezone = require('dayjs/plugin/timezone');

const logger = require('../../../../services/utils/logger')(__filename);

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);

// Set default timezone to ET (Eastern Time - Washington DC timezone)
const DEFAULT_TIMEZONE = 'America/New_York';

/**
 * Get current time in ET
 * @returns {string} - Current time in ET
 */
const getCurrentTimeInET = () => {
  return (
    dayjs().tz(DEFAULT_TIMEZONE).format('MMMM Do[,] YYYY [at] LT') + ' ET'
  );
};

/**
 * Format a date in ET for outgoing communications
 * @param {Date|string} date - The date to format
 * @param {string} format - The format string (default: 'MMMM Do[,] YYYY [at] LT')
 * @returns {string} - Formatted date string in ET
 */
const formatInET = (date, format = 'MMMM Do[,] YYYY [at] LT') => {
  try {
    if (!date) {
      return 'Unknown date';
    }

    // Convert to ET and format
    return dayjs(date).tz(DEFAULT_TIMEZONE).format(format) + ' ET';
  } catch (error) {
    logger.error('Error formatting date in ET:', error);
    return 'Unknown date';
  }
};

/**
 * Convert UTC date to ET
 * @param {Date|string} utcDate - UTC date
 * @returns {Date} - Date in ET
 */
const utcToET = (utcDate) => {
  try {
    return dayjs(utcDate).tz(DEFAULT_TIMEZONE).toDate();
  } catch (error) {
    logger.error('Error converting UTC to ET:', error);
    return utcDate; // Return original if conversion fails
  }
};

module.exports = {
  DEFAULT_TIMEZONE,
  getCurrentTimeInET,
  formatInET,
  utcToET,
  // Legacy exports for backward compatibility
  getCurrentTimeInEST: getCurrentTimeInET,
  formatInEST: formatInET,
  utcToEST: utcToET,
  getCurrentTimeInCST: getCurrentTimeInET,
  formatInCST: formatInET,
  utcToCST: utcToET,
};
