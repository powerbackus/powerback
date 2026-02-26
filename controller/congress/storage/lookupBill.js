/**
 * @fileoverview Bill Lookup Controller
 *
 * This controller handles looking up bill data from the local database.
 * It queries the Bill model to find a bill by its bill_id. This is a simple
 * lookup function used when bill data is already cached locally.
 *
 * BUSINESS LOGIC
 *
 * BILL LOOKUP
 * - Queries local Bill model by bill_id
 * - Returns full bill document if found
 * - Returns null if bill not found
 *
 * DATA SOURCE
 * - Local database (Bill model)
 * - Data originally sourced from Congress.gov API
 * - Updated via background jobs (checkHJRes54.js)
 *
 * DEPENDENCIES
 * - models/Bill: Bill model for database operations
 *
 * @module controller/congress/storage/lookupBill
 * @requires ../../../models/Bill
 */

const { Bill } = require('../../../models');

module.exports = {
  /**
   * Looks up a bill by bill_id in the local database
   *
   * This function queries the Bill model to find a bill by its bill_id.
   * Returns the full bill document including sponsor information, legislative
   * history, vote records, and status.
   *
   * @param {string} bill_id - Bill identifier (e.g., 'hjres54-119')
   * @returns {Promise<Object|null>} Bill document or null if not found
   *
   * @example
   * ```javascript
   * const { lookupBill } = require('./controller/congress/storage/lookupBill');
   * const bill = await lookupBill('hjres54-119');
   * ```
   */
  lookupBill: async (bill_id) => {
    return await Bill.findOne({ bill_id: bill_id });
  },
};
