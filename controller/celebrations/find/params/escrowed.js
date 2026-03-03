/**
 * @fileoverview Escrowed Celebrations Aggregation Controller
 *
 * This controller aggregates escrowed celebration data by politician, showing
 * how much money is currently held in escrow for each candidate. It delegates
 * to the shared getEscrowedTotalsByPol in the celebration dataService (same
 * rules: active only, current election cycle, has_stakes).
 *
 * @module controller/celebrations/find/params/escrowed
 * @requires ../../../../services/celebration/dataService
 */

const {
  getEscrowedTotalsByPol,
} = require('../../../../services/celebration/dataService');

module.exports = {
  /**
   * Aggregates escrowed celebration data by politician
   *
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query conditions for filtering celebrations
   * @param {Object} res - Express response object
   * @param {Object} model - Celebration model for database operations
   * @returns {Promise<void>} Resolves when aggregated data is returned
   * @throws {422} Database error
   */
  escrowed: async (req, res, model) => {
    try {
      const arr = await getEscrowedTotalsByPol(req.query, model);
      res.json(arr);
    } catch (err) {
      res.status(422).json(err);
    }
  },
};
