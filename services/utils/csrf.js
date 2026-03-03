/**
 * @fileoverview CSRF Protection Utilities Module
 *
 * This module provides CSRF (Cross-Site Request Forgery) token generation and
 * validation for secure form submissions. It implements the double-submit
 * cookie pattern for stateless CSRF protection without requiring server-side
 * session storage.
 *
 * KEY FEATURES
 *
 * DOUBLE-SUBMIT COOKIE PATTERN
 * - Token stored in both cookie and request header
 * - Validation requires both to match
 * - Stateless (no server-side session needed)
 * - HttpOnly: false (client must read cookie for header)
 *
 * TOKEN GENERATION
 * - Cryptographically secure random tokens
 * - 256-bit tokens (32 bytes)
 * - Base64 encoded for transmission
 * - Secret hash stored for validation
 *
 * EXPRESS MIDDLEWARE
 * - csrfTokenGenerator: Generates and sets CSRF token
 * - csrfTokenValidator: Validates CSRF token on requests
 * - Automatic token generation on first request
 *
 * BUSINESS LOGIC
 *
 * TOKEN LIFECYCLE
 * 1. First request: Token generated and set in cookie
 * 2. Client reads cookie and includes in header
 * 3. Subsequent requests: Token validated from header vs cookie
 * 4. Token expires after 15 minutes (maxAge)
 *
 * VALIDATION LOGIC
 * - Checks both header and cookie exist
 * - Compares decoded header token with cookie token
 * - Validates token format (base64, correct length)
 * - Returns 403 if validation fails
 *
 * SECURITY CONSIDERATIONS
 * - SameSite: strict prevents cross-site cookie access
 * - Secure flag in production (HTTPS only)
 * - Token length prevents brute force
 * - URL decoding handles encoded tokens
 *
 * DEPENDENCIES
 * - crypto: Cryptographically secure random generation
 * - services/utils/logger: Logging
 *
 * @module services/utils/csrf
 * @requires crypto
 * @requires ./logger
 */

const crypto = require('crypto');
const logger = require('./logger')(__filename);

/**
 * CSRF token configuration
 */
const CSRF_CONFIG = {
  secretLength: 32, // 256-bit secret
  tokenLength: 32, // 256-bit token
  cookieName: process.env.COOKIE_PREFIX + 'csrf-token',
  headerName: 'x-csrf-token',
  maxAge: 15 * 60 * 1000, // 15 minutes
};

/**
 * Generate a cryptographically secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} Base64-encoded random token
 */
function generateSecureToken(length = CSRF_CONFIG.tokenLength) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate CSRF token and secret pair
 * @returns {Object} Object containing token and secret
 */
function generateCSRFToken() {
  const secret = generateSecureToken(CSRF_CONFIG.secretLength);
  const token = generateSecureToken(CSRF_CONFIG.tokenLength);

  return {
    secret,
    token,
    // Store the hash of the secret for validation
    secretHash: crypto.createHash('sha256').update(secret).digest('base64'),
  };
}

/**
 * Validate CSRF token using double-submit cookie pattern
 * @param {string} tokenFromHeader - Token from request header
 * @param {string} tokenFromCookie - Token from cookie
 * @returns {boolean} True if tokens match and are valid
 */
function validateCSRFToken(tokenFromHeader, tokenFromCookie) {
  // URL decode the header token to match the cookie format
  const decodedHeaderToken = decodeURIComponent(tokenFromHeader || '');

  if (!tokenFromHeader || !tokenFromCookie) {
    return false;
  }

  if (decodedHeaderToken !== tokenFromCookie) {
    return false;
  }

  // Additional validation: check token format
  try {
    const decoded = Buffer.from(decodedHeaderToken, 'base64');
    if (decoded.length !== CSRF_CONFIG.tokenLength) {
      return false;
    }
  } catch (error) {
    return false;
  }
  return true;
}

/**
 * Express middleware to generate and set CSRF token
 * @returns {Function} Express middleware function
 */
function csrfTokenGenerator() {
  return (req, res, next) => {
    // Only generate a new token if one doesn't exist
    if (!req.cookies[CSRF_CONFIG.cookieName]) {
      // Generate new CSRF token
      const { token, secretHash } = generateCSRFToken();

      // Suppress logs for API route tester requests
      if (req.get('x-route-tester') !== 'true') {
        logger.debug('Generated new CSRF token:', {
          tokenLength: token.length,
          cookieName: CSRF_CONFIG.cookieName,
        });
      }

      // Set token in cookie (httpOnly: false so client can read it)
      res.cookie(CSRF_CONFIG.cookieName, token, {
        httpOnly: false, // Client needs to read this for double-submit
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN,
        maxAge: CSRF_CONFIG.maxAge,
        sameSite: 'strict',
        path: '/',
      });

      // Store secret hash in session for validation (if using sessions)
      // For stateless approach, we'll use the double-submit cookie pattern
      req.csrfSecret = secretHash;
    }

    next();
  };
}

/**
 * Express middleware to validate CSRF token
 * @returns {Function} Express middleware function
 */
function csrfTokenValidator() {
  return (req, res, next) => {
    const tokenFromHeader = req.get(CSRF_CONFIG.headerName);
    const tokenFromCookie = req.cookies[CSRF_CONFIG.cookieName];

    if (!validateCSRFToken(tokenFromHeader, tokenFromCookie)) {
      // Suppress logs for API route tester requests
      if (req.get('x-route-tester') !== 'true') {
        logger.warn(
          `CSRF validation failed for ${req.method} ${req.path} from ${req.ip}`
        );
      }
      return res.status(403).json({
        message: 'Invalid or missing CSRF token',
        error: 'CSRF token validation failed',
        code: 'CSRF_INVALID',
      });
    }

    next();
  };
}

/**
 * Get CSRF token for client-side use
 * @param {Object} req - Express request object
 * @returns {string|null} CSRF token or null if not available
 */
function getCSRFToken(req) {
  return req.cookies[CSRF_CONFIG.cookieName] || null;
}

module.exports = {
  csrfTokenGenerator,
  csrfTokenValidator,
  generateCSRFToken,
  validateCSRFToken,
  getCSRFToken,
  CSRF_CONFIG,
};
