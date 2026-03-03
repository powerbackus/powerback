/**
 * @fileoverview Next Campaign Cycle Start Date Calculator
 *
 * This module calculates the start date of the next campaign cycle. The next
 * cycle starts 2 years after the current cycle start date (January 1st of
 * the next odd year after the current cycle).
 *
 * BUSINESS LOGIC
 *
 * NEXT CYCLE CALCULATION
 * - Gets current campaign cycle start date
 * - Adds 2 years to get next cycle start
 * - Returns formatted date string
 *
 * DEPENDENCIES
 * - ../this: Current campaign cycle calculation
 * - ./next: Date formatting function
 *
 * @module controller/congress/campaign/next/start
 * @requires ../this
 * @requires ./next
 */

const { thisCampaign } = require('../this'),
  { next } = require('./next');

module.exports = {
  /**
   * Calculates the start date of the next campaign cycle
   *
   * This function determines when the next campaign cycle will begin by
   * taking the current cycle start date and adding 2 years.
   *
   * @returns {string} Formatted date string for next cycle start
   *
   * @example
   * ```javascript
   * const { nextStart } = require('./controller/congress/campaign/next/start');
   * const startDate = nextStart();
   * // Returns: "January 1, 2025" (formatted string)
   * ```
   */
  nextStart: () => {
    let { start } = thisCampaign();
    return next(start);
  },
};
