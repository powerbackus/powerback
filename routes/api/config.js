/**
 * @fileoverview Config API routes for runtime configuration retrieval
 *
 * This module provides endpoints for retrieving runtime configuration values
 * that the frontend needs at runtime rather than build time. Currently provides
 * Stripe public key retrieval based on environment.
 *
 * TABLE OF CONTENTS - API ENDPOINTS
 *
 * CONFIGURATION
 * └── GET    /api/config/stripe-key                    - Get Stripe public key for current environment
 *
 * KEY FEATURES
 * - Runtime configuration retrieval
 * - Environment-based key selection (production vs development)
 * - Stripe public key distribution
 * - Rate limiting to prevent abuse
 *
 * SECURITY
 * - No authentication required (Stripe public keys are public by design)
 * - Rate limited to prevent abuse
 * - Environment validation to ensure proper key selection
 * - Key format validation before returning
 *
 * @module routes/api/config
 * @requires express
 * @requires ../../services/utils
 * @requires ../../services/utils/logger
 */

const express = require('express');
const router = express.Router();

const logger = require('../../services/utils/logger')(__filename);

const { rateLimiters } = require('../../services/utils');

// Rate limiting for config endpoints (localhost exempt in development)
const configRateLimit = rateLimiters.config;

// Apply rate limiting to all config routes
router.use(configRateLimit);

/**
 * GET /api/config/stripe-key
 *
 * Returns the appropriate Stripe public key based on environment. This allows
 * the client to load the key at runtime instead of build time, enabling
 * environment-specific key selection without rebuilding the frontend.
 *
 * The endpoint:
 * - Validates environment configuration (production or development)
 * - Selects appropriate key (STRIPE_PK_LIVE for production, STRIPE_PK_TEST for development)
 * - Validates key format (must start with 'pk_')
 * - Returns key or appropriate error response
 *
 * @route GET /api/config/stripe-key
 * @returns {Object} Stripe public key response
 * @returns {string} response.stripePublicKey - Stripe public key for current environment
 * @throws {400} Invalid environment configuration
 * @throws {500} Stripe key not configured or invalid format
 *
 * @example
 * ```javascript
 * GET /api/config/stripe-key
 *
 * // Success response (production)
 * {
 *   "stripePublicKey": "pk_live_..."
 * }
 *
 * // Success response (development)
 * {
 *   "stripePublicKey": "pk_test_..."
 * }
 *
 * // Error response
 * {
 *   "error": "Stripe key not configured for this environment"
 * }
 * ```
 */
router.get('/stripe-key', (req, res) => {
  try {
    // Validate environment
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction && process.env.NODE_ENV !== 'development') {
      return res.status(400).json({
        error: 'Invalid environment configuration',
      });
    }

    const stripeKey = isProduction
      ? process.env.STRIPE_PK_LIVE
      : process.env.STRIPE_PK_TEST;

    if (!stripeKey) {
      logger.warn(
        `Stripe key not configured for ${process.env.NODE_ENV} environment`
      );
      return res.status(500).json({
        error: 'Stripe key not configured for this environment',
      });
    }

    // Validate Stripe key format
    if (!stripeKey.startsWith('pk_')) {
      logger.error('Invalid Stripe key format detected');
      return res.status(500).json({
        error: 'Invalid Stripe key format',
      });
    }

    res.json({ stripePublicKey: stripeKey });
  } catch (error) {
    logger.error('Error fetching Stripe key:', error);
    res.status(500).json({ error: 'Failed to fetch Stripe key' });
  }
});

module.exports = router;
