/**
 * @fileoverview Election Cycle Cutoff Date Calculator
 *
 * This module determines if a donation date falls within the current election
 * cycle by comparing it against the general election date. Used for Compliant tier
 * per-election limit calculations to determine which donations count toward
 * the current election cycle.
 *
 * BUSINESS LOGIC
 *
 * ELECTION CYCLE DETERMINATION
 * - Uses cycle() function to calculate general election date
 * - Compares donation date to election date
 * - If donation is before current election date: counts toward current cycle
 * - If donation is after current election date: counts toward next cycle
 * - Returns boolean indicating if donation is in current cycle
 *
 * ELECTION DATE CALCULATION
 * - General election: First Tuesday after first Monday in November (even years)
 * - Uses cycle() function for date calculation
 * - Handles year boundaries and date comparisons
 *
 * DEPENDENCIES
 * - ./cycle: General election date calculation
 *
 * @module controller/congress/campaign/cutoff
 * @requires ./cycle
 */

const { cycle } = require('./cycle');

module.exports = {
  /**
   * Determines if a donation date falls within the current election cycle
   *
   * This function calculates the general election date and compares the
   * donation date to determine if it falls within the current election cycle.
   * Used for Compliant tier per-election limit calculations.
   *
   * @param {Date|string} donationDate - The date of the donation
   * @returns {boolean} True if donation is in current election cycle, false otherwise
   *
   * @example
   * ```javascript
   * const { cutoff } = require('./controller/congress/campaign/cutoff');
   * const inCurrentCycle = cutoff(new Date('2026-06-15'));
   * // Returns: true if date is before current general election date
   * ```
   */
  cutoff: (donationDate) => {
    let electionDate = cycle(new Date(donationDate));
    let isDonationOfCurrentElectionCycle =
      new Date(donationDate) < electionDate;
    if (!isDonationOfCurrentElectionCycle) {
      electionDate = cycle(
        new Date(electionDate.setFullYear(electionDate.getFullYear() + 1))
      );
      isDonationOfCurrentElectionCycle =
        new Date(donationDate) < electionDate && new Date() <= electionDate;
      return !isDonationOfCurrentElectionCycle;
    } else {
      return isDonationOfCurrentElectionCycle;
    }
  },
};
