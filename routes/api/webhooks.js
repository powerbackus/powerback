/**
 * @fileoverview Webhooks API routes for external service integrations
 *
 * This module handles webhook endpoints for external service integrations,
 * primarily Stripe payment processing webhooks. It provides secure endpoints
 * for receiving and processing real-time events from external services.
 *
 * TABLE OF CONTENTS - API ENDPOINTS
 *
 * EXTERNAL SERVICE WEBHOOKS
 * └── POST   /api/webhooks/stripe                    - Handle Stripe webhook events
 *
 * KEY FEATURES
 * - Stripe webhook signature verification
 * - Charge.succeeded event processing for celebration updates
 * - PAC limit optimization (skips processing for users at limit)
 * - Minimal logging for production performance
 * - Secure webhook processing with error handling
 *
 * SECURITY
 * - Webhook signature verification using Stripe signing secret
 * - Raw body parsing for signature validation
 * - Error handling for invalid signatures
 *
 * @module routes/api/webhooks
 * @requires express
 * @requires stripe
 */

const express = require('express'),
  router = express.Router();

const STRIPE_SK =
    process.env.NODE_ENV === 'production'
      ? process.env.STRIPE_SK_LIVE
      : process.env.STRIPE_SK_TEST,
  Stripe = require('stripe'),
  stripe = new Stripe(STRIPE_SK);

const logger = require('../../services/utils/logger')(__filename);

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events for payment processing
 *
 * This endpoint receives and processes webhook events from Stripe,
 * including payment intent success, charge updates, and other
 * payment-related events. It includes signature verification to
 * ensure the webhook is authentic and from Stripe.
 *
 * The endpoint processes various Stripe events:
 * - charge.succeeded: Charge processed successfully (primary processing)
 * - payment_intent.created: Logged but not processed
 * - payment_intent.succeeded: Logged but not processed
 * - Other events: Logged as unhandled in development mode only
 *
 * Security Features:
 * - Webhook signature verification using Stripe signing secret
 * - Raw body parsing to preserve signature for validation
 * - Error handling for invalid or expired signatures
 * - Comprehensive logging for monitoring and debugging
 *
 * @param {Object} req.body - Raw webhook payload from Stripe
 * @param {string} req.headers['stripe-signature'] - Stripe signature for verification
 * @returns {string} Success confirmation or error response
 *
 * @example
 * ```javascript
 * // Stripe webhook event structure
 * {
 *   "id": "evt_1234567890",
 *   "object": "event",
 *   "api_version": "2020-08-27",
 *   "created": 1640995200,
 *   "data": {
 *     "object": {
 *       "id": "pi_1234567890",
 *       "object": "payment_intent",
 *       "amount": 10000,
 *       "currency": "usd",
 *       "status": "succeeded"
 *     }
 *   },
 *   "livemode": false,
 *   "pending_webhooks": 1,
 *   "request": {
 *     "id": "req_1234567890",
 *     "idempotency_key": null
 *   },
 *   "type": "payment_intent.succeeded"
 * }
 * ```
 */

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // Suppress logs for API route tester requests
    const isRouteTester = req.get('x-route-tester') === 'true';
    
    // Log incoming webhook request
    if (!isRouteTester) {
      logger.info('[Webhook] Received Stripe webhook request', {
        bodyLength: req.body?.length || 0,
      });
    }

    // Extract Stripe signature from request headers
    const sig = req.headers['stripe-signature'];
    let event;

    if (!sig) {
      if (!isRouteTester) {
        logger.error('[Webhook] Missing Stripe signature header');
      }
      return res.status(400).send('Missing Stripe signature');
    }

    try {
      // Verify webhook signature to ensure authenticity
      // Use Workbench signing secret for production, CLI for development
      const signingSecret =
        process.env.NODE_ENV === 'production'
          ? process.env.STRIPE_SIGNING_SECRET_WORKBENCH
          : process.env.STRIPE_SIGNING_SECRET_CLI;

      event = stripe.webhooks.constructEvent(req.body, sig, signingSecret);

      if (!isRouteTester) {
        logger.info('[Webhook] Successfully verified signature', {
          eventType: event.type,
        });
      }
    } catch (err) {
      // Log signature verification failure
      if (!isRouteTester) {
        logger.error('[Webhook] Signature verification failed:', {
          error: err.message,
        });
      }
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process webhook events
    try {
      if (event.type === 'charge.succeeded') {
        // Extract charge information directly from the event
        const charge = event.data.object;

        // Structure donation data for logging and potential processing
        const donationData = {
          id: charge.id,
          amount: charge.amount / 100, // Convert from cents to dollars
          name: charge.billing_details.name,
          createdAt: new Date(charge.created * 1000),
          address: charge.billing_details.address,
          last4: charge.payment_method_details.card.last4,
          cardBrand: charge.payment_method_details.card.brand,
        };

        // Log successful payment for monitoring
        if (!isRouteTester) {
          logger.info('[Webhook] Processing charge.succeeded event', {
            chargeId: charge.id,
            amount: donationData.amount,
          });
        }

        // Check if user has reached PAC limit to optimize processing
        // We need to look up the celebration record using the charge ID
        try {
          const { Celebration, User } = require('../../models');

          // Find the celebration record associated with this charge
          // Use payment_intent since that's what we store in celebrations
          const celebration = await Celebration.findOne({
            payment_intent: charge.payment_intent,
          });

          if (!celebration) {
            // If no celebration found, this might be a different type of charge
            if (!isRouteTester) {
              logger.info('[Webhook] No celebration found for charge', {
                chargeId: charge.id,
                paymentIntent: charge.payment_intent,
              });
            }
          } else {
            // Check if user has already reached PAC limit - skip processing if so
            // This optimization reduces database load for users who can't tip
            const user = await User.findById(celebration.donatedBy);

            if (user && user.tipLimitReached) {
              if (!isRouteTester) {
                logger.info(
                  '[Webhook] Skipping processing - user already at PAC limit',
                  {
                    userId: user._id,
                    celebrationId: celebration._id,
                    chargeId: charge.id,
                    tipAmount: celebration.tip || 0,
                  }
                );
              }
              return res
                .status(200)
                .send('Webhook received - skipped processing');
            }

            // Update the celebration record with the charge_id for future webhook lookups
            await Celebration.findByIdAndUpdate(
              celebration._id,
              { charge_id: charge.id },
              { new: true }
            );

            if (!isRouteTester) {
              logger.info('[Webhook] Updated celebration with charge_id', {
                celebrationId: celebration._id,
                chargeId: charge.id,
              });
            }
          }
        } catch (error) {
          if (!isRouteTester) {
            logger.error(
              '[Webhook] Failed to update celebration with charge_id',
              {
                error: error.message,
                chargeId: charge.id,
              }
            );
          }
        }
      } else {
        // Log unhandled event types (only in debug mode)
        if (process.env.NODE_ENV === 'development' && !isRouteTester) {
          logger.debug('[Webhook] Received unhandled event type', {
            eventType: event.type,
          });
        }
      }
    } catch (err) {
      // Log processing errors but don't fail the webhook
      if (!isRouteTester) {
        logger.error('[Webhook] Error processing event', {
          error: err.message,
          eventType: event.type,
        });
      }
    }

    // Always return success response to Stripe to prevent retries
    res.status(200).send('Webhook received');
  }
);

module.exports = router;
