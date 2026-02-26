/**
 * @fileoverview Payment Intent Creation Controller
 *
 * This controller handles creating Stripe payment intents for celebration
 * donations. Payment intents are created but not immediately charged - they
 * are held in escrow until the celebration is resolved (trigger condition met).
 *
 * BUSINESS LOGIC
 *
 * PAYMENT INTENT CREATION
 * - Creates Stripe payment intent with donation + tip + fee amount
 * - Uses payment method from request or customer's default
 * - Sets up_future_usage to allow reuse of payment method
 * - Includes idempotency key to prevent duplicate charges
 * - Payment intent created but not charged until resolution
 *
 * AMOUNT CALCULATION
 * - Total amount = donation + tip + fee (converted to cents)
 * - Fee is Stripe processing fee calculated earlier
 * - All amounts in dollars, converted to cents for Stripe
 *
 * PAYMENT METHOD SELECTION
 * - Uses payment_method from request body if provided
 * - Falls back to customer's default payment method
 * - Retrieves customer from Stripe if needed
 *
 * DEPENDENCIES
 * - stripe: Stripe SDK for payment processing
 * - services/utils/logger: Logging
 *
 * @module controller/payments/createPayment
 * @requires stripe
 * @requires ../../services/utils/logger
 */

const STRIPE_SK =
    process.env.NODE_ENV === 'production'
      ? process.env.STRIPE_SK_LIVE
      : process.env.STRIPE_SK_TEST,
  stripe = require('stripe')(STRIPE_SK);
const logger = require('../../services/utils/logger')(__filename);

module.exports = {
  /**
   * Creates a Stripe payment intent for celebration donation
   *
   * This function creates a Stripe payment intent with the total amount
   * (donation + tip + fee) and associates it with the customer. The payment
   * intent is created but not charged until the celebration is resolved.
   *
   * @param {Object} req - Express request object
   * @param {string} req.params.customer_id - Stripe customer ID
   * @param {Object} req.body - Payment creation data
   * @param {number} req.body.donation - Donation amount in dollars
   * @param {number} req.body.tip - Tip amount in dollars
   * @param {number} req.body.fee - Stripe processing fee in dollars
   * @param {string} [req.body.payment_method] - Payment method ID (optional)
   * @param {string} req.body.idempotencyKey - Unique key for idempotency
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Resolves when payment intent is created
   * @throws {Error} Stripe API error if payment intent creation fails
   *
   * @example
   * ```javascript
   * const { createPayment } = require('./controller/payments/createPayment');
   * await createPayment(req, res);
   * ```
   */
  createPayment: async (req, res) => {
    const amount = Math.floor(
      (req.body.fee + req.body.tip + req.body.donation) * 100
    );

    // Use payment method from request body if provided, otherwise fall back to customer's default
    const paymentMethod =
      req.body.payment_method ||
      (await stripe.customers.retrieve(req.params.customer_id)).invoice_settings
        .default_payment_method;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        currency: 'usd',
        customer: req.params.customer_id,
        setup_future_usage: 'on_session',
        payment_method: paymentMethod,
        amount: amount,
      },
      { idempotencyKey: req.body.idempotencyKey }
    );
    logger.debug('Created Stripe payment intent', {
      action: 'create_payment_intent',
      userId: req.jwt?.payload?.sub,
      amount: amount,
      ip: req.ip,
    });
    try {
      res.send({
        paymentIntent: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      });
      logger.info('Created Stripe payment intent', {
        action: 'create_payment_intent',
        userId: req.jwt?.payload?.sub,
        amount: amount,
        ip: req.ip,
      });
    } catch (err) {
      logger.error('Stripe payment intent failed', {
        action: 'create_payment_intent',
        userId: req.jwt?.payload?.sub,
        error: err.message,
        ip: req.ip,
      });
    }
  },
};
