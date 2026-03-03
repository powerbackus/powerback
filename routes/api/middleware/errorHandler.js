/**
 * @fileoverview Error handler middleware for API routes
 *
 * This middleware provides centralized error handling for all API routes.
 * It catches errors thrown during request processing and returns appropriate
 * HTTP error responses with consistent formatting.
 *
 * Features:
 * - Automatic error logging with stack traces
 * - Consistent error response format
 * - HTTP status code mapping
 * - Fallback error messages for undefined errors
 *
 * @module routes/api/middleware/errorHandler
 * @requires ../../../services/logger.js
 */

const { requireLogger } = require('../../../services/logger.js');
const { createErrorResponse } = require('../../../services/utils/errorResponse');

const logger = requireLogger(__filename);

/**
 * Express error handling middleware
 *
 * This function is called when an error occurs during request processing.
 * It logs the error details and sends a standardized error response to the client.
 *
 * The middleware follows Express.js error handling conventions:
 * - Must have exactly 4 parameters (err, req, res, next)
 * - Should be placed after all other middleware and route handlers
 * - Automatically catches errors thrown in async/await functions
 *
 * @param {Error} err - The error object thrown during request processing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function (unused in error handlers)
 *
 * @example
 * ```javascript
 * // In your main app.js or server.js
 * const errorHandler = require('./routes/api/middleware/errorHandler');
 *
 * // Place after all other middleware and routes
 * app.use(errorHandler);
 *
 * // Error response format
 * {
 *   "error": {
 *     "message": "User not found",
 *     "status": 404
 *   }
 * }
 * ```
 */

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json(createErrorResponse(message, status));
};

module.exports = errorHandler;
