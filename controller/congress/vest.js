/**
 * @fileoverview Politician Stakes Verification Controller
 *
 * This controller verifies if a politician has stakes (is in a competitive race).
 * The has_stakes flag indicates the politician is seeking re-election, has raised
 * funds, and has a serious challenger. Used for donation targeting and prioritization.
 *
 * BUSINESS LOGIC
 *
 * ELIGIBILITY (payment / donation gate)
 * - Requires has_stakes: true (watcher competitive set)
 * - Requires roster_excluded not true (policy exclusions: Speaker, left office, etc.)
 *
 * HAS_STAKES FLAG
 * - Indicates: seeking re-election, has raised funds, has serious challenger
 * - Updated via background jobs based on FEC data
 * - Used to prioritize competitive races for donations
 *
 * DEPENDENCIES
 * - models/Pol: Politician model for database operations
 *
 * @module controller/congress/vest
 * @requires ../../models/Pol
 */

module.exports = {
  /**
   * Verifies if a politician has stakes (competitive race)
   *
   * This function checks if a politician has the has_stakes flag set to true,
   * indicating they are in a competitive race and actively seeking re-election.
   *
   * @param {string} pol_id - Politician bioguide ID
   * @param {Object} model - Politician model for database operations
   * @returns {Promise<boolean>} True if politician has stakes, false otherwise
   *
   * @example
   * ```javascript
   * const { vest } = require('./controller/congress/vest');
   * const hasStakes = await vest('A000055', Pol);
   * // Returns: true if politician is in competitive race
   * ```
   */
  vest: async (pol_id, model) => {
    return await Boolean(
      model.countDocuments({
        id: {
          $eq: pol_id,
        },
        has_stakes: {
          $eq: true,
        },
        roster_excluded: { $ne: true },
      })
    );
  },
};
