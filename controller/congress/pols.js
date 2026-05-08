/**
 * @fileoverview Politician List Retrieval Controller
 *
 * This controller handles retrieving a list of all politicians serving in
 * Congress. It returns only those with has_stakes true who are not
 * roster_excluded (policy layer is separate from watcher stakes).
 *
 * BUSINESS LOGIC
 *
 * POLITICIAN FILTERING
 * - Queries politicians matching carousel / selectable roster rules
 * - Query: has_stakes true and roster_excluded not true
 * - has_stakes is watcher-derived; roster_excluded is separate policy
 * - Used for donation targeting and prioritization
 *
 * RESPONSE FORMAT
 * - Returns array of politician objects
 * - Each object includes: id, name, party, roles, social media, etc.
 * - Filtered list excludes non-competitive races and roster-excluded members
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
      .find({
        has_stakes: true,
        roster_excluded: { $ne: true },
      })
      .then((filtered) => {
        logger.debug('getPols response', {
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
