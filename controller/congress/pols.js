/**
 * @fileoverview Politician List Retrieval Controller
 *
 * This controller handles retrieving a list of all politicians serving in
 * Congress. It filters results to only include politicians with has_stakes
 * flag set to true (those in competitive races with serious challengers).
 *
 * BUSINESS LOGIC
 *
 * POLITICIAN FILTERING
 * - Retrieves all politicians from database
 * - Filters to only include those with has_stakes: true
 * - has_stakes indicates: seeking re-election, has raised funds, has serious challenger
 * - Used for donation targeting and prioritization
 *
 * RESPONSE FORMAT
 * - Returns array of politician objects
 * - Each object includes: id, name, party, roles, social media, etc.
 * - Filtered list excludes non-competitive races
 *
 * DEPENDENCIES
 * - models/Pol: Politician model for database operations
 * - services/logger: Logging
 *
 * @module controller/congress/pols
 * @requires ../../services/logger
 * @requires ../../models/Pol
 */

const { requireLogger } = require('../../services/logger');
const logger = requireLogger(__filename);

module.exports = {
  /**
   * Retrieves list of politicians with stakes (competitive races)
   *
   * This function retrieves all politicians from the database and filters
   * to only include those with has_stakes: true. This flag indicates the
   * politician is in a competitive race and is actively seeking re-election.
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} model - Politician model for database operations
   * @returns {Promise<void>} Resolves when politician list is returned
   * @throws {422} Database error
   *
   * @example
   * ```javascript
   * const { getPols } = require('./controller/congress/pols');
   * await getPols(req, res, Pol);
   * ```
   */
  getPols: (req, res, model) => {
    logger.debug('getPols called', {
      method: req.method,
      path: req.path,
      hasModel: !!model,
    });
    model
      .find({})
      .then((dbModel) => {
        const filtered = dbModel.filter((p) => p.has_stakes);
        logger.debug('getPols response', {
          total: dbModel.length,
          filtered: filtered.length,
          responseType: 'json',
        });
        res.json(filtered);
      })
      .catch((err) => {
        logger.error('getPols error', { error: err.message, stack: err.stack });
        res.status(422).json(err);
      });
  },
};
