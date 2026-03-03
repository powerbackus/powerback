/**
 * @fileoverview Async User Celebrations Query Controller
 *
 * This controller asynchronously retrieves all celebrations for a specific user.
 * It's used internally by services and controllers that need user celebration
 * data without Express request/response objects. Returns a promise with the
 * celebration array.
 *
 * BUSINESS LOGIC
 *
 * USER CELEBRATION QUERY
 * - Finds all celebrations where donatedBy matches userId
 * - Returns promise with celebration array
 * - Used by services for internal data access
 * - Includes all celebration statuses
 *
 * ERROR HANDLING
 * - Logs errors to console
 * - Re-throws errors for caller to handle
 *
 * DEPENDENCIES
 * - models/Celebration: Celebration model for database operations
 * - services/utils/logger: Logging
 *
 * @module controller/celebrations/find/async/asyncUser
 * @requires ../../../../models/Celebration
 * @requires ../../../../services/logger
 */

const { requireLogger } = require('../../../../services/logger');
const logger = requireLogger(__filename);

module.exports = {
  /**
   * Asynchronously retrieves all celebrations for a user
   *
   * This function queries the database to find all celebration records
   * for a specific user. Returns a promise that resolves with the celebration
   * array, making it suitable for use in services and async contexts.
   *
   * @param {string} userId - User ID to retrieve celebrations for
   * @param {Object} model - Celebration model for database operations
   * @returns {Promise<Array>} Array of celebration documents
   * @throws {Error} Database error if query fails
   *
   * @example
   * ```javascript
   * const { asyncUser } = require('./controller/celebrations/find/async/asyncUser');
   * const celebrations = await asyncUser('user123', Celebration);
   * ```
   */
  asyncUser: async (userId, model) => {
    return await model.find({ donatedBy: userId }).catch((err) => {
      logger.error('Error fetching user celebrations:', err);
      throw err;
    });
  },
};
