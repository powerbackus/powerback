/**
 * @fileoverview General Election Date Calculator
 *
 * This module calculates the general election date according to U.S. federal
 * law. General elections are held on the first Tuesday after the first Monday
 * in November of even-numbered years. This date is used for election cycle
 * calculations and Compliant tier per-election limit resets.
 *
 * BUSINESS LOGIC
 *
 * ELECTION DATE CALCULATION
 * - General election: First Tuesday after first Monday in November
 * - Even-numbered years only (election years)
 * - If first Tuesday is the 1st, moves to second Tuesday (after first Monday)
 * - Timezone calibrated to EST (Eastern Standard Time)
 * - Returns date set to midnight (00:00:00)
 *
 * CALCULATION STEPS
 * 1. Calibrate timezone to EST
 * 2. Set to November 1st
 * 3. Calculate days to first Tuesday
 * 4. If result is 1st, move to 8th (second Tuesday)
 * 5. Reset to midnight
 *
 * USAGE
 * Used by cutoff() function to determine election cycle boundaries for
 * Compliant tier per-election limit calculations.
 *
 * @module controller/congress/campaign/cycle
 */

module.exports = {
  /**
   * Calculates the general election date for a given year
   *
   * This function calculates the general election date according to U.S. federal
   * law: the first Tuesday after the first Monday in November. If the first
   * Tuesday is the 1st, it moves to the second Tuesday (8th) to ensure it comes
   * after the first Monday.
   *
   * @param {Date} d - Date object (year is used, other fields may be modified)
   * @returns {Date} General election date set to midnight EST
   *
   * @example
   * ```javascript
   * const { cycle } = require('./controller/congress/campaign/cycle');
   * const electionDate = cycle(new Date(2026, 0, 1));
   * // Returns: Date object for November 5, 2026 00:00:00 EST
   * ```
   */
  cycle: (d) => {
    // calibrate timezone
    d.setHours(d.getHours() + d.getTimezoneOffset() / 60);
    // start at 1st
    d.setDate(1);
    // 10 is November
    d.setMonth(10);
    // set date modularly to first Tuesday
    d.setDate(d.getDate() + ((9 - d.getDay()) % 7));
    // not first Tuesday and the 1st as law states must come after first Monday
    if (d.getDate() === 1) d.setDate(8);
    // reset clock to midnight
    d.setHours(0, 0, 0, 0);
    return d;
  },
};
