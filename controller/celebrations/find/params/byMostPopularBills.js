/**
 * @fileoverview Celebrations by Most Popular Bills Query Controller
 *
 * This controller aggregates celebration data by bill popularity, showing which
 * bills have the most donations and total donation amounts. It sorts celebrations
 * by date and aggregates donation totals per bill.
 *
 * BUSINESS LOGIC
 *
 * AGGREGATION PROCESS
 * - Queries celebrations matching request query conditions
 * - Sorts by date (newest first)
 * - Aggregates donations by bill_id
 * - Counts number of donations per bill
 * - Returns array with bill_id, total donation, and count
 *
 * SORTING
 * - Sorts by date field in descending order (newest first)
 * - Ensures most recent donations appear first
 *
 * DEPENDENCIES
 * - models/Celebration: Celebration model for database operations
 *
 * @module controller/celebrations/find/params/byMostPopularBills
 * @requires ../../../../models/Celebration
 */

module.exports = {
  /**
   * Aggregates celebrations by bill popularity
   *
   * This function queries celebrations matching the request query conditions,
   * sorts them by date, and aggregates donation totals by bill_id. Returns
   * an array showing which bills have the most donations and total amounts.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query conditions for filtering celebrations
   * @param {Object} res - Express response object
   * @param {Object} model - Celebration model for database operations
   * @returns {Promise<void>} Resolves when aggregated data is returned
   * @returns {Array} Array of objects with bill_id, donation (total), and count
   * @throws {422} Database error
   *
   * @example
   * ```javascript
   * const { byMostPopularBills } = require('./controller/celebrations/find/params/byMostPopularBills');
   * await byMostPopularBills(req, res, Celebration);
   * // Returns: [{ bill_id: 'hjres54-119', donation: 5000, count: 25 }, ...]
   * ```
   */
  byMostPopularBills: (req, res, model) => {
    model
      .find(req.query, { bill_id: 1, donation: 1 })
      .sort({ date: -1 })
      .then((dbModel) => {
        // h/t @J.S.
        let c = {}; // aggregate donations by candidate
        dbModel.forEach((d /*donation*/) => {
          c[d.bill_id] = (c[d.bill_id] || 0) + 1;
        });
        let arr = Array.from(
          dbModel.reduce(
            // reduce donation amounts
            (m, { bill_id, donation }) =>
              m.set(bill_id, (m.get(bill_id) || 0) + (donation || 0)),
            new Map()
          ),
          ([bill_id, donation]) => ({ bill_id, donation })
        );
        arr.forEach((element) => (element.count = c[element.bill_id]));
        res.json(arr);
      })
      .catch((err) => res.status(422).json(err));
  },
};
