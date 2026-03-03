/**
 * @fileoverview Frontend Error Notification Controller
 *
 * This controller handles reporting frontend JavaScript errors from the ErrorBoundary.
 * It logs errors to the application logger for monitoring and debugging in production.
 *
 * BUSINESS LOGIC
 *
 * ERROR REPORTING
 * - Receives error reports from React ErrorBoundary
 * - Logs errors with structured data for debugging
 * - Includes error message, stack trace, and component stack
 * - Captures user agent and IP for context
 *
 * LOGGING
 * - Uses application logger for structured logging
 * - Logs at error level for visibility
 * - Includes metadata for debugging (user agent, IP, timestamp)
 *
 * DEPENDENCIES
 * - services/logger: Application logging service
 *
 * @module controller/sys/notifyFrontendError
 * @requires ../../services/logger
 */

const { requireLogger } = require('../../services/logger');

const logger = requireLogger(__filename);

module.exports = {
  /**
   * Logs frontend error from ErrorBoundary
   *
   * This function receives error reports from the React ErrorBoundary component
   * and logs them to the application logger for monitoring and debugging.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.body - Error report data
   * @param {string} req.body.message - Error message
   * @param {string} req.body.stack - Error stack trace
   * @param {string} req.body.componentStack - React component stack
   * @param {string} req.body.url - Current page URL (optional)
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Resolves when error is logged
   *
   * @example
   * ```javascript
   * const { notifyFrontendError } = require('./controller/sys/notifyFrontendError');
   * await notifyFrontendError(req, res);
   * ```
   */
  notifyFrontendError: (req, res) => {
    try {
      const { message, stack, componentStack, url } = req.body;

      logger.error('Frontend Error from ErrorBoundary:', {
        timestamp: new Date().toISOString(),
        error: {
          message: message || 'Unknown error',
          stack: stack || 'No stack trace available',
          componentStack: componentStack || 'No component stack available',
          url: url || req.get('Referer') || 'Unknown',
        },
        context: {
          userAgent: req.get('User-Agent') || 'Unknown',
          ip: req.ip || 'Unknown',
          method: req.method,
          path: req.path,
        },
      });

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error processing frontend error report:', error);
      res.status(500).json({ error: 'Failed to process error report' });
    }
  },
};
