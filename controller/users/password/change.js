/**
 * @fileoverview Password Change Controller
 *
 * This controller handles password changes for authenticated users. It
 * securely hashes the new password, updates the user account, invalidates
 * all existing tokens by incrementing tokenVersion, creates new JWT tokens,
 * and sends a confirmation email.
 *
 * KEY FUNCTIONS
 *
 * change(req, res, model)
 * - Changes user password with current password verification
 * - Invalidates all existing tokens (access and refresh)
 * - Creates new JWT tokens for continued session
 * - Sends confirmation email
 *
 * BUSINESS LOGIC
 *
 * PASSWORD HASHING
 * - Uses bcrypt with configurable salt work factor
 * - Password hashed before storage in database
 * - Salt work factor from SALT_WORK_FACTOR environment variable
 *
 * TOKEN INVALIDATION
 * - Increments user.tokenVersion to invalidate all existing tokens
 * - Removes old refresh token from token store
 * - Creates new access and refresh tokens
 * - Sets new refresh token in HTTP-only cookie
 *
 * EMAIL CONFIRMATION
 * - Sends password change confirmation email
 * - Email sending is non-blocking (errors logged but don't fail password change)
 * - Uses Change email template
 *
 * SECURITY
 * - Verifies current password with bcrypt.compare before updating
 * - All existing sessions invalidated on password change
 * - New tokens required for continued access
 *
 * DEPENDENCIES
 * - bcryptjs: Password hashing
 * - jsonwebtoken: JWT token creation
 * - auth/tokenStore: Refresh token management
 * - services/utils/logger: Logging
 * - constants: Server configuration
 * - controller/comms/emails: Email templates
 * - controller/comms: Email sending
 *
 * @module controller/users/password/change
 * @requires util
 * @requires bcryptjs
 * @requires jsonwebtoken
 * @requires ../../../auth/tokenStore
 * @requires ../../../services/utils/logger
 * @requires ../../../constants
 * @requires ../../comms/emails
 * @requires ../../comms
 */

const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findAndRemoveRefreshToken } = require('../../../auth/tokenStore');
const logger = require('../../../services/utils/logger')(__filename);
const { SERVER } = require('../../../constants');
const { emails } = require('../../comms/emails');
const { sendEmail } = require('../../comms/');

const SALT = Number(process.env.SALT_WORK_FACTOR);

/**
 * Cookie configuration
 */
const isCookieSecure = process.env.NODE_ENV === 'production',
  cookieName =
    (isCookieSecure ? '__Secure-' : '') + process.env.COOKIE_NAME ??
    'powerback.refreshToken';

/**
 * Extracts the JWT ID (jti) from a JWT token
 * @param {string} token - JWT token to extract jwtid from
 * @returns {string|null} The jwtid from the token or null if extraction fails
 */
function extractJwtidFromToken(token) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    return payload.jti;
  } catch (error) {
    return null;
  }
}

/**
 * Password change controller module
 * @module passwordChange
 */
module.exports = {
  /**
   * Changes a user's password and issues new JWT tokens
   * @param {Object} req - Express request object
   * @param {Object} req.jwt - JWT token object
   * @param {string} req.body.username - Username of the user changing password
   * @param {string} req.body.newPassword - New password to set
   * @param {Object} req.cookies - HTTP-only cookies containing refresh token
   * @param {Object} res - Express response object
   * @param {Object} model - User model for database operations
   * @returns {Promise<void>} Resolves when password change is complete
   */
  change: (req, res, model) => {
    model
      .findOne({ _id: req.params.userId })
      .then((user) => {
        if (!user) {
          return res
            .status(404)
            .json({ error: { message: 'User not found.' } });
        }
        return bcrypt
          .compare(req.body.currentPassword, user.password)
          .then((valid) => {
            if (!valid) {
              return res.status(401).json({
                details: { current: 'Incorrect current password.' },
              });
            }
            runPasswordUpdate(req, res, model);
          });
      })
      .catch((err) => {
        logger.error('Password change failed', {
          action: 'change_password',
          userId: req.params.userId,
          error: err.message,
          ip: req.ip,
        });
        if (!res.headersSent) {
          res.status(400).json({ error: err.message });
        }
      });
  },
};

/**
 * Hashes new password, updates user, rotates tokens, and sends confirmation email.
 * Called after current password has been verified.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Object} model - User model
 */
function runPasswordUpdate(req, res, model) {
  bcrypt.genSalt(SALT, (err, salt) => {
    if (err) {
      logger.error('Password change failed - salt generation error', {
        action: 'change_password',
        userId: req.params.userId,
        error: err.message,
        ip: req.ip,
      });
      return res.status(422).json({ error: err.message });
    }

    bcrypt.hash(req.body.newPassword, salt, (err, cipher) => {
      if (err) {
        logger.error('Password change failed - hash error', {
          action: 'change_password',
          userId: req.params.userId,
          error: err.message,
          ip: req.ip,
        });
        return res.status(422).json({ error: err.message });
      }

      model
        .findOneAndUpdate(
          { _id: req.params.userId },
          {
            $set: {
              password: cipher,
              tryPasswordAttempts: 0,
              resetPasswordHash: null,
              resetPasswordHashExpires: null,
              resetPasswordHashIssueDate: null,
              lastTimeUpdatedPassword: new Date(),
            },
            $inc: { tokenVersion: 1 },
          },
          { new: true, useFindAndModify: false }
        )
        .then((dbModel) => {
          if (!dbModel) {
            throw new Error('User not found!');
          }
          return dbModel;
        })
        .then(async (user) => {
          // Remove old refresh token
          // Get current refresh token from HTTP-only cookie

          const currentRefreshToken = req.cookies[cookieName];
          if (currentRefreshToken) {
            findAndRemoveRefreshToken(currentRefreshToken);
          }

          let currentJwtid;

          if (req.jwt && req.jwt.payload && req.jwt.payload.jti) {
            currentJwtid = req.jwt.payload.jti;
          } else if (currentRefreshToken) {
            const extractedJwtid = extractJwtidFromToken(currentRefreshToken);
            if (extractedJwtid) {
              currentJwtid = extractedJwtid;
            }
          }

          // Create new tokens using JWT
          let jwtSignArgs = [
            { user: { _id: req.params.userId } },
            process.env.JWT_SECRET,
            {
              expiresIn: SERVER.ACCESS_EXPY,
              audience: SERVER.JWT.AUDIENCE,
              issuer: process.env.PROD_URL,
              subject: req.params.userId,
              jwtid: currentJwtid,
            },
          ];
          const accessToken = await promisify(jwt.sign)(...jwtSignArgs);

          // Create refresh token with different payload
          jwtSignArgs[0] = {
            isRefresh: true,
            tv: user.tokenVersion,
          };
          jwtSignArgs[2].expiresIn = SERVER.REFRESH_EXPY * 1000;

          const refreshToken = await promisify(jwt.sign)(...jwtSignArgs);

          // Store new refresh token
          const { saveRefreshToken } = require('../../../auth/tokenStore');
          saveRefreshToken(refreshToken);

          // Send confirmation email
          if (user) {
            logger.info('User changed password', {
              action: 'change_password',
              userId: req.params.userId,
              ip: req.ip,
            });

            // Email sending is non-blocking - log errors but don't fail password change
            sendEmail(
              user.email && user.email !== '' ? user.email : user.username,
              emails.Change,
              null
            ).catch((emailErr) => {
              logger.error(
                'Failed to send password change email (non-blocking):',
                {
                  userId: req.params.userId,
                  error: emailErr.message,
                }
              );
            });
          }
          // Set the refresh token cookie and send response
          res
            .cookie(cookieName, refreshToken, {
              expires: new Date(Date.now() + SERVER.REFRESH_EXPY * 1000),
              domain: process.env.COOKIE_DOMAIN,
              secure: isCookieSecure,
              sameSite: 'strict',
              httpOnly: true,
              path: '/',
            })
            .json({
              message: 'Your password has been successfully changed.',
              accessToken: accessToken,
            });
        })
        .catch((err) => {
          logger.error('Password change failed', {
            action: 'change_password',
            userId: req.params.userId,
            error: err.message,
            ip: req.ip,
          });

          if (!res.headersSent) {
            res.status(400).json({
              error: err.message,
            });
          }
        });
    });
  });
}
