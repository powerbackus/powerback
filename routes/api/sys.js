/**
 * @fileoverview System API routes for system utilities and constants
 *
 * This module provides endpoints for system-level operations, including
 * error reporting, constants retrieval, and other administrative functions.
 * It serves as the interface for system utilities and configuration data.
 *
 * TABLE OF CONTENTS - API ENDPOINTS
 *
 * SYSTEM UTILITIES
 * ├── PUT    /api/sys/errors/img                    - Report image loading errors
 * ├── POST   /api/sys/errors/frontend               - Report frontend JavaScript errors
 * └── GET    /api/sys/constants                     - Get application constants
 * └── GET    /api/sys/version                       - Get application version
 *
 * KEY FEATURES
 * - Error reporting and logging
 * - Application constants retrieval
 * - Application version retrieval
 * - System configuration access
 * - Administrative utilities
 *
 * @module routes/api/sys
 * @requires express
 * @requires ../../controller/sys
 * @requires ../../validation
 */

const router = require('express').Router(),
  Controller = require('../../controller/sys'),
  { validate } = require('../../validation'),
  schemas = require('../../validation');

// All routes prefixed with '/api/sys'

/**
 * PUT /api/sys/errors/img
 * Reports image loading errors for monitoring and debugging
 *
 * This endpoint allows the frontend to report image loading failures,
 * which helps identify and fix issues with politician profile images
 * or other image assets.
 *
 * @param {Object} req.body - Error report data
 * @param {string} req.body.imageUrl - URL of the failed image
 * @param {string} req.body.error - Error message or description
 * @param {string} req.body.context - Additional context about the error
 * @returns {Object} Error report confirmation
 *
 * @example
 * ```javascript
 * PUT /api/sys/errors/img
 * {
 *   "imageUrl": "https://example.com/politician-image.jpg",
 *   "error": "404 Not Found",
 *   "context": "Politician profile image failed to load"
 * }
 * ```
 */

router
  .route('/errors/img')
  .put(validate(schemas.pol), (req, res) =>
    Controller.notifyImageErr(req, res)
  );

/**
 * POST /api/sys/errors/frontend
 * Reports frontend JavaScript errors from ErrorBoundary
 *
 * This endpoint allows the frontend ErrorBoundary to report React errors
 * for monitoring and debugging in production. Errors are logged to the
 * application logger with structured data.
 *
 * @param {Object} req.body - Error report data
 * @param {string} req.body.message - Error message
 * @param {string} req.body.stack - Error stack trace
 * @param {string} req.body.componentStack - React component stack
 * @param {string} req.body.url - Current page URL (optional)
 * @returns {Object} Success confirmation
 *
 * @example
 * ```javascript
 * POST /api/sys/errors/frontend
 * {
 *   "message": "Cannot read property 'map' of undefined",
 *   "stack": "Error: Cannot read property...",
 *   "componentStack": "    in ComponentName...",
 *   "url": "https://powerback.us/celebrate"
 * }
 * ```
 */
router
  .route('/errors/frontend')
  .post((req, res) => Controller.notifyFrontendError(req, res));

/**
 * GET /api/sys/constants
 * Retrieves application constants and configuration data
 *
 * This endpoint provides frontend applications with access to
 * server-side constants, configuration values, and other static
 * data that may be needed for client-side operations.
 *
 * The constants include:
 * - FEC compliance limits and tier definitions
 * - Stripe payment configuration
 * - Application feature flags
 * - Other system configuration values
 *
 * @returns {Object} Application constants and configuration data
 *
 * @example
 * ```javascript
 * GET /api/sys/constants
 *
 * // Response
 * {
 *   "FEC": {
 *     "COMPLIANCE_TIERS": {
 *       "bronze": { "perDonationLimit": 50, "annualCap": 200 },
 *       "silver": { "perDonationLimit": 200, "annualCap": 200 },
 *       "gold": { "perDonationLimit": 3500, "perElectionLimit": 3500 }
 *     }
 *   },
 *   "STRIPE": {
 *     "FEES": { "PERCENTAGE": 0.029, "ADDEND": 0.30 }
 *   }
 * }
 * ```
 */

router.route('/constants').get((req, res) => {
  // Retrieve and return application constants from controller
  res.json(Controller.pullConstants());
});

/**
 * GET /api/sys/version
 * Retrieves application version and deployment information
 *
 * This endpoint provides version information including:
 * - Package version from package.json
 * - Git commit hash
 * - Git branch name
 * - Deployment timestamp
 * - Source of version data (version-file, git, or fallback)
 *
 * @returns {Object} Version information object
 *
 * @example
 *script
 * GET /api/sys/version
 *
 * // Response
 * {
 *   "packageVersion": "1.0.0-beta1",
 *   "commit": "a1b2c3d4e5f6...",
 *   "branch": "beta",
 *   "deployedAt": "2025-01-15 10:30:00 -0500",
 *   "source": "version-file"
 * }
 *  */

router.route('/version').get(async (req, res) => {
  res.json(Controller.getVersion());
});

module.exports = router;
