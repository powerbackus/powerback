/**
 * @fileoverview Rate Limiting Helper Utilities Module
 *
 * This module provides utilities for creating rate limiters with localhost
 * exemptions and other common rate limiting configurations. It uses
 * express-rate-limit to protect API endpoints from abuse.
 *
 * KEY FEATURES
 *
 * LOCALHOST EXEMPTION
 * - Skips rate limiting for localhost in development
 * - Allows unlimited requests during local development
 * - Production: All requests rate limited
 *
 * PRE-CONFIGURED LIMITERS
 * - createAccount: 5 per hour
 * - login: 5 per 15 minutes
 * - passwordReset: 3 per hour
 * - emailVerification: 5 per hour
 * - celebrations: 20 per hour
 * - donations: 20 per hour
 * - config: 100 per 15 minutes
 * - general: 100 per 15 minutes
 *
 * CUSTOM LIMITERS
 * - createRateLimiter: Create limiter with localhost exemption
 * - createCustomRateLimiter: Create limiter with custom skip function
 *
 * BUSINESS LOGIC
 *
 * RATE LIMIT CONFIGURATION
 * - windowMs: Time window for rate limit
 * - max: Maximum requests in window
 * - message: Error message when limit exceeded
 * - standardHeaders: Include standard rate limit headers
 * - legacyHeaders: Disable legacy headers
 *
 * LOCALHOST DETECTION
 * - Checks for 127.0.0.1, ::1, ::ffff:127.0.0.1, localhost
 * - Extracts IP from req.ip, req.connection, or req.socket
 * - Only exempts in non-production environments
 *
 * DEPENDENCIES
 * - express-rate-limit: Rate limiting middleware
 *
 * @module services/utils/rateLimitHelpers
 * @requires express-rate-limit
 */

const rateLimit = require('express-rate-limit');

/**
 * Check if request is from localhost
 * @param {Object} req - Express request object
 * @returns {boolean} True if request is from localhost
 */
function isLocalhost(req) {
  const localhostIPs = [
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
    'localhost',
  ];

  const clientIP =
    req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
  return localhostIPs.includes(clientIP);
}

/**
 * Create a rate limiter with localhost exemption
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express rate limiter middleware
 */
function createRateLimiter(options) {
  return rateLimit({
    ...options,
    skip: (req) => {
      // Skip rate limiting for localhost in development
      if (process.env.NODE_ENV !== 'production' && isLocalhost(req)) {
        return true;
      }
      return false;
    },
  });
}

/**
 * Create a rate limiter with custom skip function
 * @param {Object} options - Rate limiter options
 * @param {Function} skipFunction - Custom skip function
 * @returns {Function} Express rate limiter middleware
 */
function createCustomRateLimiter(options, skipFunction) {
  return rateLimit({
    ...options,
    skip: skipFunction,
  });
}

/**
 * Common rate limiter configurations
 */
const rateLimiters = {
  // Account creation - prevent spam/bots
  createAccount: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 accounts per hour per IP
    message: 'Too many account creation attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Login attempts - prevent brute force
  login: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many login attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Password reset - prevent abuse
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: 'Too many password reset attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Email verification - prevent abuse
  emailVerification: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 email verification attempts per hour
    message:
      'Too many email verification attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Celebrations - prevent spam
  celebrations: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 celebration attempts per hour
    message: 'Too many celebration attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Donations - prevent spam
  donations: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 donation attempts per hour
    message: 'Too many donation attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Config endpoints - prevent abuse
  config: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests for configuration endpoints',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // General API protection
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

module.exports = {
  isLocalhost,
  createRateLimiter,
  createCustomRateLimiter,
  rateLimiters,
};
