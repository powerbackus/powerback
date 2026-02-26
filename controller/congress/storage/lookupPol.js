/**
 * @fileoverview Politician Lookup Controller
 *
 * This controller handles looking up politician data from the local database.
 * It queries the Pol model to find a politician by their bioguide ID. This is
 * a simple lookup function used when politician data is already cached locally.
 *
 * BUSINESS LOGIC
 *
 * POLITICIAN LOOKUP
 * - Queries local Pol model by bioguide ID
 * - Returns full politician document if found
 * - Returns null if politician not found
 *
 * DATA SOURCE
 * - Local database (Pol model)
 * - Data originally sourced from OpenFEC API and Congress.gov API
 * - Updated via background jobs (houseWatcher.js)
 *
 * DEPENDENCIES
 * - models/Pol: Politician model for database operations
 *
 * @module controller/congress/storage/lookupPol
 * @requires ../../../models/Pol
 */

module.exports = {
  /**
   * Looks up a politician by bioguide ID in the local database
   *
   * This function queries the Pol model to find a politician by their bioguide ID.
   * Returns the full politician document including roles, social media accounts,
   * and other biographical data.
   *
   * @param {string} polId - Politician bioguide ID
   * @param {Object} model - Politician model for database operations
   * @returns {Promise<Object|null>} Politician document or null if not found
   *
   * @example
   * ```javascript
   * const { lookupPol } = require('./controller/congress/storage/lookupPol');
   * const pol = await lookupPol('A000055', Pol);
   * ```
   */
  lookupPol: async (polId, model) => {
    return await model.findOne({ id: polId });
  },
};
