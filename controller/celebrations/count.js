/**
 * @fileoverview Celebration Count Controller
 *
 * This controller calculates the ordinal position (sequence number) of a
 * celebration within a user's donation history. The ordinal is used in
 * receipt emails to show users which donation number this is (e.g., "Your
 * 3rd donation").
 *
 * BUSINESS LOGIC
 *
 * ORDINAL CALCULATION
 * - Finds all celebrations for the user, sorted by creation date (_id)
 * - Locates the current celebration's position in the sorted array
 * - Returns 1-based index (1st, 2nd, 3rd, etc.)
 * - Returns total count if celebration not found in sorted list
 *
 * SORTING
 * - Uses _id field for sorting (MongoDB ObjectIds include timestamp)
 * - Ensures chronological order of donations
 * - More reliable than createdAt for ordering
 *
 * DEPENDENCIES
 * - models/Celebration: Celebration model for database operations
 *
 * @module controller/celebrations/count
 * @requires ../../models/Celebration
 */

const { Celebration } = require('../../models');

module.exports = {
  /**
   * Calculates the ordinal position of a celebration in user's donation history
   *
   * This function determines which donation number this celebration represents
   * for the user (1st, 2nd, 3rd, etc.) by finding its position in the chronologically
   * sorted list of all user's celebrations.
   *
   * @param {Object} celebration - Celebration document
   * @param {ObjectId} celebration.donatedBy - User ID who made the donation
   * @param {ObjectId} celebration._id - Celebration ID
   * @returns {Promise<number>} Ordinal position (1-based) or total count if not found
   *
   * @example
   * ```javascript
   * const { count } = require('./controller/celebrations/count');
   * const ordinal = await count(celebrationDocument);
   * // Returns: 3 (for 3rd donation)
   * ```
   */
  count: async (celebration) => {
    const sorted = await Celebration.find({
      donatedBy: { $eq: celebration.donatedBy },
    }).sort({ _id: 1 });

    const getIndex = sorted
      .map((c) => c._id.toString())
      .indexOf(celebration._id);

    if (getIndex === -1) return sorted.length;
    else return getIndex + 1;
  },
};
