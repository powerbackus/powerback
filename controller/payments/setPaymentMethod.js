/**
 * @fileoverview Payment Method Management Controller
 *
 * This controller handles setting the default payment method for Stripe customers.
 * It updates the customer's invoice settings to use a specific payment method
 * as the default for future payments. Includes validation to ensure the payment
 * method exists and is valid before setting it as default.
 *
 * BUSINESS LOGIC
 *
 * DEFAULT PAYMENT METHOD
 * - Sets customer's default payment method in Stripe
 * - Used for future payment intents if no payment method specified
 * - Stored in customer.invoice_settings.default_payment_method
 * - Supports idempotency keys for request deduplication
 *
 * PAYMENT METHOD VALIDATION
 * - Verifies payment method exists in Stripe before setting
 * - Validates payment method is complete and valid
 * - Ensures payment method can be attached to customer
 * - Prevents setting invalid or incomplete payment methods
 *
 * PAYMENT METHOD REUSE
 * - Once set as default, can be reused for future payments
 * - Reduces need to collect payment method each time
 * - Improves user experience for repeat donations
 *
 * DEPENDENCIES
 * - stripe: Stripe SDK for payment processing
 * - services/utils/logger: Logging
 *
 * @module controller/payments/setPaymentMethod
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
   * Sets the default payment method for a Stripe customer
   *
   * This function validates that the payment method exists and is valid before
   * updating a Stripe customer's invoice settings. This ensures only complete
   * and valid payment methods are set as default.
   *
   * @param {Object} req - Express request object
   * @param {string} req.params.id - Stripe customer ID
   * @param {Object} req.body - Payment method configuration
   * @param {string} req.body.payment_method - Payment method ID to set as default
   * @param {string} req.body.idempotencyKey - Unique key for idempotency
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Resolves when payment method is set
   * @throws {400} When payment method is missing or invalid
   * @throws {404} When payment method doesn't exist in Stripe
   * @throws {422} When payment method is incomplete or cannot be attached to customer
   *
   * @example
   * ```javascript
   * const { setPaymentMethod } = require('./controller/payments/setPaymentMethod');
   * await setPaymentMethod(req, res);
   * ```
   */
  setPaymentMethod: async (req, res) => {
    try {
      const { payment_method: paymentMethodId } = req.body;
      const customerId = req.params.id;

      // Validate payment method ID is provided
      if (!paymentMethodId) {
        logger.warn('Payment method ID missing:', {
          customerId,
          ip: req.ip,
        });
        return res.status(400).json({
          error: {
            message: 'Payment method ID is required',
            status: 400,
          },
        });
      }

      // Verify payment method exists and retrieve its details
      let paymentMethod;
      try {
        paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      } catch (stripeError) {
        logger.warn('Payment method not found in Stripe:', {
          paymentMethodId,
          customerId,
          stripeError: stripeError.message,
          ip: req.ip,
        });

        // Handle different Stripe error types
        if (stripeError.type === 'StripeInvalidRequestError') {
          return res.status(404).json({
            error: {
              message: 'Payment method not found or invalid',
              status: 404,
            },
          });
        }

        return res.status(422).json({
          error: {
            message: 'Failed to validate payment method',
            status: 422,
          },
        });
      }

      // Validate payment method is complete and valid
      // Card payment methods should have card details
      if (paymentMethod.type === 'card') {
        if (!paymentMethod.card) {
          logger.warn('Payment method missing card details:', {
            paymentMethodId,
            customerId,
            ip: req.ip,
          });
          return res.status(422).json({
            error: {
              message: 'Payment method is incomplete - card details missing',
              status: 422,
            },
          });
        }
      }

      // Attach payment method to customer if not already attached
      // This ensures the payment method can be used by the customer
      if (!paymentMethod.customer || paymentMethod.customer !== customerId) {
        try {
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
          });
          logger.debug('Payment method attached to customer:', {
            paymentMethodId,
            customerId,
          });
        } catch (attachError) {
          logger.warn('Failed to attach payment method to customer:', {
            paymentMethodId,
            customerId,
            attachError: attachError.message,
            ip: req.ip,
          });

          // If payment method is already attached to another customer, return error
          if (attachError.code === 'payment_method_already_attached') {
            return res.status(422).json({
              error: {
                message: 'Payment method is already attached to another customer',
                status: 422,
              },
            });
          }

          return res.status(422).json({
            error: {
              message: 'Failed to attach payment method to customer',
              status: 422,
            },
          });
        }
      }

      // Set payment method as default for customer
      await stripe.customers.update(
        customerId,
        {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        },
        { idempotencyKey: req.body.idempotencyKey }
      );

      logger.debug('Payment method set as default:', {
        customerId,
        paymentMethodId,
        paymentMethodType: paymentMethod.type,
        isDefault: true,
        ip: req.ip,
      });

      res.json({
        success: true,
        payment_method: paymentMethodId,
        customer: customerId,
      });
    } catch (error) {
      logger.error('Failed to set payment method:', {
        error: error.message,
        stack: error.stack,
        customerId: req.params.id,
        paymentMethodId: req.body?.payment_method,
        ip: req.ip,
      });

      res.status(500).json({
        error: {
          message: 'Failed to set payment method',
          status: 500,
        },
      });
    }
  },
};
