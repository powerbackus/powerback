const logger = require('../services/utils/logger')(__filename);

const {
    AuthBase,
    BadRequest,
    UserNotFound,
    NotAuthorized,
  } = require('./authbase'),
  { saveRefreshToken, findAndRemoveRefreshToken } = require('./tokenStore');

/**
 * Tokenizer class that extends AuthBase with concrete implementations
 * Provides JWT-based authentication with proper error handling
 * @extends AuthBase
 */
class Tokenizer extends AuthBase {
  /**
   * Saves a refresh token to the token store
   * @param {string} token - The refresh token to save
   */
  saveRefreshToken(token) {
    saveRefreshToken(token);
  }

  /**
   * Finds and removes a refresh token from the token store
   * @param {string} token - The refresh token to find and remove
   * @returns {Promise<boolean>} True if token was valid, false otherwise
   */
  async findAndRemoveRefreshToken(token) {
    return findAndRemoveRefreshToken(token);
  }

  /**
   * Handles authentication errors with appropriate HTTP responses
   * @param {Error} err - The error that occurred
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   * @returns {Object} JSON response with appropriate status code
   */
  async authErrorHandler(err, req, res, next) {
    const isRouteTester = req.get('x-route-tester') === 'true';

    if (err instanceof UserNotFound) {
      if (!isRouteTester) {
        logger.debug('[authErrorHandler] UserNotFound - 401');
      }
      return res.status(401).json({ error: 'User not found.' });
    }
    if (!isRouteTester) {
      logger.debug('[authErrorHandler] BadRequest - 403');
    }
    return res.status(403).json({ error: 'Bad request.' });
  }

  /**
   * Handles guard/authorization errors with appropriate HTTP responses
   * @param {Error} err - The error that occurred
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   * @returns {Object} JSON response with appropriate status code
   */
  async guardErrorHandler(err, req, res, next) {
    const isRouteTester = req.get('x-route-tester') === 'true';

    if (err instanceof NotAuthorized) {
      if (!isRouteTester) {
        logger.debug('[guardErrorHandler] NotAuthorized - 401');
      }
      return res.status(401).json({ error: 'Not Authorized.' });
    }
    if (err instanceof BadRequest) {
      if (!isRouteTester) {
        logger.debug('[guardErrorHandler] BadRequest - 400');
      }
      return res.status(400).json({ error: 'Bad Request.' });
    }
    if (err instanceof UserNotFound) {
      if (!isRouteTester) {
        logger.debug('[guardErrorHandler] UserNotFound - 401');
      }
      return res.status(401).json({ error: 'User not found.' });
    }

    // Log unexpected errors
    if (!isRouteTester) {
      logger.error('Unexpected error in guardErrorHandler:', err);
    }

    // Handle any other errors by passing them to the next error handler
    return next(err);
  }
}

/**
 * Singleton instance of Tokenizer for use throughout the application
 * @type {Tokenizer}
 */
module.exports = new Tokenizer();
