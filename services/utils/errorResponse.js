/**
 * @fileoverview Error Response Utilities Module
 *
 * This module provides standardized error response formatting for consistent
 * API error handling across the application. It ensures all error responses
 * follow the same structure for easier client-side handling.
 *
 * KEY FUNCTIONS
 *
 * createErrorResponse(message, status, details)
 * - Creates standardized error response object
 * - Format: { error: { message, status, ...details } }
 * - Used for consistent error structure
 *
 * sendErrorResponse(res, message, status, details)
 * - Sends standardized error response
 * - Sets HTTP status code
 * - Sends JSON response with error object
 *
 * createValidationErrorResponse(message, validationErrors)
 * - Creates validation error response
 * - Status: 422 (Unprocessable Entity)
 * - Includes validationErrors array
 *
 * sendValidationErrorResponse(res, message, validationErrors)
 * - Sends validation error response
 * - Status: 422
 * - Includes validation error details
 *
 * BUSINESS LOGIC
 *
 * ERROR RESPONSE FORMAT
 * ```json
 * {
 *   "error": {
 *     "message": "Error message",
 *     "status": 400,
 *     ...additionalDetails
 *   }
 * }
 * ```
 *
 * VALIDATION ERROR FORMAT
 * ```json
 * {
 *   "error": {
 *     "message": "Validation failed",
 *     "status": 422,
 *     "validationErrors": [...]
 *   }
 * }
 * ```
 *
 * DEPENDENCIES
 * None (pure utility functions)
 *
 * @module services/utils/errorResponse
 */

/**
 * Creates a standardized error response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {Object} details - Additional error details (optional)
 * @returns {Object} Standardized error response
 */
function createErrorResponse(message, status = 500, details = {}) {
  return {
    error: {
      message,
      status,
      ...details,
    },
  };
}

/**
 * Sends a standardized error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {Object} details - Additional error details (optional)
 */
function sendErrorResponse(res, message, status = 500, details = {}) {
  res.status(status).json(createErrorResponse(message, status, details));
}

/**
 * Creates a validation error response
 * @param {string} message - Validation error message
 * @param {Array} validationErrors - Array of validation error details
 * @returns {Object} Standardized validation error response
 */
function createValidationErrorResponse(message, validationErrors = []) {
  return createErrorResponse(message, 422, {
    validationErrors,
  });
}

/**
 * Sends a validation error response
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {Array} validationErrors - Array of validation error details
 */
function sendValidationErrorResponse(res, message, validationErrors = []) {
  res.status(422).json(createValidationErrorResponse(message, validationErrors));
}

module.exports = {
  createErrorResponse,
  sendErrorResponse,
  createValidationErrorResponse,
  sendValidationErrorResponse,
};

