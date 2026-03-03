/**
 * @fileoverview Utility Services Module - Main Export
 *
 * This module serves as the central export point for all utility services
 * in the POWERBACK application. It provides a clean interface for importing
 * utility services throughout the application.
 *
 * UTILITY CATEGORIES
 *
 * RATE LIMITING
 * - rateLimiters: Pre-configured rate limiters
 * - createRateLimiter: Create custom rate limiter
 * - isLocalhost: Check if request is from localhost
 *
 * DATABASE OPERATIONS
 * - connect: MongoDB connection
 * - connectToUri: Connect to specific URI
 * - disconnect: MongoDB disconnection
 *
 * COOKIE OPERATIONS
 * - clearRefreshCookie: Clear refresh token cookie
 * - clearCSRFCookie: Clear CSRF token cookie
 *
 * CSRF PROTECTION
 * - csrfTokenGenerator: Generate CSRF tokens
 * - csrfTokenValidator: Validate CSRF tokens
 * - getCSRFToken: Get CSRF token from request
 *
 * COLLECTION MANAGEMENT
 * - DockingManager: Safe collection updates with staging
 *
 * NAME FORMATTING
 * - fixPolName: Politician name formatting
 *
 * COMMUNICATIONS
 * - sendSMS: SMS notification service (currently disabled)
 * - postToSocial: Post to social media webhook automations
 *
 * AUDIT LOGGING
 * - logSecurityEvent: Log security events
 * - logAuthenticationEvent: Log auth events
 * - logRateLimitEvent: Log rate limit events
 * - logCSRFEvent: Log CSRF events
 * - logCSPViolation: Log CSP violations
 * - logPaymentEvent: Log payment events
 * - logSuspiciousActivity: Log suspicious activity
 * - logUnauthorizedAccess: Log unauthorized access
 * - logPrivilegeEscalation: Log privilege escalation
 * - logDataBreachAttempt: Log data breach attempts
 *
 * ERROR RESPONSES
 * - createErrorResponse: Create standardized error response
 * - sendErrorResponse: Send standardized error response
 * - createValidationErrorResponse: Create validation error response
 * - sendValidationErrorResponse: Send validation error response
 *
 * DEPENDENCIES
 * - ./rateLimitHelpers: Rate limiting utilities
 * - ./sendSMS: SMS service
 * - ./db: Database connection
 * - ./csrf: CSRF protection
 * - ./fixPolName: Name formatting
 * - ./dockingManager: Collection management
 * - ./cookies: Cookie operations
 * - ./auditLogger: Security audit logging
 * - ./errorResponse: Error response utilities
 *
 * @module services/utils
 * @requires ./rateLimitHelpers
 * @requires ./sendSMS
 * @requires ./db
 * @requires ./csrf
 * @requires ./fixPolName
 * @requires ./dockingManager
 * @requires ./cookies
 * @requires ./auditLogger
 * @requires ./errorResponse
 * @requires ./socialPoster
 */

const {
  isLocalhost,
  rateLimiters,
  createRateLimiter,
} = require('./rateLimitHelpers');
const { sendSMS } = require('./sendSMS');
const { ...dbServices } = require('./db');
const { ...csrfServices } = require('./csrf');
const { fixPolName } = require('./fixPolName');
const DockingManager = require('./dockingManager');
const { ...cookieServices } = require('./cookies');
const { postToSocial } = require('./socialPoster');
const { ...auditServices } = require('./auditLogger');
const { ...errorResponseServices } = require('./errorResponse');

module.exports = {
  DockingManager,
  createRateLimiter,
  postToSocial,
  isLocalhost,
  fixPolName,
  sendSMS,
  rateLimiters,
  ...dbServices,
  ...csrfServices,
  ...auditServices,
  ...cookieServices,
  ...errorResponseServices,
};
