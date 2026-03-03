/**
 * @fileoverview Application Constants Retrieval Controller
 *
 * This controller provides a safe way to retrieve application constants for
 * the frontend. It filters out sensitive constants (API keys, secrets) and
 * only returns safe constants that can be exposed to the client.
 *
 * BUSINESS LOGIC
 *
 * CONSTANT FILTERING
 * - Excludes sensitive constants: STRIPE, SERVER, EMAIL, API
 * - Returns safe constants: FEC, APP, and other non-sensitive config
 * - Prevents exposure of API keys, secrets, and internal configuration
 *
 * SAFE CONSTANTS
 * - FEC: FEC compliance tier definitions and limits (public information)
 * - APP: Application settings and configuration (non-sensitive)
 * - Other public configuration values
 *
 * SENSITIVE CONSTANTS (Excluded)
 * - STRIPE: Stripe API keys and secrets
 * - SERVER: Server configuration and secrets
 * - EMAIL: Email credentials and configuration
 * - API: API keys and secrets
 *
 * DEPENDENCIES
 * - constants: Application constants module
 *
 * @module controller/sys/pullConstants
 * @requires ../../constants
 */

const CONSTANTS = require('../../constants');

module.exports = {
  /**
   * Retrieves safe application constants for frontend
   *
   * This function filters out sensitive constants (API keys, secrets) and
   * returns only safe constants that can be safely exposed to the client.
   * Used by the frontend to access FEC limits, application settings, and
   * other non-sensitive configuration.
   *
   * @returns {Object} Safe constants object (excludes STRIPE, SERVER, EMAIL, API)
   *
   * @example
   * ```javascript
   * const { pullConstants } = require('./controller/sys/pullConstants');
   * const safeConstants = pullConstants();
   * // Returns: { FEC: {...}, APP: {...}, ... }
   * ```
   */
  pullConstants: () => {
    const { STRIPE, SERVER, EMAIL, API, ...safeConstants } = CONSTANTS;
    return safeConstants;
  },
};
