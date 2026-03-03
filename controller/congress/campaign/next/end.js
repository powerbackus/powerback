/**
 * @fileoverview Next Campaign Cycle End Date Calculator
 *
 * This module calculates the end date of the next campaign cycle. The next
 * cycle ends 2 years after the current cycle end date (December 31st of
 * the next even year after the current cycle).
 *
 * BUSINESS LOGIC
 *
 * NEXT CYCLE CALCULATION
 * - Gets current campaign cycle end date
 * - Adds 2 years to get next cycle end
 * - Returns formatted date string
 *
 * DEPENDENCIES
 * - ../this: Current campaign cycle calculation
 * - ./next: Date formatting function
 *
 * @module controller/congress/campaign/next/end
 * @requires ../this
 * @requires ./next
 */

const { thisCampaign } = require('../this'),
  { next } = require('./next');

module.exports = {
  /**
   * Calculates the end date of the next campaign cycle
   *
   * This function determines when the next campaign cycle will end by
   * taking the current cycle end date and adding 2 years.
   *
   * @returns {string} Formatted date string for next cycle end
   *
   * @example
   * ```javascript
   * const { nextEnd } = require('./controller/congress/campaign/next/end');
   * const endDate = nextEnd();
   * // Returns: "December 31, 2026" (formatted string)
   * ```
   */
  nextEnd: () => {
    let { end } = thisCampaign();
    return next(end);
  },
};
