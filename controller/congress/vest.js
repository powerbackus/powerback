/**
 * @fileoverview Politician Stakes Verification Controller
 *
 * This controller verifies if a politician has stakes (is in a competitive race).
 * The has_stakes flag indicates the politician is seeking re-election, has raised
 * funds, and has a serious challenger. Used for donation targeting and prioritization.
 *
 * BUSINESS LOGIC
 *
 * STAKES VERIFICATION
 * - Checks if politician has has_stakes: true flag
 * - Returns boolean indicating competitive race status
 * - Used to filter politicians for donation targeting
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
      })
    );
  },
};
