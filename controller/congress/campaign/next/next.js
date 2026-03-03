/**
 * @fileoverview Campaign Cycle Date Formatter
 *
 * This module provides date formatting for campaign cycle boundaries. It takes
 * a date boundary (start or end) and calculates the corresponding date 2 years
 * in the future, then formats it as a human-readable string.
 *
 * BUSINESS LOGIC
 *
 * DATE CALCULATION
 * - Takes a boundary date (start or end of current cycle)
 * - Adds 2 years to get next cycle boundary
 * - Formats as human-readable string (e.g., "January 1, 2025")
 *
 * FORMATTING
 * - Uses toLocaleString with US locale
 * - Format: "Month Day, Year" (e.g., "January 1, 2025")
 *
 * USAGE
 * Used by nextStart() and nextEnd() to format next cycle dates.
 *
 * @module controller/congress/campaign/next/next
 */

module.exports = {
  /**
   * Calculates and formats the next cycle boundary date
   *
   * This function takes a date boundary (start or end of current cycle) and
   * calculates the corresponding date 2 years in the future, then formats it
   * as a human-readable string.
   *
   * @param {Date} bound - Boundary date from current cycle
   * @returns {string} Formatted date string (e.g., "January 1, 2025")
   *
   * @example
   * ```javascript
   * const { next } = require('./controller/congress/campaign/next/next');
   * const nextDate = next(new Date(2025, 0, 1));
   * // Returns: "January 1, 2025"
   * ```
   */
  next: (bound) => {
    let getNextCampaignBoundedYearDateInMilliseconds = (boundedYear) => {
      return boundedYear.setFullYear(new Date(boundedYear).getFullYear() + 2);
    };
    const prettyDate = (milliseconds) => {
      return new Date(milliseconds).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };
    return prettyDate(getNextCampaignBoundedYearDateInMilliseconds(bound));
  },
};
