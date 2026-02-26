/**
 * @fileoverview Celebrations by User ID Query Controller
 *
 * This controller retrieves all celebrations (donations) for a specific user.
 * It queries the Celebration model to find all records where donatedBy matches
 * the provided userId, returning them in creation order.
 *
 * BUSINESS LOGIC
 *
 * USER CELEBRATION QUERY
 * - Finds all celebrations where donatedBy matches userId
 * - Returns celebrations in database order (typically chronological)
 * - Includes all celebration statuses (active, resolved, paused, defunct)
 *
 * DEPENDENCIES
 * - models/Celebration: Celebration model for database operations
 *
 * @module controller/celebrations/find/params/byUserId
 * @requires ../../../../models/Celebration
 */

module.exports = {
  /**
   * Retrieves all celebrations for a specific user
   *
   * This function queries the database to find all celebration records
   * associated with a specific user ID. Returns all celebrations regardless
   * of status (active, resolved, paused, defunct).
   *
   * @param {Object} req - Express request object
   * @param {string} req.params.userId - User ID to retrieve celebrations for
   * @param {Object} res - Express response object
   * @param {Object} model - Celebration model for database operations
   * @returns {Promise<void>} Resolves when celebrations are returned
   * @throws {422} Database error
   *
   * @example
   * ```javascript
   * const { byUserId } = require('./controller/celebrations/find/params/byUserId');
   * await byUserId(req, res, Celebration);
   * ```
   */
  byUserId: (req, res, model) => {
    model
      .find({ donatedBy: req.params.userId })
      .then((dbModel) => res.json(dbModel))
      .catch((err) => res.status(422).json(err));
  },
};
