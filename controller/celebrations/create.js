/**
 * @fileoverview Celebration Creation Controller
 *
 * This controller handles the creation of celebration records in the database.
 * It creates the celebration document with all required fields including
 * donation amount, politician information, donor information snapshot, and
 * payment intent details. The celebration is created in 'active' status
 * awaiting trigger condition.
 *
 * BUSINESS LOGIC
 *
 * CELEBRATION CREATION
 * - Creates celebration document with req.body data
 * - Sets initial status to 'active' with status_ledger entry
 * - Stores immutable donor information snapshot for FEC compliance
 * - Links payment_intent (created but not charged)
 * - Records idempotencyKey to prevent duplicates
 *
 * STATUS INITIALIZATION
 * - Initial status entry created via StatusService
 * - Records creation metadata in status_ledger
 * - Sets legacy boolean flags (resolved: false, defunct: false, paused: false)
 *
 * DEPENDENCIES
 * - models/Celebration: Celebration model for database operations
 * - services/utils/logger: Logging
 *
 * @module controller/celebrations/create
 * @requires ../../services/utils/logger
 * @requires ../../models/Celebration
 */

const logger = require('../../services/utils/logger')(__filename);

module.exports = {
  /**
   * Creates a new celebration record in the database
   *
   * This function creates a celebration document with all required fields
   * including donation amount, politician information, donor information
   * snapshot, and payment intent details. The celebration is created in
   * 'active' status awaiting trigger condition.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.body - Celebration creation data
   * @param {string} req.body.donatedBy - User ID making the donation
   * @param {number} req.body.donation - Donation amount in dollars
   * @param {number} req.body.fee - Stripe processing fee
   * @param {string} req.body.pol_id - Politician ID receiving the donation
   * @param {string} req.body.bill_id - Bill ID associated with the donation
   * @param {Object} req.body.donorInfo - Donor information snapshot
   * @param {string} req.body.idempotencyKey - Unique key for idempotency
   * @param {Object} res - Express response object (not used, returns document)
   * @param {Object} model - Celebration model for database operations
   * @returns {Promise<Object>} Created celebration document
   * @throws {Error} Database error if creation fails
   *
   * @example
   * ```javascript
   * const { create } = require('./controller/celebrations/create');
   * const celebration = await create(req, res, Celebration);
   * ```
   */
  create: async (req, res, model) => {
    try {
      const doc = await model.create(req.body);
      logger.info('Celebration created', {
        action: 'create_celebration',
        userId: req.jwt?.payload?.sub,
        id: doc._id,
        ip: req.ip,
      });
      return doc; // Return the document instead of sending response
    } catch (err) {
      logger.error('Failed to create celebration', {
        action: 'create_celebration',
        userId: req.jwt?.payload?.sub,
        error: err.message,
        ip: req.ip,
      });
      throw err; // Throw error instead of sending response
    }
  },
};
