/**
 * @fileoverview Current Campaign Cycle Calculator
 *
 * This module calculates the current campaign cycle date range. Campaign cycles
 * are 2-year periods that span from January 1st of an odd year to December 31st
 * of the following even year. Used for election cycle calculations and Compliant
 * tier per-election limit resets.
 *
 * BUSINESS LOGIC
 *
 * CAMPAIGN CYCLE CALCULATION
 * - Campaign cycles are 2-year periods
 * - Start: January 1st of odd year
 * - End: December 31st of even year
 * - Example: 2025-2026 cycle (Jan 1, 2025 - Dec 31, 2026)
 *
 * YEAR DETERMINATION
 * - If current year is odd: start = current year, end = current year + 1
 * - If current year is even: start = current year - 1, end = current year + 1
 * - Ensures cycle always spans 2 years
 *
 * USAGE
 * Used by election cycle calculations to determine the current campaign cycle
 * boundaries for Compliant tier per-election limit calculations.
 *
 * @module controller/congress/campaign/this
 */

module.exports = {
  /**
   * Calculates the current campaign cycle date range
   *
   * This function determines the start and end dates of the current campaign
   * cycle. Campaign cycles are 2-year periods from January 1st of an odd year
   * to December 31st of the following even year.
   *
   * @returns {Object} Campaign cycle date range
   * @returns {Date} result.start - Campaign cycle start date (Jan 1, odd year, 00:00:00)
   * @returns {Date} result.end - Campaign cycle end date (Dec 31, even year, 23:59:59)
   *
   * @example
   * ```javascript
   * const { thisCampaign } = require('./controller/congress/campaign/this');
   * const cycle = thisCampaign();
   * // Returns: { start: Date(2025-01-01), end: Date(2026-12-31) }
   * ```
   */
  thisCampaign: () => {
    const dateSetter = (year, month, date) => {
      let d = new Date();
      d.setFullYear(year);
      d.setMonth(month);
      d.setDate(date);
      d.setHours(0);
      d.setMinutes(0);
      d.setSeconds(0);
      d.setMilliseconds(0);
      return d;
    };

    const setStartEndYears = () => {
      let thisYear, startYear, endYear;
      let d = new Date();
      thisYear = d.getFullYear();
      if (thisYear % 2 === 1) startYear = thisYear;
      else startYear = thisYear - 1;
      endYear = thisYear + 1;
      return { start: startYear, end: endYear };
    };

    const getYears = setStartEndYears();

    let startCampaign = dateSetter(getYears.start, 0, 1),
      endCampaign = dateSetter(getYears.end, 11, 31);

    return {
      start: startCampaign,
      end: endCampaign,
    };
  },
};
