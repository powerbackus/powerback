/**
 * @fileoverview Cookie Management Utility Module
 *
 * This module provides utilities for clearing HTTP cookies, specifically
 * refresh tokens and CSRF tokens. It handles secure cookie configuration
 * based on environment (production vs development).
 *
 * KEY FUNCTIONS
 *
 * clearRefreshCookie(res)
 * - Clears the refresh token cookie
 * - Sets cookie to null with expired date
 * - Uses secure cookie name in production (__Secure- prefix)
 * - HttpOnly, secure, sameSite: strict
 *
 * clearCSRFCookie(res)
 * - Clears the CSRF token cookie
 * - Sets cookie to null with expired date
 * - HttpOnly: false (client needs to read for double-submit)
 * - Secure, sameSite: strict
 *
 * BUSINESS LOGIC
 *
 * SECURE COOKIE NAMES
 * - Production: __Secure- prefix (browser security feature)
 * - Development: Standard cookie name
 * - Prevents accidental cookie access in production
 *
 * COOKIE CONFIGURATION
 * - Domain: From COOKIE_DOMAIN environment variable
 * - Secure: true in production, false in development
 * - SameSite: strict (CSRF protection)
 * - Path: / (available site-wide)
 *
 * DEPENDENCIES
 * - process.env: Environment variables for configuration
 *
 * @module services/utils/cookies
 */

const isCookieSecure = process.env.NODE_ENV === "production";

const cookieName =
  (isCookieSecure ? "__Secure-" : "") +
  (process.env.COOKIE_NAME ?? "refreshToken");

const csrfCookieName = process.env.COOKIE_PREFIX + "csrf-token";

/**
 * Clears the refresh token cookie by setting it to null with an expired date
 * @param {Object} res - Express response object
 */
function clearRefreshCookie(res) {
  res.cookie(cookieName, null, {
    domain: process.env.COOKIE_DOMAIN,
    expires: new Date(Date.now()),
    secure: isCookieSecure,
    sameSite: "strict",
    httpOnly: true,
    path: "/",
  });
}

/**
 * Clears the CSRF token cookie by setting it to null with an expired date
 * @param {Object} res - Express response object
 */
function clearCSRFCookie(res) {
  res.cookie(csrfCookieName, null, {
    domain: process.env.COOKIE_DOMAIN,
    expires: new Date(Date.now()),
    secure: isCookieSecure,
    sameSite: "strict",
    httpOnly: false,
    path: "/",
  });
}

module.exports = { clearRefreshCookie, clearCSRFCookie };
