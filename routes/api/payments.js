/**
 * @fileoverview Payments API routes for Stripe payment processing and FEC compliance
 *
 * This module handles all payment-related API endpoints, including Stripe integration,
 * payment intent creation, donor management, and FEC compliance validation. It serves
 * as the primary interface for all payment processing in the POWERBACK.us application.
 *
 * TABLE OF CONTENTS - API ENDPOINTS
 *
 * PAYMENT VALIDATION & PROCESSING
 * ├── POST   /api/payments/check-pac-limit           - Check if tip exceeds PAC annual limit
 * ├── POST   /api/payments/intents/:id               - Create Stripe setup intent
 * ├── POST   /api/payments/donors/:id                - Set default payment method
 * └── POST   /api/payments/celebrations/:customer_id - Create payment intent with FEC validation
 *
 * KEY FEATURES
 * - Stripe payment intent creation and management
 * - Donor customer management
 * - Payment method setup and storage
 * - FEC compliance validation for donations
 * - Enhanced validation with election cycle resets
 *
 * FEC COMPLIANCE VALIDATION
 * - Per-donation limits based on compliance tier
 * - Annual caps for Guest tier (resets at midnight EST on Dec 31st/Jan 1st)
 * - Per-election limits for Compliant tier (resets based on state-specific election dates)
 * - User eligibility and donation stakes validation
 * - Dual-gate system: frontend + backend validation
 *
 * @module routes/api/payments
 * @requires express
 * @requires express-rate-limit *
 * @requires ../../validation
 * @requires ../../models
 * @requires ../../auth/tokenizer
 * @requires ../../controller
 * @requires ../../services
 */

const rateLimit = require('express-rate-limit'),
  router = require('express').Router(),
  { validate, ...schemas } = require('../../validation'),
  { Celebration, User } = require('../../models'),
  tokenizer = require('../../auth/tokenizer'),
  Controller = require('../../controller');

const { requireLogger } = require('../../services/logger');

const logger = requireLogger(__filename);

const donationLimiter = rateLimit({
  message: 'Too many donation attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 donation attempts per hour
});

// All routes prefixed with '/api/payments'

/**
 * POST /api/payments/check-pac-limit
 * Checks if a tip would exceed PAC annual limit
 *
 * This endpoint validates if a tip amount would exceed the $5,000 annual PAC limit
 * before the user attempts to make a payment. This provides real-time validation
 * to prevent over-limit PAC contributions.
 *
 * @param {Object} req.body - PAC limit check data
 * @param {string} req.body.userId - User ID to check PAC limits for
 * @param {number} req.body.tipAmount - Tip amount to validate
 * @returns {Object} PAC limit validation result
 *
 * @example
 * ```javascript
 * POST /api/payments/check-pac-limit
 * {
 *   "userId": "507f1f77bcf86cd799439011",
 *   "tipAmount": 100
 * }
 *
 * // Returns:
 * {
 *   "isCompliant": true,
 *   "currentPACTotal": 2500,
 *   "pacLimit": 5000,
 *   "remainingPACLimit": 2500
 * }
 * ```
 */
router
  .route('/check-pac-limit')
  .post(donationLimiter, tokenizer.guard(), async (req, res) => {
    try {
      const { userId, tipAmount } = req.body;

      if (!userId || tipAmount === undefined) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'userId and tipAmount are required',
        });
      }

      // Get user's donation history
      const celebrations = await Controller.celebrations.asyncUser(
        userId,
        Celebration
      );

      // Check PAC limit
      const {
        checkPACLimit,
      } = require('../../controller/users/account/utils/reckon');
      const pacLimitInfo = checkPACLimit(celebrations, tipAmount);

      logger.debug('PAC limit check:', {
        remainingPACLimit: pacLimitInfo.remainingPACLimit,
        currentPACTotal: pacLimitInfo.currentPACTotal,
        isCompliant: pacLimitInfo.isCompliant,
        pacLimit: pacLimitInfo.pacLimit,
        tipAmount,
        userId,
      });

      res.json({
        pacLimit: pacLimitInfo.pacLimit,
        isCompliant: pacLimitInfo.isCompliant,
        currentPACTotal: pacLimitInfo.currentPACTotal,
        remainingPACLimit: pacLimitInfo.remainingPACLimit,
        message: pacLimitInfo.isCompliant
          ? 'Tip amount is within PAC limits'
          : `This tip would exceed your $${pacLimitInfo.pacLimit} annual PAC contribution limit. You have $${pacLimitInfo.remainingPACLimit} remaining.`,
      });
    } catch (error) {
      logger.error('PAC limit check failed:', error);
      res.status(500).json({
        error: 'PAC limit check failed',
        message: 'Unable to validate PAC limits',
      });
    }
  });

/**
 * POST /api/payments/intents/:id
 * Creates a Stripe setup intent for payment method configuration
 *
 * This endpoint creates a Stripe setup intent that allows users to securely
 * add and save payment methods (credit cards) for future use without
 * immediately charging them.
 *
 * @param {string} id - Customer ID for the setup intent
 * @param {Object} req.body - Setup intent configuration
 * @param {string} req.body.idempotencyKey - Unique key for idempotency
 * @returns {Object} Stripe setup intent with client secret
 */
router
  .route('/intents/:id')
  .post(tokenizer.guard(), validate(schemas.intent), (req, res) =>
    Controller.payments.setupIntent(req, res)
  );

/**
 * POST /api/payments/donors/:id
 * Sets the default payment method for a customer
 *
 * This endpoint updates a Stripe customer's default payment method,
 * which will be used for future payments unless overridden. Validates
 * that the payment method exists, is complete, and can be attached to
 * the customer before setting it as default.
 *
 * @param {string} id - Customer ID to update
 * @param {Object} req.body - Payment method configuration
 * @param {string} req.body.payment_method - Payment method ID to set as default
 * @param {string} req.body.idempotencyKey - Unique key for idempotency
 * @returns {Object} Success status
 * @throws {400} When payment method ID is missing
 * @throws {404} When payment method doesn't exist in Stripe
 * @throws {422} When payment method is incomplete or cannot be attached
 */
router
  .route('/donors/:id')
  .post(tokenizer.guard(), validate(schemas.paymentMethod), (req, res) =>
    Controller.payments.setPaymentMethod(req, res)
  );

/**
 * POST /api/payments/celebrations/:customer_id
 * Creates a payment intent for celebration donations with FEC compliance validation
 *
 * This endpoint creates a Stripe payment intent for processing celebration donations.
 * It includes comprehensive FEC compliance validation to ensure all donations
 * comply with federal election regulations before processing payment.
 *
 * The validation process ensures that all donations comply with FEC regulations
 * before processing payment through Stripe. This provides a dual-gate system:
 * 1. Frontend validation prevents invalid donation attempts
 * 2. Backend validation catches any attempts to bypass frontend restrictions
 *
 * FEC Compliance Checks:
 * - Per-donation limits based on compliance tier (Guest: $50, Compliant: $3,500)
 * - Annual caps for Guest tier (resets at midnight EST on Dec 31st/Jan 1st)
 * - Per-election limits for Compliant tier (resets based on state-specific election dates)
 * - User eligibility and donation stakes validation
 *
 * @param {string} customer_id - Stripe customer ID
 * @param {Object} req.body - Payment intent creation data
 * @param {number} req.body.donation - Donation amount in dollars
 * @param {string} req.body.donatedBy - User ID making the donation
 * @param {string} req.body.pol_id - Politician ID receiving the donation
 * @param {number} req.body.tip - Optional tip amount
 * @param {string} req.body.idempotencyKey - Unique key for idempotency
 * @returns {Object} Stripe payment intent or validation error response
 *
 * @example
 * ```javascript
 * // Successful validation
 * POST /api/payments/celebrations/customer123
 * {
 *   "donation": 100,
 *   "donatedBy": "user456",
 *   "pol_id": "politician789",
 *   "tip": 5,
 *   "idempotencyKey": "unique-key-123"
 * }
 *
 * // Returns: Stripe payment intent
 * {
 *   "paymentIntent": "pi_1234567890",
 *   "clientSecret": "pi_1234567890_secret_abc123"
 * }
 *
 * // Failed validation
 * // Returns: { donation: 100, complies: false, has_stakes: true, understands: true }
 * ```
 */
router
  .route('/celebrations/:customer_id')
  .post(
    donationLimiter,
    tokenizer.guard(),
    validate(schemas.celebration),
    async (req, res) => {
      /**
       * Enhanced payment validation with FEC compliance checks
       *
       * FEC compliance tier definitions and limits are documented in docs/DONATION_LIMITS.md
       *
       * This endpoint validates:
       * - Per-donation limits based on compliance tier
       * - Annual caps for Guest tier (resets at midnight EST on Dec 31st/Jan 1st)
       * - Per-election limits for Compliant tier (resets based on state-specific election dates)
       * - User eligibility and donation stakes
       *
       * The validation process ensures that all donations comply with FEC regulations
       * before processing payment through Stripe. This provides a dual-gate system:
       * 1. Frontend validation prevents invalid donation attempts
       * 2. Backend validation catches any attempts to bypass frontend restrictions
       *
       * @param {Object} req - Express request object
       * @param {Object} req.body - Request body containing donation details
       * @param {number} req.body.donation - Amount user wants to donate
       * @param {string} req.body.donatedBy - User ID making the donation
       * @param {string} req.body.pol_id - Politician ID receiving the donation
       * @param {Object} res - Express response object
       *
       * @returns {Object} JSON response with validation results or payment intent
       *
       * @example
       * ```javascript
       * // Successful validation
       * POST /api/payments/celebrations/customer123
       * {
       *   "donation": 100,
       *   "donatedBy": "user456",
       *   "pol_id": "politician789"
       * }
       * // Returns: Stripe payment intent
       *
       * // Failed validation
       * // Returns: { donation: 100, complies: false, has_stakes: true, understands: true }
       * ```
       */
      try {
        // Extract donation amount for validation and fee calculation
        const donationAmount = req.body.donation;
        // tips are not included in the processing fee charged to users

        // Calculate Stripe processing fee (percentage + fixed amount)
        req.body.fee =
          donationAmount * parseInt(process.env.STRIPE_PROCESSING_PERCENTAGE) +
          parseInt(process.env.STRIPE_PROCESSING_ADDEND);

        // Get user's current compliance tier and donation history
        const compliance = await Controller.users.deem(
            req.body.donatedBy,
            User
          ),
          celebrations = await Controller.celebrations.asyncUser(
            req.body.donatedBy,
            Celebration
          );

        // Get politician state for enhanced compliance validation (Compliant tier election cycles)
        let politicianState = null;
        try {
          const { Pol } = require('../../models');
          // Look up politician by FEC candidate ID to get their state
          const politician = await Pol.findOne({
            'roles.fec_candidate_id': req.body.pol_id,
          }).exec();
          if (politician && politician.roles && politician.roles.length > 0) {
            politicianState = politician.roles[0].state;
          }
        } catch (error) {
          logger.warn(
            'Could not determine politician state for enhanced compliance:',
            error.message
          );
        }

        // Enhanced FEC compliance validation with election cycle resets
        let donationIsCompliant;
        try {
          // Try enhanced validation first (with election cycle resets for Compliant tier)
          donationIsCompliant = await Controller.users.checkEnhancedCompliance(
            celebrations,
            compliance,
            donationAmount,
            req.body.pol_id,
            politicianState
          );
        } catch (error) {
          logger.warn(
            'Enhanced compliance check failed, falling back to legacy validation:',
            error.message
          );
          // Fallback to legacy validation if enhanced check fails
          donationIsCompliant = await Controller.users.reckon(
            celebrations,
            compliance,
            req.body.pol_id,
            donationAmount
          );
        }

        // PAC limit validation for tips (if tip amount is provided)
        // Note: PAC limit validation is now handled in the celebration creation endpoint
        // Check PAC limits for tips during payment validation
        let tipIsCompliant = true;
        let pacLimitInfo = null;
        if (req.body.tip && req.body.tip > 0) {
          // Actually check PAC limits to provide accurate remaining limit info to frontend
          const {
            checkPACLimit,
          } = require('../../controller/users/account/utils/reckon');
          pacLimitInfo = checkPACLimit(celebrations, req.body.tip);
          tipIsCompliant = pacLimitInfo.isCompliant;
          logger.debug('PAC limit check during payment validation:', {
            tipAmount: req.body.tip,
            remainingPACLimit: pacLimitInfo.remainingPACLimit,
            currentPACTotal: pacLimitInfo.currentPACTotal,
            isCompliant: pacLimitInfo.isCompliant,
            pacLimit: pacLimitInfo.pacLimit,
            celebrationsCount: celebrations?.length || 0,
          });
        }

        // Log comprehensive validation results for monitoring and debugging
        const isDevelopment = process.env.NODE_ENV === 'development';

        logger.debug('FEC Compliance Validation:', {
          environment: process.env.NODE_ENV || 'development',
          totalDonations: celebrations?.length || 0,
          isCompliant: donationIsCompliant,
          tipIsCompliant: tipIsCompliant,
          donationAmount: donationAmount,
          tipAmount: req.body.tip || 0,
          userId: req.body.donatedBy,
          pol_id: req.body.pol_id,
          compliance: compliance,
          politicianState: politicianState,
          validationMethod: politicianState ? 'enhanced' : 'legacy',
          pacLimitInfo: pacLimitInfo,
          // Add environment-specific context
          ...(isDevelopment && {
            debug: {
              userAgent: req.get('User-Agent'),
              ipAddress: req.ip,
              timestamp: new Date().toISOString(),
            },
          }),
        });

        // Check user eligibility and donation stakes
        let understandsEligibility;
        let donationHasStakes;
        understandsEligibility = await Controller.users.certify(
          req.body.donatedBy,
          User
        );
        donationHasStakes = await Controller.congress.vest(
          req.body.pol_id,
          User
        );

        // Validate all requirements before proceeding with payment
        // Note: tipIsCompliant is not checked here because we process donations
        // without tips when PAC limits are reached, allowing the donation to proceed
        if (
          // tipIsCompliant === false ||
          understandsEligibility === false ||
          donationIsCompliant === false ||
          donationHasStakes === false
        ) {
          // Log validation failure metrics for monitoring
          const failureMetrics = {
            event: 'validation_failure',
            environment: process.env.NODE_ENV || 'development',
            userId: req.body.donatedBy,
            complianceTier: compliance,
            attemptedAmount: donationAmount,
            tipAmount: req.body.tip || 0,
            failureReasons: {
              understandsEligibility: !understandsEligibility,
              donationIsCompliant: !donationIsCompliant,
              donationHasStakes: !donationHasStakes,
              tipIsCompliant: !tipIsCompliant,
            },
            context: {
              totalDonations: celebrations?.length || 0,
              politicianState: politicianState,
              validationMethod: politicianState ? 'enhanced' : 'legacy',
              timestamp: new Date().toISOString(),
              ...(isDevelopment && {
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
              }),
            },
          };

          // Log specific failure types for alerting
          if (!donationIsCompliant) {
            logger.warn('FEC Compliance Limit Exceeded:', {
              ...failureMetrics,
              limitType: compliance === 'compliant' ? 'per-election' : 'annual',
              currentTotal:
                celebrations?.reduce((sum, d) => sum + (d.donation || 0), 0) ||
                0,
            });
          }

          if (!tipIsCompliant) {
            logger.warn('PAC Limit Exceeded:', {
              ...failureMetrics,
              currentPACTotal: pacLimitInfo?.currentPACTotal || 0,
              pacLimit: pacLimitInfo?.pacLimit || 5000,
              remainingPACLimit: pacLimitInfo?.remainingPACLimit || 0,
            });
          }

          if (!understandsEligibility) {
            logger.warn('User Eligibility Check Failed:', failureMetrics);
          }

          if (!donationHasStakes) {
            logger.warn('Donation Stakes Validation Failed:', {
              ...failureMetrics,
              politicianId: req.body.pol_id,
            });
          }

          // Controller.users.strike(req.body.donatedBy, User); // three strikes and account is locked
          // Return validation failure details to frontend
          const response = {
            donation: donationAmount,
            complies: donationIsCompliant,
            has_stakes: donationHasStakes,
            understands: understandsEligibility,
          };

          // Add PAC limit information if tip validation failed
          if (!tipIsCompliant && pacLimitInfo) {
            response.tip = req.body.tip;
            response.tipComplies = false;
            response.pacLimitInfo = {
              pacLimit: pacLimitInfo.pacLimit,
              currentPACTotal: pacLimitInfo.currentPACTotal,
              remainingPACLimit: pacLimitInfo.remainingPACLimit,
              message: `This tip would exceed your $${pacLimitInfo.pacLimit} annual PAC contribution limit. You have $${pacLimitInfo.remainingPACLimit} remaining.`,
            };
            logger.debug('PAC limit info added to validation response:', {
              remainingPACLimit: response.pacLimitInfo.remainingPACLimit,
              currentPACTotal: response.pacLimitInfo.currentPACTotal,
              pacLimit: response.pacLimitInfo.pacLimit,
            });
          } else if (pacLimitInfo) {
            logger.debug('PAC limit info NOT added to response:', {
              reason: tipIsCompliant
                ? 'tipIsCompliant is true'
                : 'pacLimitInfo is null',
              tipIsCompliant,
              hasPacLimitInfo: !!pacLimitInfo,
            });
          }

          logger.debug('Sending validation response:', {
            hasPacLimitInfo: !!response.pacLimitInfo,
            responseKeys: Object.keys(response),
            tipComplies: response.tipComplies,
          });
          res.json(response);
        } else if (
          understandsEligibility &&
          donationIsCompliant &&
          donationHasStakes
          // && tipIsCompliant
        ) {
          // Log successful validation for monitoring
          logger.debug('FEC Compliance Validation Succeeded:', {
            event: 'validation_success',
            environment: process.env.NODE_ENV || 'development',
            userId: req.body.donatedBy,
            complianceTier: compliance,
            donationAmount: donationAmount,
            tipAmount: req.body.tip || 0,
            totalDonations: celebrations?.length || 0,
            validationMethod: politicianState ? 'enhanced' : 'legacy',
            timestamp: new Date().toISOString(),
          });

          // Check if tip exceeds PAC limit - if so, return PAC limit info to frontend
          // even though donation validation passed (donation can proceed without tip)
          if (!tipIsCompliant && pacLimitInfo) {
            logger.debug(
              'Tip exceeds PAC limit but donation is valid - returning PAC limit info:',
              {
                remainingPACLimit: pacLimitInfo.remainingPACLimit,
                currentPACTotal: pacLimitInfo.currentPACTotal,
              }
            );
            // Return validation response with PAC limit info instead of proceeding to payment
            const response = {
              donation: donationAmount,
              complies: donationIsCompliant,
              has_stakes: donationHasStakes,
              understands: understandsEligibility,
              tip: req.body.tip,
              tipComplies: false,
              pacLimitInfo: {
                pacLimit: pacLimitInfo.pacLimit,
                currentPACTotal: pacLimitInfo.currentPACTotal,
                remainingPACLimit: pacLimitInfo.remainingPACLimit,
                message: `This tip would exceed your $${pacLimitInfo.pacLimit} annual PAC contribution limit. You have $${pacLimitInfo.remainingPACLimit} remaining.`,
              },
            };
            return res.json(response);
          }

          // All validations passed - proceed with payment processing
          // prevent user from changing the bill to anything else (for now)
          req.body.bill_id = 'hjres54-119';
          Controller.payments.createPayment(req, res);
          logger.debug('Payment intent succeeded:', req.body);
        } else throw Error('Payment failed.');
      } catch (err) {
        logger.error('Payment intent failed:', err);
        res.statusCode = '500';
        res.send(err.message);
      }
    }
  );

module.exports = router;
