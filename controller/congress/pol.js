/**
 * @fileoverview Single Politician Retrieval Controller
 *
 * This controller handles retrieving detailed information for a single
 * politician by their bioguide ID. It validates the politician exists
 * in the database before returning the data.
 *
 * BUSINESS LOGIC
 *
 * POLITICIAN LOOKUP
 * - Validates politician exists in database before returning
 * - Returns full politician document with all fields
 * - Includes roles, social media accounts, and committee assignments
 *
 * ERROR HANDLING
 * - Returns 400 if politician ID not provided
 * - Returns 400 if politician not found in database
 * - Returns 422 on database errors
 *
 * DEPENDENCIES
 * - models/Pol: Politician model for database operations
 * - services/utils/logger: Logging
 *
 * @module controller/congress/pol
 * @requires ../../services/utils/logger
 * @requires ../../models/Pol
 */

const logger = require('../../services/utils/logger')(__filename);

module.exports = {
  /**
   * Retrieves detailed information for a specific politician
   *
   * This function retrieves a politician document by bioguide ID, including
   * all roles, social media accounts, committee assignments, and other
   * biographical data. Validates the politician exists before returning.
   *
   * @param {Object} req - Express request object
   * @param {string} req.params.pol - Politician bioguide ID
   * @param {Object} res - Express response object
   * @param {Object} model - Politician model for database operations
   * @returns {Promise<void>} Resolves when politician data is returned
   * @throws {400} Politician ID not provided or not found
   * @throws {422} Database error
   *
   * @example
   * ```javascript
   * const { getPol } = require('./controller/congress/pol');
   * await getPol(req, res, Pol);
   * ```
   */
  getPol: (req, res, model) => {
    logger.debug('Pol request params:', req.params);
    const candidateId = req.params.pol;
    if (!candidateId)
      res.status(400).json({ error: 'Politician ID not provided' });
    else
      model
        .countDocuments({ id: { $eq: candidateId } })
        .then((inStorage) => {
          if (inStorage === 0) {
            res.status(400).json({ error: 'Politician not found in database' });
          } else
            model
              .findOne({ id: candidateId })
              .then((dbModel) => res.json(dbModel))
              .catch((err) => res.status(422).json(err));
        })
        .catch((err) => logger.error('Failed to get pol:', err));
  },
};
