/**
 * @fileoverview Celebrations API routes for donation celebration management
 *
 * This module handles all API endpoints related to donation celebrations (pledges).
 * Celebrations are escrowed donations that are held until specific conditions are met
 * (e.g., Medicare For All is brought to the House floor for a vote).
 *
 * TABLE OF CONTENTS - API ENDPOINTS
 *
 * CELEBRATION CREATION & MANAGEMENT
 * ├── POST   /api/celebrations/                    - Create new celebration with FEC validation
 * ├── GET    /api/celebrations/user/:userId        - Get all celebrations for a user
 * ├── PATCH  /api/celebrations/:celebrationId      - Resolve celebration (release funds)
 * └── POST   /api/celebrations/receipt             - Generate celebration receipt
 *
 * ESCROW & AGGREGATION
 * └── GET    /api/celebrations/escrow              - Get aggregated escrow data by politician
 *
 * KEY FEATURES
 * - Modularized celebration creation using orchestration service
 * - FEC compliance validation before celebration creation
 * - Celebration lifecycle management (create, resolve, pause, defunct)
 * - User donation history and escrow tracking
 * - Receipt generation and email notifications
 * - PAC limit validation and email notifications
 * - Donor validation and flagging system
 *
 * MODULARIZED ARCHITECTURE
 * - POST /api/celebrations uses orchestrationService.createCelebration()
 * - All business logic moved to dedicated service modules:
 *   - validationService: FEC compliance and PAC limits
 *   - emailService: Email notifications and receipts
 *   - orchestrationService: Main flow coordination
 *
 * FEC COMPLIANCE
 * - All celebration creation requests are validated against FEC regulations
 * - Per-donation limits, annual caps, and per-election limits are enforced
 * - Enhanced validation with election cycle resets for Compliant tier users
 * - Legacy validation fallback for reliability
 *
 * @module routes/api/celebrations *
 * @requires express-rate-limit
 * @requires express
 * @requires path
 * @requires ../../controller/celebrations
 * @requires ../../controller/comms/emails
 * @requires ../../controller/users
 * @requires ../../services/logger
 * @requires ../../auth/tokenizer
 * @requires ../../validation
 * @requires ../../models
 */

const router = require('express').Router();
const {
    createCelebration,
  } = require('../../services/celebration/orchestrationService'),
  logger = require('../../services/utils/logger')(__filename),
  Controller = require('../../controller/celebrations'),
  { Celebration, User, Pol } = require('../../models'),
  { rateLimiters } = require('../../services/utils'),
  tokenizer = require('../../auth/tokenizer'),
  { validate } = require('../../validation'),
  schemas = require('../../validation');

const celebrationLimiter = rateLimiters.celebrations;

// All routes prefixed with '/api/celebrations'

/**
 * POST /api/celebrations
 * Creates a new donation celebration with comprehensive validation
 *
 * This endpoint uses the orchestrationService to handle the complete celebration flow:
 * 1. FEC compliance validation (per-donation, annual cap, per-election limits)
 * 2. PAC limit validation for tips with email notifications
 * 3. Donor validation and flagging system
 * 4. Celebration creation in database
 * 5. Email receipt generation (New.js for first-time users, Receipt.js for returning users)
 *
 * The celebration is held in escrow until the specified condition is met
 * (currently: Medicare For All is brought to the House floor for a vote).
 *
 * @param {Object} req.body - Celebration creation data
 * @param {string} req.body.donatedBy - User ID making the donation
 * @param {number} req.body.donation - Donation amount in dollars
 * @param {string} req.body.pol_id - Politician ID receiving the donation
 * @param {string} req.body.bill_id - Bill ID associated with the donation
 * @param {string} req.body.pol_name - Politician name
 * @param {string} req.body.FEC_id - FEC candidate ID
 * @param {number} req.body.tip - Optional tip amount
 * @param {string} req.body.idempotencyKey - Unique key for idempotency
 * @returns {Object} Created celebration object or error response
 *
 * @example
 * ```javascript
 * POST /api/celebrations
 * {
 *   "donatedBy": "507f1f77bcf86cd799439011",
 *   "donation": 100,
 *   "pol_id": "A000055",
 *   "bill_id": "hjres54-119",
 *   "pol_name": "Rep. Alexandria Ocasio-Cortez",
 *   "FEC_id": "H8NY15148",
 *   "tip": 5,
 *   "idempotencyKey": "unique-key-123"
 * }
 * ```
 */
router
  .route('/')
  .post(
    celebrationLimiter,
    tokenizer.guard(),
    validate(schemas.celebration),
    async (req, res) => {
      try {
        // Calculate Stripe processing fee based on donation amount
        req.body.fee =
          req.body.donation *
            parseInt(process.env.STRIPE_PROCESSING_PERCENTAGE) +
          parseInt(process.env.STRIPE_PROCESSING_ADDEND);

        // Use the orchestration service to handle the complete celebration flow
        const result = await createCelebration(req, res);

        // Handle the response based on the orchestration service result
        if (result.status === 201) {
          res.status(201).json(result.response);
        } else if (result.status === 400) {
          res.status(400).json(result.response);
        } else {
          res.status(result.status).json(result.response);
        }
      } catch (err) {
        logger.error('Failed to create celebration in route:', err);
        res.status(500).json({ error: 'Server error' });
      }
    }
  );

/**
 * GET /api/celebrations/user/:userId
 * Retrieves all celebrations for a specific user
 *
 * This endpoint returns all celebration records (donations) for a
 * specific user, including active, resolved, paused, and defunct
 * celebrations. The results are ordered by creation date (newest first).
 *
 * @route GET /api/celebrations/user/:userId
 * @param {string} userId - User ID to retrieve celebrations for
 * @returns {Array<Object>} Array of celebration objects
 * @throws {401} Unauthorized
 * @throws {403} Not authorized to access this user's celebrations
 * @throws {404} User not found
 *
 * @example
 * ```javascript
 * GET /api/celebrations/user/507f1f77bcf86cd799439011
 *
 * // Response
 * [
 *   {
 *     "_id": "celebration123",
 *     "donation": 100,
 *     "tip": 5,
 *     "pol_id": "A000055",
 *     "pol_name": "Rep. Alexandria Ocasio-Cortez",
 *     "bill_id": "hjres54-119",
 *     "current_status": "active",
 *     "resolved": false,
 *     "defunct": false,
 *     "paused": false,
 *     "createdAt": "2026-01-15T10:30:00.000Z"
 *   }
 * ]
 * ```
 */
router
  .route('/user/:userId')
  .get(tokenizer.guard(), (req, res) =>
    Controller.byUserId(req, res, Celebration)
  );

/**
 * GET /api/celebrations/escrow
 * Retrieves aggregated escrow data for all celebrations
 *
 * This endpoint returns donation totals aggregated by politician,
 * showing how much money is currently held in escrow for each candidate.
 * Only includes celebrations where the politician has stakes (is in a competitive race).
 *
 * @returns {Array} Array of aggregated escrow data objects
 * @example
 * ```javascript
 * [
 *   {
 *     pol_id: "A000055",
 *     donation: 1500,
 *     count: 15
 *   }
 * ]
 * ```
 */
router
  .route('/escrow')
  .get((req, res) => Controller.escrowed(req, res, Celebration));

/**
 * PATCH /api/celebrations/:celebrationId
 * Resolves a celebration (releases escrowed funds)
 *
 * This endpoint marks a celebration as resolved, which triggers the release
 * of escrowed funds to the intended recipient. This typically happens when
 * the specified condition is met (e.g., Medicare For All vote occurs).
 *
 * The resolution process:
 * 1. Validates celebration exists and is in active/paused status
 * 2. Updates celebration status to 'resolved'
 * 3. Records status change in status_ledger with metadata
 * 4. Charges the payment intent through Stripe
 * 5. Updates charge_id with successful payment confirmation
 *
 * @route PATCH /api/celebrations/:celebrationId
 * @param {string} celebrationId - ID of the celebration to resolve
 * @param {Object} req.body - Resolution data
 * @param {string} req.body.reason - Reason for resolution
 * @param {Object} [req.body.resolutionDetails] - Additional resolution metadata
 * @returns {Object} Success status and updated celebration
 * @throws {400} Invalid celebration ID or already resolved/defunct
 * @throws {401} Unauthorized
 * @throws {404} Celebration not found
 * @throws {500} Payment processing failed
 *
 * @example
 * ```javascript
 * PATCH /api/celebrations/celebration123
 * {
 *   "reason": "Bill brought to House floor for vote",
 *   "resolutionDetails": {
 *     "bill_action_date": "2026-03-15",
 *     "bill_action_type": "vote",
 *     "bill_action_result": "passed"
 *   }
 * }
 *
 * // Success response
 * {
 *   "success": true,
 *   "celebration": {
 *     "_id": "celebration123",
 *     "current_status": "resolved",
 *     "resolved": true,
 *     "charge_id": "ch_1234567890",
 *     ...
 *   }
 * }
 * ```
 */
router
  .route('/:celebrationId')
  .patch(tokenizer.guard(), validate(schemas.patchResolve), (req, res) =>
    Controller.resolve(req, res, Celebration)
  );

/**
 * POST /api/celebrations/receipt
 * Generates and sends a receipt email for a celebration
 *
 * This endpoint creates and sends a receipt email for a celebration donation,
 * including all relevant details about the donation, recipient, and bill.
 * The receipt includes FEC compliance disclaimers and serves as official
 * documentation for the donation.
 *
 * @route POST /api/celebrations/receipt
 * @param {Object} req.body - Celebration data for receipt generation
 * @param {string} req.body.celebrationId - Celebration ID to generate receipt for
 * @param {string} [req.body.emailTemplate] - Template to use ('New' or 'Receipt')
 * @returns {Object} Receipt generation result
 * @returns {boolean} result.success - Whether receipt was sent successfully
 * @throws {400} Invalid celebration data
 * @throws {401} Unauthorized
 * @throws {404} Celebration not found
 * @throws {500} Email sending failed
 *
 * @example
 * ```javascript
 * POST /api/celebrations/receipt
 * {
 *   "celebrationId": "celebration123",
 *   "emailTemplate": "Receipt"
 * }
 *
 * // Success response
 * {
 *   "success": true,
 *   "message": "Receipt sent successfully"
 * }
 * ```
 */
router
  .route('/receipt')
  .post(
    celebrationLimiter,
    tokenizer.guard(),
    validate(schemas.receipt),
    (req, res) => {
      return res.json(Controller.receipt(req.body, User, Pol));
    }
  );

module.exports = router;
