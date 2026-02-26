const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const { User } = require('../models');
const { SERVER } = require('../constants');
const { contact } = require('../controller/users');
const { clearRefreshCookie } = require('../services');

const logger = require('../services/utils/logger')(__filename);

const { saveRefreshToken, findAndRemoveRefreshToken } = require('./tokenStore');

const isCookieSecure = process.env.NODE_ENV === 'production',
  cookieName = (isCookieSecure ? '__Secure-' : '') + process.env.COOKIE_NAME;

/**
 * Base authentication class providing JWT-based authentication functionality
 * @class AuthBase
 */
class AuthBase {
  /**
   * Create a new instance of AuthBase
   * @param {Object} options - Configuration options
   * @param {string} [options.subject=''] - Subject claim for JWT tokens
   * @param {string} [options.jti] - JWT ID claim (auto-generated if not provided)
   * @param {string} [options.issuer=process.env.PROD_URL] - Issuer claim for JWT tokens
   * @param {string} [options.audience=SERVER.JWT.AUDIENCE] - Audience claim for JWT tokens
  * @param {string} [options.secret=process.env.JWT_SECRET] - Secret key for JWT signing
   * @param {number} [options.accessTokenExp=SERVER.ACCESS_EXPY] - Access token expiration in minutes
   * @param {number} [options.refreshTokenExp=SERVER.REFRESH_EXPY] - Refresh token expiration in days

   */
  constructor({
    subject = '',
    jti = nanoid(),
    issuer = process.env.PROD_URL,
    audience = SERVER.JWT.AUDIENCE,
    secret = process.env.JWT_SECRET,
    accessTokenExp = SERVER.ACCESS_EXPY,
    refreshTokenExp = SERVER.REFRESH_EXPY,
  } = {}) {
    this.refreshTokenExp = refreshTokenExp;
    this.accessTokenExp = accessTokenExp;
    this.audience = audience;
    this.subject = subject;
    this.issuer = issuer;
    this.secret = secret;
    this.jwtid = jti;
  }

  /**
   * Checks if the HTTP-only refresh token cookie exists
   * @param {Object} req - Express request object
   * @returns {boolean} True if cookie exists, false otherwise
   */
  hasRefreshTokenCookie(req) {
    return !!req.cookies[cookieName];
  }

  /**
   * Handles token rejection by clearing cookies and logging out user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Error} error - Error that caused the rejection
   */
  handleTokenRejection(req, res, error) {
    // Suppress logs for API route tester requests
    if (error && req.get('x-route-tester') !== 'true') {
      logger.debug('Token rejection', {
        error: error.message || 'Unknown error',
        errorType: error.constructor.name || 'Unknown',
        url: req.originalUrl,
      });
    }

    clearRefreshCookie(res);
  }

  /**
   * Creates an authentication middleware function
   * @returns {Function} Express middleware function for user authentication
   */
  authenticate() {
    return async (req, res, next) => {
      const { password, email } = req.body;
      if (!password || !email) {
        return this.authErrorHandler(new BadRequest(), req, res, next);
      }

      let user = await this.findUser(email, password);
      if (!user) {
        return this.authErrorHandler(new UserNotFound(), req, res, next);
      }
      user = { _id: user._id, tokenVersion: user.tokenVersion };
      const accessToken = await this.createAccessToken({ user });
      const refreshToken = await this.createRefreshToken({ user });

      await saveRefreshToken(refreshToken);

      const response = {
        user,
        access_token: accessToken,
      };

      return res.json(response);
    };
  }

  /**
   * Creates a refresh token middleware function
   * @returns {Function} Express middleware function for token refresh
   */
  refresh() {
    return async (req, res, next) => {
      try {
        // Check if HTTP-only cookie exists before attempting refresh
        if (!this.hasRefreshTokenCookie(req)) {
          return this.guardErrorHandler(new NotAuthorized(), req, res, next);
        }

        const authenticated = await this.authorizeRequest(req, res);

        if (!Array.isArray(authenticated) || authenticated.length !== 2) {
          return this.guardErrorHandler(new NotAuthorized(), req, res, next);
        }

        const [jwt, token] = authenticated;

        // Get fresh user data from database
        const latestUser = await contact(token.payload.sub, User);

        // Check if token version matches user's token version
        if (token.payload.tv !== latestUser.tokenVersion) {
          logger.error('Token version mismatch');
          return this.guardErrorHandler(new NotAuthorized(), req, res, next);
        }

        const valid = await findAndRemoveRefreshToken(jwt);

        const {
          payload: { isRefresh },
        } = token;

        if (!valid || !latestUser || !isRefresh) {
          return this.guardErrorHandler(new NotAuthorized(), req, res, next);
        }

        this.subject = latestUser._id.toString();
        const accessToken = await this.createAccessToken();
        let rTPayload = {
          user: {
            _id: latestUser._id,
            tokenVersion: latestUser.tokenVersion,
          },
        };

        let refreshToken;
        try {
          refreshToken = await this.createRefreshToken(rTPayload);
          saveRefreshToken(refreshToken);
        } catch (error) {
          logger.error('Failed to create or save refresh token', {
            error: error.message,
          });
          throw error;
        }

        latestUser.id = latestUser._id;
        delete latestUser._id;
        latestUser.accessToken = accessToken;

        const response = {
          ...latestUser,
          payment: latestUser.payment ?? {
            payment_method: '',
            customer_id: '',
          },
        };

        const cookieResult =
          process.env.COOKIE_NAME &&
          res
            .cookie(cookieName, refreshToken, {
              expires: new Date(Date.now() + SERVER.REFRESH_EXPY * 1000),
              domain: process.env.COOKIE_DOMAIN,
              secure: isCookieSecure,
              sameSite: 'strict',
              httpOnly: true,
              path: '/',
            })
            .json(response);

        return cookieResult;
      } catch (error) {
        if (error instanceof NotAuthorized) {
          return this.guardErrorHandler(error, req, res, next);
        }
        throw error;
      }
    };
  }

  /**
   * Authorizes a request by validating JWT tokens from headers or cookies
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Array>} Array containing [jwt, token] or throws NotAuthorized
   */
  async authorizeRequest(req, res) {
    let scheme;
    let jwt;

    if (req.header('Authorization')) {
      [scheme, jwt] = String(req.header('Authorization')).split(' ');
    }

    if (req.cookies[cookieName]) {
      scheme = 'Bearer';
      jwt = req.cookies[cookieName];
    }

    if (scheme !== 'Bearer' || !jwt) {
      throw new NotAuthorized();
    }

    let token;
    try {
      token = await this.verify(jwt);
    } catch (error) {
      this.handleTokenRejection(req, res, error);
      throw new NotAuthorized('Token verification failed');
    }
    // Suppress logs for API route tester requests
    if (req.get('x-route-tester') !== 'true') {
      logger.debug('Authorization successful, returning token', {
        url: req.originalUrl,
      });
    }
    return [jwt, token];
  }

  /**
   * Creates a guard middleware function for protecting routes
   * @returns {Function} Express middleware function for route protection
   */
  guard() {
    return async (req, res, next) => {
      try {
        const [, token] = await this.authorizeRequest(req, res);
        req.jwt = token;
        if (token.payload.user) this.subject = token.payload.user._id;
      } catch (e) {
        // Ensure a proper 401 response is returned to the client
        this.handleTokenRejection(req, res, e);
        return;
      }
      return next();
    };
  }

  /**
   * Creates an access token
   * @param {Object} [payload={}] - Token payload
   * @returns {Promise<string>} Signed JWT access token
   */
  createAccessToken(payload = {}) {
    return promisify(jwt.sign)(payload, this.secret, {
      expiresIn: this.accessTokenExp,
      audience: this.audience,
      subject: this.subject,
      issuer: this.issuer,
      jwtid: this.jwtid,
    });
  }

  /**
   * Creates a refresh token
   * @param {Object} [payload={}] - Token payload
   * @returns {Promise<string>} Signed JWT refresh token
   */
  createRefreshToken(payload = {}) {
    let rTPayload = { isRefresh: true };
    if (payload.user) {
      const subject = String(payload.user._id);
      this.subject = subject;
      rTPayload.tv = payload.user.tokenVersion;
    }

    return promisify(jwt.sign)(rTPayload, this.secret, {
      expiresIn: this.refreshTokenExp,
      // * 1000,
      audience: this.audience,
      subject: this.subject,
      issuer: this.issuer,
      jwtid: this.jwtid,
    });
  }

  /**
   * Verifies a JWT token
   * @param {string} token - JWT token to verify
   * @returns {Promise<Object>} Decoded token payload
   */
  verify(token) {
    return promisify(jwt.verify)(token, this.secret, {
      audience: this.audience,
      issuer: this.issuer,
      jwtid: this.jwtid,
      complete: true,
    });
  }

  /**
   * Finds a user by email and password (to be implemented by subclasses)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findUser() {
    console.warn('[AuthBase] findUser called outside of base class');
  }

  /**
   * Handles authentication errors (to be implemented by subclasses)
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authErrorHandler() {
    console.warn('[AuthBase] authErrorHandler called outside of base class');
  }

  /**
   * Handles guard/authorization errors (to be implemented by subclasses)
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  guardErrorHandler() {
    console.warn('[AuthBase] guardErrorHandler called outside of base class');
  }
}

/**
 * Error thrown when user is not found during authentication
 * @extends Error
 */
class UserNotFound extends Error {}

/**
 * Error thrown when request is malformed
 * @extends Error
 */
class BadRequest extends Error {}

/**
 * Error thrown when user is not authorized
 * @extends Error
 */
class NotAuthorized extends Error {}

module.exports = {
  NotAuthorized,
  UserNotFound,
  BadRequest,
  AuthBase,
};
