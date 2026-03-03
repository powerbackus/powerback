/**
 * @fileoverview Stripe Setup Intent Controller
 *
 * This controller handles creation of Stripe setup intents for payment method
 * collection. Setup intents allow users to securely add and save payment methods
 * (credit cards) without immediately charging them. The controller automatically
 * creates Stripe customers for users who don't have one yet.
 *
 * KEY FEATURES
 *
 * AUTOMATIC CUSTOMER CREATION
 * - Detects MongoDB ObjectId vs Stripe customer ID
 * - Creates Stripe customer if user doesn't have one
 * - Updates user record with new customer ID
 * - Uses Mongoose markModified() for nested object updates
 *
 * IDEMPOTENCY SUPPORT
 * - Supports idempotency keys to prevent duplicate requests
 * - Ensures setup intent creation is idempotent
 *
 * ENVIRONMENT SUPPORT
 * - Uses Stripe test keys in development
 * - Uses Stripe live keys in production
 * - Automatic key selection based on NODE_ENV
 *
 * BUSINESS LOGIC
 *
 * ID DETECTION
 * - MongoDB ObjectId: 24 hex characters (e.g., '507f1f77bcf86cd799439011')
 * - Stripe Customer ID: Starts with 'cus_' (e.g., 'cus_1a2b3c4d5e6f')
 * - If ObjectId: Looks up user, creates customer if needed
 * - If Stripe ID: Uses directly
 *
 * CUSTOMER CREATION
 * - Creates Stripe customer with user email and name
 * - Stores MongoDB user ID in customer metadata
 * - Updates user.payment.customer_id in database
 * - Uses markModified() to ensure Mongoose saves nested object
 *
 * SETUP INTENT CREATION
 * - Creates setup intent for payment method collection
 * - Sets usage to 'on_session' for future payments
 * - Associates with Stripe customer
 * - Returns client secret for frontend integration
 *
 * DEPENDENCIES
 * - stripe: Stripe SDK for payment processing
 * - models/User: User model for database operations
 *
 * @module controller/payments/setupIntent
 * @requires stripe
 * @requires ../../models/User
 * @requires ../../services/logger
 */

const STRIPE_SK =
    process.env.NODE_ENV === 'production'
      ? process.env.STRIPE_SK_LIVE
      : process.env.STRIPE_SK_TEST,
  stripe = require('stripe')(STRIPE_SK);

const { User } = require('../../models');
const { requireLogger } = require('../../services/logger');
const logger = requireLogger(__filename);
module.exports = {
  /**
   * Creates a Stripe setup intent for payment method collection
   *
   * This endpoint handles the creation of setup intents for collecting payment methods.
   * It can accept either a MongoDB ObjectId (user ID) or a Stripe customer ID.
   * If a user ID is provided and the user doesn't have a Stripe customer ID,
   * it will create one automatically and update the user record.
   *
   * @async
   * @function setupIntent
   * @param {Object} req - Express request object
   * @param {string} req.params.id - Either MongoDB ObjectId (24 hex chars) or Stripe customer ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.idempotencyKey - Stripe idempotency key for request deduplication
   * @param {Object} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with customer ID and client secret
   *
   * @throws {404} When user ID is provided but user not found in database
   * @throws {500} When Stripe API call fails or database operation fails
   *
   * @example
   * // Request with user ID (MongoDB ObjectId)
   * POST /api/payments/setupIntent/507f1f77bcf86cd799439011
   * Body: { "idempotencyKey": "unique-key-123" }
   *
   * // Request with existing Stripe customer ID
   * POST /api/payments/setupIntent/cus_1a2b3c4d5e6f
   * Body: { "idempotencyKey": "unique-key-456" }
   *
   * @example
   * // Response format
   * {
   *   "customer": "cus_1a2b3c4d5e6f",
   *   "clientSecret": "seti_1a2b3c4d5e6f_secret_xyz"
   * }
   */
  setupIntent: async (req, res) => {
    try {
      let customerId = req.params.id;

      // Detect if the provided ID is a MongoDB ObjectId (24 hex characters)
      // This allows the endpoint to accept both user IDs and existing Stripe customer IDs
      if (/^[0-9a-fA-F]{24}$/.test(customerId)) {
        // Look up the user in the database using the MongoDB ObjectId
        const user = await User.findById(customerId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Check if the user already has a Stripe customer ID
        if (!user.payment?.customer_id) {
          // Create a new Stripe customer for the user
          const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            metadata: {
              userId: customerId, // Store the MongoDB user ID for reference
            },
          });

          // Update the user record with the new Stripe customer ID
          user.payment = user.payment || {}; // Ensure payment object exists
          user.payment.customer_id = customer.id;
          user.markModified('payment'); // Tell Mongoose that the payment object has changed
          await user.save();

          // Use the newly created customer ID for the setup intent
          customerId = customer.id;
        } else {
          // User already has a customer ID, use the existing one
          customerId = user.payment.customer_id;
        }
      }
      // If the ID is not a MongoDB ObjectId, assume it's already a Stripe customer ID
      // and use it directly for the setup intent

      // Create the Stripe setup intent for payment method collection
      const intent = await stripe.setupIntents.create(
        {
          usage: 'on_session', // Payment method can be used for future payments
          customer: customerId, // Associate with the Stripe customer
          payment_method_types: ['card'], // Only accept card payments
        },
        { idempotencyKey: req.body.idempotencyKey } // Prevent duplicate requests
      );

      // Return the customer ID and client secret for frontend integration
      res.send({
        customer: customerId,
        clientSecret: intent.client_secret,
      });
    } catch (error) {
      // Log the error for debugging and return a generic error message
      logger.error('Setup intent error:', error.message);
      res.status(500).json({ error: 'Failed to create setup intent' });
    }
  },
};
