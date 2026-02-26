/**
 * @fileoverview BTC API routes for Bitcoin address generation
 *
 * Provides endpoints for generating Bitcoin addresses for users.
 * Utilizes:
 *   - {@link module:services/btc/addressService.getBTCAddress|getBTCAddress} for address generation
 *   - express-rate-limit middleware for request limiting
 *
 * Security: No authentication required - BTC addresses are public donation addresses
 * meant to be shared. Rate limiting prevents abuse of address generation.
 *
 * @module routes/api/btc
 * @requires express
 * @requires express-rate-limit
 * @requires ../../services/btc/addressService
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { getBTCAddress } = require('../../services/btc/addressService');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // adjust later
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/btc/address
 * Generates a Bitcoin address for donations
 *
 * This endpoint generates a unique Bitcoin address that can be used for
 * cryptocurrency donations. The address is generated using a deterministic
 * derivation process from a master key.
 *
 * Security: No authentication required - Bitcoin addresses are public donation
 * addresses meant to be shared. Rate limiting prevents abuse of address generation.
 *
 * @route POST /api/btc/address
 * @returns {Object} Bitcoin address response
 * @returns {string} response.address - Generated Bitcoin address
 * @throws {500} Error generating Bitcoin address
 *
 * @example
 * ```javascript
 * POST /api/btc/address
 *
 * // Success response
 * {
 *   "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
 * }
 * ```
 */
router.post('/address', limiter, async (req, res, next) => {
  try {
    const address = await getBTCAddress();
    res.status(200).json({ address });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
