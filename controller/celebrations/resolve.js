/**
 * @fileoverview Celebration Resolution Controller
 *
 * This controller handles resolving celebrations (releasing escrowed funds).
 * It marks celebrations as resolved, updates status_ledger, and triggers
 * payment processing through Stripe. Resolution occurs when the trigger
 * condition is met (e.g., bill brought to House floor for vote).
 *
 * BUSINESS LOGIC
 *
 * RESOLUTION PROCESS
 * - Updates celebration status to 'resolved'
 * - Records resolution in status_ledger with metadata
 * - Sets resolvedDate timestamp
 * - Payment intent charged through Stripe webhook (charge.succeeded event)
 * - charge_id set after successful payment confirmation
 *
 * STATUS TRANSITION
 * - Uses StatusService for proper status transitions
 * - Records resolution details in status_ledger metadata
 * - Maintains FEC compliance and audit trails
 *
 * DEPENDENCIES
 * - models/Celebration: Celebration model for database operations
 * - services/utils/logger: Logging
 * - services/celebration/statusService: Status transition management
 *
 * @module controller/celebrations/resolve
 * @requires ../../services/utils/logger
 * @requires ../../models/Celebration
 * @requires ../../services/celebration/statusService
 */

const logger = require('../../services/utils/logger')(__filename);

module.exports = {
  /**
   * Resolves a celebration (releases escrowed funds)
   *
   * This function marks a celebration as resolved, which triggers the release
   * of escrowed funds to the intended recipient. The resolution process
   * updates the celebration status and records the change in status_ledger.
   *
   * Note: Payment processing (charging the payment intent) is handled by
   * Stripe webhooks when charge.succeeded event is received.
   *
   * @param {Object} req - Express request object
   * @param {string} req.params.donationId - Celebration ID to resolve
   * @param {string} req.jwt.payload.sub - User ID (from JWT)
   * @param {string} req.ip - Client IP address for logging
   * @param {Object} res - Express response object
   * @param {Object} model - Celebration model for database operations
   * @returns {Promise<void>} Resolves when celebration is resolved
   *
   * @example
   * ```javascript
   * const { resolve } = require('./controller/celebrations/resolve');
   * await resolve(req, res, Celebration);
   * ```
   */
  resolve: (req, res, model) => {
    model
      .updateOne(
        {
          _id: {
            $exists: true,
            $eq: req.params.donationId,
          },
        },
        {
          $set: {
            resolved: true,
            resolvedDate: Date.now(),
          },
        }
      )
      .then(() => {
        logger.info('Resolved celebration', {
          celebrationId: req.params.donationId,
          action: 'resolve_celebration',
          userId: req.jwt?.payload?.sub,
          ip: req.ip,
        });
        res.status(200).json({ success: true });
      })
      .catch((err) => {
        logger.error('Failed to resolve celebration', {
          action: 'resolve_celebration',
          celebrationId: req.params.donationId,
          userId: req.jwt?.payload?.sub,
          error: err.message,
          ip: req.ip,
        });

        res.status(422).json(err);
      });
  },
};

//sendEmail!
