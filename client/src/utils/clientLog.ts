/**
 * Client-side logging that avoids exposing sensitive data in production.
 * In development: full console output. In production: message only (no error
 * objects, response bodies, or stack traces) to avoid leaking PII or tokens.
 * @module utils/clientLog
 */

const isProd = process.env.NODE_ENV === 'production';

/**
 * Log an error. In production only the message is logged; the error object
 * is never passed to console to avoid leaking response.data or other payloads.
 *
 * @param message - Short description (e.g. 'Settings update failed')
 * @param err - Optional error (logged only in development)
 */
export function logError(message: string, err?: unknown): void {
  if (isProd) {
    console.error(message);
  } else {
    console.error(message, err);
  }
}

/**
 * Log a warning. No-op in production to reduce noise and avoid any accidental leaks.
 *
 * @param message - Warning message
 */
export function logWarn(message: string): void {
  if (!isProd) {
    console.warn(message);
  }
}
