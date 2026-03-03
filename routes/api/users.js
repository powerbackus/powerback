/**
 * @fileoverview Users API routes for authentication, account management, and profile operations
 *
 * This module provides comprehensive user management functionality, including
 * authentication, account creation, profile updates, and compliance management.
 * It serves as the primary interface for all user-related operations in the
 * POWERBACK.us application.
 *
 * TABLE OF CONTENTS - API ENDPOINTS
 *
 * AUTHENTICATION & SESSION MANAGEMENT
 * ├── POST   /api/users/login              - User login with JWT tokens
 * ├── GET    /api/users/logout             - User logout and session cleanup
 * └── POST   /api/users/refresh            - Refresh JWT access tokens
 *
 * ACCOUNT CREATION & ACTIVATION
 * ├── POST   /api/users/                   - Create new user account
 * └── GET    /api/users/activate/:hash     - Activate account via email hash
 *
 * PASSWORD MANAGEMENT
 * ├── PUT    /api/users/change/:userId     - Change user password
 * ├── PUT    /api/users/forgot             - Initiate password reset
 * ├── GET    /api/users/reset/:hash        - Validate password reset hash
 * └── PUT    /api/users/reset              - Complete password reset
 *
 * UNSUBSCRIBE MANAGEMENT
 * ├── GET    /api/users/unsubscribe/:hash  - Verify unsubscribe hash
 * └── POST   /api/users/unsubscribe        - Confirm unsubscribe from topic
 *
 * USER DATA & PROFILE MANAGEMENT
 * ├── GET    /api/users/data/:userId       - Retrieve user data for frontend
 * ├── PUT    /api/users/update/:userId     - Update user profile information
 * └── DELETE /api/users/delete/:userId     - Delete user account
 *
 * COMPLIANCE & PERMISSIONS
 * ├── GET    /api/users/privilege/:userId  - Check donation eligibility
 * ├── PATCH  /api/users/privilege/:userId  - Grant donation privileges
 * ├── GET    /api/users/compliance/:userId - Check compliance tier status
 * └── PATCH  /api/users/promote/:userId    - Promote compliance tier
 *
 * PAC LIMIT MANAGEMENT
 * └── PATCH  /api/users/:userId/tipLimitReached - Set PAC limit reached flag
 *
 * AUTHENTICATION FLOW
 * - Local authentication using username/password
 * - JWT access tokens for API authorization
 * - Refresh tokens for session persistence
 * - HTTP-only cookies for secure token storage
 *
 * COMPLIANCE MANAGEMENT
 * - User compliance tier promotion (guest → compliant)
 * - FEC compliance validation and enforcement
 * - Profile completion tracking
 *
 * @module routes/api/users
 * @requires express
 * @requires express-rate-limit
 * @requires ../../services/cookies
 * @requires ../../constants
 * @requires ../../validation
 * @requires ../../services
 * @requires ../../auth/tokenizer
 * @requires ../../controller/users
 * @requires ../../models
 * @requires ./middleware/guardOwnership
 */

const router = require('express').Router(),
  {
    rateLimiters,
    clearCSRFCookie,
    clearRefreshCookie,
    csrfTokenValidator,
  } = require('../../services/utils'),
  schemas = require('../../validation'),
  { SERVER } = require('../../constants'),
  { validate } = require('../../validation'),
  { promoteUser } = require('../../services'),
  tokenizer = require('../../auth/tokenizer'),
  Controller = require('../../controller/users'),
  { User, ExUser, Applicant } = require('../../models'),
  guardOwnership = require('./middleware/guardOwnership');

/**
 * Rate limiting for account creation, login, and password reset
 * Localhost requests are exempt in development mode
 */
const loginLimiter = rateLimiters.login;
const createAccountLimiter = rateLimiters.createAccount;
const passwordResetLimiter = rateLimiters.passwordReset;
const emailVerificationLimiter = rateLimiters.emailVerification;

// All routes prefixed with '/api/users'

/**
 * PATCH /api/users/:userId/tipLimitReached
 * Updates the tipLimitReached field for a user when they hit their PAC limit
 *
 * This endpoint is called when a user reaches their annual PAC contribution limit
 * and sets tipLimitReached to true, preventing them from giving more tips
 *
 * @param {string} userId - User ID to update
 * @param {Object} req.body - Request body containing tipLimitReached boolean
 * @returns {Object} Updated user data
 */
router
  .route('/:userId/tipLimitReached')
  .patch(
    csrfTokenValidator(),
    guardOwnership,
    validate(schemas.userUpdate),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { tipLimitReached } = req.body;

        // Only allow setting tipLimitReached to true (can't manually set to false)
        if (tipLimitReached !== true) {
          return res.status(400).json({
            error:
              'tipLimitReached can only be set to true when PAC limit is reached',
          });
        }

        const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          { tipLimitReached: true },
          {
            new: true,
            useFindAndModify: false,
          }
        );

        if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

/**
 * POST /api/users/refresh
 * Refreshes JWT tokens using the refresh token from cookies
 *
 * This endpoint allows clients to obtain new access tokens using
 * a refresh token stored in an HTTP-only cookie. This provides
 * secure token refresh without exposing refresh tokens to JavaScript.
 *
 * @returns {Object} New access token or error response
 */

router.route('/refresh').post(csrfTokenValidator(), tokenizer.refresh());

/**
 * GET /api/users/data/:userId
 * Retrieves user data for frontend consumption
 *
 * This endpoint provides comprehensive user data for frontend applications,
 * including profile information, settings, compliance status, and other
 * user-specific data needed for the application interface.
 *
 * The endpoint is protected by ownership guard middleware to ensure
 * users can only access their own data.
 *
 * @param {string} userId - User ID to retrieve data for
 * @returns {Object} User data object
 *
 * @example
 * ```javascript
 * GET /api/users/data/507f1f77bcf86cd799439011
 *
 * // Response
 * {
 *   "id": "507f1f77bcf86cd799439011",
 *   "username": "john_doe",
 *   "email": "john@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "compliance": "compliant",
 *   "settings": {
 *     "emailReceipts": true,
 *     "showToolTips": true,
 *     "autoTweet": false
 *   }
 * }
 * ```
 */

router
  .route('/data/:userId')
  .get(tokenizer.guard(), guardOwnership(), async (req, res, next) => {
    try {
      // Retrieve user data from database
      const userData = await Controller.contact(req.params.userId, User);

      // Normalize ID field for frontend consumption
      userData.id = userData._id;
      delete userData._id;

      // Normalize settings to ensure unsubscribedFrom is always an array
      if (userData.settings) {
        userData.settings = {
          unsubscribedFrom: userData.settings.unsubscribedFrom || [],
          emailReceipts: true,
          showToolTips: true,
          autoTweet: false,
          ...userData.settings,
        };
      }

      res.json(userData);
    } catch (error) {
      next(error);
    }
  });

/**
 * GET /api/users/privilege/:userId
 * Checks user's permission to start donating (eligibility)
 *
 * This endpoint verifies whether a user has the necessary permissions
 * to begin making donations. It checks various eligibility criteria
 * including account status, compliance requirements, and other factors.
 *
 * Eligibility requirements:
 * - Account must be activated (not in Applicant collection)
 * - Account must not be locked
 * - User must understand eligibility requirements (understands flag)
 * - Other compliance and account status checks
 *
 * @route GET /api/users/privilege/:userId
 * @param {string} userId - User ID to check privileges for
 * @returns {Object} Privilege status object
 * @returns {boolean} result.hasPrivilege - Whether user can donate
 * @returns {string} [result.reason] - Reason if privilege denied
 * @throws {401} Unauthorized
 * @throws {404} User not found
 *
 * @example
 * ```javascript
 * GET /api/users/privilege/507f1f77bcf86cd799439011
 *
 * // Has privilege response
 * {
 *   "hasPrivilege": true
 * }
 *
 * // No privilege response
 * {
 *   "hasPrivilege": false,
 *   "reason": "Account not activated"
 * }
 * ```
 */

router
  .route('/privilege/:userId')
  .get(tokenizer.guard(), async (req, res) =>
    res.json(await Controller.certify(req.params.userId, User))
  );

/**
 * PATCH /api/users/privilege/:userId
 * Gives user permission to start donating (eligibility)
 *
 * This endpoint grants donation privileges to a user, typically after
 * they have completed necessary verification steps or met eligibility
 * requirements. Sets the understands flag to true, indicating the
 * user has acknowledged and understood the eligibility requirements.
 *
 * @route PATCH /api/users/privilege/:userId
 * @param {string} userId - User ID to grant privileges to
 * @returns {Object} Updated privilege status
 * @returns {boolean} result.hasPrivilege - Whether user can now donate
 * @returns {boolean} result.understands - Whether understands flag was set
 * @throws {400} Invalid request
 * @throws {401} Unauthorized
 * @throws {403} Not authorized to grant privileges for this user
 *
 * @example
 * ```javascript
 * PATCH /api/users/privilege/507f1f77bcf86cd799439011
 *
 * // Success response
 * {
 *   "hasPrivilege": true,
 *   "understands": true
 * }
 * ```
 */

router
  .route('/privilege/:userId')
  .patch(
    csrfTokenValidator(),
    tokenizer.guard(),
    guardOwnership(),
    (req, res) => res.json(Controller.empower(req.params.userId, User))
  );

/**
 * GET /api/users/compliance/:userId
 * Checks user permission to donate full amount (has filled out profile)
 *
 * This endpoint determines a user's current compliance tier and whether
 * they have completed the necessary profile information to qualify for
 * higher donation limits according to FEC regulations.
 *
 * Compliance tiers:
 * - Guest: $50 per donation, $200 annual cap (minimal profile)
 * - Compliant: $3,500 per candidate per election (name + address + employment required)
 *
 * @route GET /api/users/compliance/:userId
 * @param {string} userId - User ID to check compliance for
 * @returns {string} Compliance tier ('guest' or 'compliant')
 * @throws {401} Unauthorized
 * @throws {403} Not authorized to check this user's compliance
 * @throws {404} User not found
 *
 * @example
 * ```javascript
 * GET /api/users/compliance/507f1f77bcf86cd799439011
 *
 * // Response
 * "compliant"
 * ```
 */

router
  .route('/compliance/:userId')
  .get(tokenizer.guard(), guardOwnership(), async (req, res) =>
    res.json(await Controller.deem(req.params.userId, User))
  );

/**
 * PATCH /api/users/promote/:userId
 * Gives user permission to donate full amount (has filled out profile)
 *
 * This endpoint promotes a user's compliance tier based on their profile
 * completion status. It evaluates the user's provided information and
 * upgrades their compliance level accordingly (guest → compliant).
 *
 * The promotion process includes:
 * - Profile completion validation
 * - FEC compliance requirements checking
 * - Email notification to user
 * - Database update with new compliance tier
 *
 * @param {string} userId - User ID to promote
 * @returns {Object} Promotion result
 *
 * @example
 * ```javascript
 * PATCH /api/users/promote/507f1f77bcf86cd799439011
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "address": "123 Main St",
 *   "city": "New York",
 *   "state": "NY",
 *   "zip": "10001"
 * }
 *
 * // Response
 * {
 *   "compliance": "compliant",
 *   "updated": true
 * }
 * ```
 */

router
  .route('/promote/:userId')
  .patch(
    csrfTokenValidator(),
    tokenizer.guard(),
    guardOwnership(),
    validate(schemas.patchPromote),
    async (req, res) => {
      try {
        // Promote user compliance tier and send notification email
        const result = await promoteUser(
          { ...req.body, _id: req.params.userId },
          User,
          Controller.promote
        );

        res.json(result);
      } catch (err) {
        res.status(400).json({ promotion: false, err: err.message });
      }
    }
  );

/**
 * PUT /api/users/update/:userId
 * Updates user account information
 *
 * This endpoint allows users to update their profile information,
 * including personal details, contact information, and preferences.
 * Updates are validated against FEC compliance requirements and may
 * trigger compliance tier promotion if additional information is provided.
 *
 * @route PUT /api/users/update/:userId
 * @param {string} userId - User ID to update
 * @param {Object} req.body - User update data
 * @param {string} [req.body.firstName] - User's first name
 * @param {string} [req.body.lastName] - User's last name
 * @param {string} [req.body.email] - User's email address
 * @param {string} [req.body.phoneNumber] - User's phone number
 * @param {string} [req.body.address] - User's street address
 * @param {string} [req.body.city] - User's city
 * @param {string} [req.body.state] - User's state code
 * @param {string} [req.body.zip] - User's ZIP code
 * @param {string} [req.body.country] - User's country
 * @param {string} [req.body.passport] - User's passport number (if non-US)
 * @param {boolean} [req.body.isEmployed] - Employment status
 * @param {string} [req.body.occupation] - User's occupation
 * @param {string} [req.body.employer] - User's employer
 * @returns {Object} Updated user data
 * @throws {400} Invalid input data
 * @throws {401} Unauthorized
 * @throws {403} Not authorized to update this user
 *
 * @example
 * ```javascript
 * PUT /api/users/update/507f1f77bcf86cd799439011
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "address": "123 Main St",
 *   "city": "New York",
 *   "state": "NY",
 *   "zip": "10001"
 * }
 *
 * // Response
 * {
 *   "id": "507f1f77bcf86cd799439011",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "compliance": "compliant",
 *   ...
 * }
 * ```
 */
router
  .route('/update/:userId')
  .put(
    csrfTokenValidator(),
    tokenizer.guard(),
    guardOwnership(),
    validate(schemas.contactInfo),
    (req, res) => Controller.update(req, res, User)
  );

/**
 * PUT /api/users/settings/:userId
 * Updates user settings/preferences
 *
 * This endpoint allows users to update their application settings,
 * including email preferences, tooltips, auto-tweet functionality,
 * and email topic subscriptions.
 *
 * @route PUT /api/users/settings/:userId
 * @param {string} userId - User ID to update
 * @param {Object} req.body.settings - Settings object to update
 * @param {boolean} [req.body.settings.emailReceipts] - Enable/disable email receipts
 * @param {boolean} [req.body.settings.showToolTips] - Enable/disable tooltips
 * @param {boolean} [req.body.settings.autoTweet] - Enable/disable auto-tweeting
 * @param {string[]} [req.body.settings.unsubscribedFrom] - Array of email topics to unsubscribe from
 * @returns {Object} Updated user data with new settings
 * @throws {400} Invalid settings data
 * @throws {401} Unauthorized
 * @throws {403} Not authorized to update this user
 *
 * @example
 * ```javascript
 * PUT /api/users/settings/507f1f77bcf86cd799439011
 * {
 *   "settings": {
 *     "emailReceipts": false,
 *     "showToolTips": true,
 *     "autoTweet": true,
 *     "unsubscribedFrom": ["election_updates"]
 *   }
 * }
 *
 * // Response
 * {
 *   "id": "507f1f77bcf86cd799439011",
 *   "settings": {
 *     "emailReceipts": false,
 *     "showToolTips": true,
 *     "autoTweet": true,
 *     "unsubscribedFrom": ["election_updates"]
 *   },
 *   ...
 * }
 * ```
 */
router
  .route('/settings/:userId')
  .put(
    csrfTokenValidator(),
    tokenizer.guard(),
    guardOwnership(),
    validate(schemas.settings),
    (req, res) => Controller.update(req, res, User)
  );

/**
 * POST /api/users/
 * Creates a new user account
 *
 * This endpoint handles user registration by creating a new account
 * in the Applicant collection. The account must be activated via
 * email verification before it becomes a full User account.
 *
 * @param {Object} req.body - User registration data
 * @param {string} req.body.username - Desired username
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @returns {Object} Account creation result
 *
 * @example
 * ```javascript
 * POST /api/users
 * {
 *   "username": "john_doe",
 *   "email": "john@example.com",
 *   "password": "securepassword123"
 * }
 *
 * // Success response
 * {
 *   "isSignupHashConfirmed": true,
 *   "isLinkExpired": false
 * }
 *
 * // Failure response (username taken)
 * {
 *   "isSignupHashConfirmed": false,
 *   "isLinkExpired": false
 * }
 * ```
 */
router
  .route('/')
  .post(
    createAccountLimiter,
    validate(schemas.userEntryForm),
    async (req, res) => {
      const logger = require('../../services/utils/logger')(__filename);
      logger.debug(
        `POST /api/users/ - Account creation request for: ${req.body.username}`
      );

      // Define failure response structure
      const fail = {
        isSignupHashConfirmed: false,
        isLinkExpired: false,
      };

      // Check if username already exists across all user collections
      logger.debug(`Checking if username exists: ${req.body.username}`);
      const anyUser =
        (await Controller.verify(req.body.username, 'username', User)) ||
        (await Controller.verify(req.body.username, 'username', Applicant)) ||
        (await Controller.verify(req.body.username, 'username', ExUser));

      if (anyUser) {
        // Username already exists - return failure
        logger.debug(`Username already exists: ${req.body.username}`);
        res.json(fail); // send warning email to existing User?
      } else {
        // Create new account in Applicant collection
        logger.debug(
          `Username available, calling Controller.create for: ${req.body.username}`
        );
        const newAccount = await Controller.create(req.body, Applicant, ExUser);
        logger.debug(
          `Controller.create returned: ${
            newAccount === 'undefined' ? 'undefined' : typeof newAccount
          }`
        );

        // Check if account creation failed (returns error object or 'undefined')
        // create() returns an Error object when email sending fails
        const isError =
          newAccount instanceof Error ||
          newAccount === 'undefined' ||
          (newAccount &&
            typeof newAccount === 'object' &&
            newAccount.message &&
            newAccount.stack);

        if (isError) {
          logger.debug(
            `Account creation failed (error returned), returning fail response`
          );
          res.json(fail);
        } else {
          logger.debug(`Account creation successful, returning newAccount`);
          res.json(newAccount);
        }
      }
    }
  );

/**
 * GET /api/users/activate/:hash
 * Activates a user account using activation hash
 *
 * This endpoint completes the user registration process by activating
 * an account using the hash sent via email. It moves the account from
 * the Applicant collection to the User collection, making it a fully
 * active account that can log in and make donations.
 *
 * The activation process:
 * 1. Validates the activation hash
 * 2. Checks if hash is expired
 * 3. Moves account from Applicant to User collection
 * 4. Prevents username reuse by checking ExUser collection
 * 5. Sends welcome email to activated user
 *
 * @route GET /api/users/activate/:hash
 * @param {string} hash - Activation hash from email link
 * @returns {Object} Activation result
 * @returns {boolean} result.isSignupHashConfirmed - Whether activation was successful
 * @returns {boolean} result.isLinkExpired - Whether activation link has expired
 * @throws {400} Invalid or expired hash
 * @throws {409} Username already exists (account already activated or deleted)
 *
 * @example
 * ```javascript
 * GET /api/users/activate/abc123def456...
 *
 * // Success response
 * {
 *   "isSignupHashConfirmed": true,
 *   "isLinkExpired": false
 * }
 *
 * // Expired link response
 * {
 *   "isSignupHashConfirmed": false,
 *   "isLinkExpired": true
 * }
 * ```
 */
router
  .route('/activate/:hash')
  .get(emailVerificationLimiter, async (req, res) =>
    res.json(
      await Controller.activate(req.params.hash, Applicant, User, ExUser)
    )
  );

/**
 * PUT /api/users/change/:userId
 * Changes user password
 *
 * This endpoint allows users to change their password. It requires
 * the current password for verification before allowing the change.
 * Upon successful password change, all existing tokens are invalidated
 * by incrementing the user's tokenVersion, requiring re-authentication.
 *
 * @route PUT /api/users/change/:userId
 * @param {string} userId - User ID to change password for
 * @param {Object} req.body - Password change data
 * @param {string} req.body.currentPassword - Current password for verification
 * @param {string} req.body.newPassword - New password to set
 * @returns {Object} Password change result
 * @throws {400} Invalid password data or validation failed
 * @throws {401} Unauthorized or incorrect current password
 * @throws {403} Not authorized to change this user's password
 *
 * @example
 * ```javascript
 * PUT /api/users/change/507f1f77bcf86cd799439011
 * {
 *   "currentPassword": "oldpassword123",
 *   "newPassword": "newpassword456"
 * }
 *
 * // Success response
 * {
 *   "success": true,
 *   "message": "Password changed successfully"
 * }
 * ```
 */
router
  .route('/change/:userId')
  .put(
    csrfTokenValidator(),
    tokenizer.guard(),
    guardOwnership(),
    validate(schemas.changePassword),
    (req, res) => {
      Controller.change(req, res, User);
    }
  );

/**
 * PUT /api/users/forgot
 * Initiates password reset process
 *
 * This endpoint starts the password reset process by sending a
 * reset link to the user's email address. The link contains a
 * time-limited hash for security. The hash expires after a set
 * time period and can only be used a limited number of times.
 *
 * Security: Rate limited to prevent abuse. Does not reveal whether
 * email exists in system to prevent user enumeration.
 *
 * @route PUT /api/users/forgot
 * @param {Object} req.body - Password reset request
 * @param {string} req.body.email - Email address for password reset
 * @returns {Object} Password reset initiation result
 * @returns {boolean} result.success - Whether reset email was sent (always true to prevent enumeration)
 * @throws {400} Missing email address
 * @throws {429} Too many requests (rate limited)
 *
 * @example
 * ```javascript
 * PUT /api/users/forgot
 * {
 *   "email": "user@example.com"
 * }
 *
 * // Response (same for valid and invalid emails to prevent enumeration)
 * {
 *   "success": true,
 *   "message": "If an account exists with this email, a password reset link has been sent"
 * }
 * ```
 */
router.route('/forgot').put(passwordResetLimiter, async (req, res) => {
  res.json(await Controller.forgot(req.body.email, User));
  // what about accounts not yet activated?
});

/**
 * GET /api/users/reset/:hash
 * Validates password reset hash
 *
 * This endpoint validates a password reset hash from the email link
 * and determines if it's still valid and not expired. This is called
 * before allowing the user to set a new password.
 *
 * @route GET /api/users/reset/:hash
 * @param {string} hash - Password reset hash from email link
 * @returns {Object} Hash validation result
 * @returns {boolean} result.isHashConfirmed - Whether hash is valid
 * @returns {boolean} result.isLinkExpired - Whether reset link has expired
 * @throws {400} Invalid hash format
 * @throws {429} Too many validation attempts (rate limited)
 *
 * @example
 * ```javascript
 * GET /api/users/reset/abc123def456...
 *
 * // Valid hash response
 * {
 *   "isHashConfirmed": true,
 *   "isLinkExpired": false
 * }
 *
 * // Expired hash response
 * {
 *   "isHashConfirmed": false,
 *   "isLinkExpired": true
 * }
 * ```
 */
router.route('/reset/:hash').get(emailVerificationLimiter, async (req, res) => {
  // Check if hash has been used too many times (rate limiting)
  if (await Controller.rattle('resetPasswordHash', req.params.hash, User))
    res.json({
      isHashConfirmed: false,
      isLinkExpired: false,
    });
  else res.json(await Controller.confirm(req.params.hash, User));
});

/**
 * PUT /api/users/reset
 * Resets user password using reset hash
 *
 * This endpoint completes the password reset process by setting a
 * new password using the validated reset hash. Upon successful reset,
 * all existing tokens are invalidated by incrementing tokenVersion,
 * requiring re-authentication.
 *
 * The reset process includes validation to prevent:
 * - Using the same password as before
 * - Too many failed reset attempts (account lockout)
 * - Reusing expired or invalid hashes
 *
 * @route PUT /api/users/reset
 * @param {Object} req.body - Password reset data
 * @param {string} req.body.hash - Password reset hash from email
 * @param {string} req.body.newPassword - New password to set
 * @returns {Object} Password reset result
 * @returns {boolean|string} result - Success status or error message
 * @throws {400} Invalid hash or password validation failed
 * @throws {403} Account locked due to too many failed attempts
 * @throws {429} Too many requests (rate limited)
 *
 * @example
 * ```javascript
 * PUT /api/users/reset
 * {
 *   "hash": "abc123def456...",
 *   "newPassword": "newsecurepassword123"
 * }
 *
 * // Success response
 * {
 *   "success": true,
 *   "message": "Password reset successfully"
 * }
 *
 * // Account locked response
 * "This account has been locked."
 * ```
 */
router
  .route('/reset')
  .put(
    passwordResetLimiter,
    validate(schemas.resetPassword),
    async (req, res) => {
      // Prepare validation arguments
      const args = {
        ...req.body,
        model: User,
        emailTemplate: 'Reset',
      };

      // Validate password reset request
      const validation = await Controller.validate(args);
      if (typeof validation === 'number') {
        if (validation < 3) {
          res.json(validation); // define?
        } else {
          // Account locked due to too many failed attempts
          clearRefreshCookie(res); // Clear the refresh token cookie
          res.json('This account has been locked.');
        }
      } else if (validation === true) {
        // Validation passed - proceed with password reset
        await Controller.reset(req, res, User);
        // Controller handles all responses (success, error, or same password)
        return;
      }
    }
  );

/**
 * GET /api/users/unsubscribe/:hash
 * Verify unsubscribe hash
 *
 * This endpoint validates an unsubscribe hash from the email link
 * and determines if it's still valid and not expired. This is called
 * before allowing the user to unsubscribe from email topics.
 *
 * @route GET /api/users/unsubscribe/:hash
 * @param {string} hash - Unsubscribe hash from email link
 * @returns {Object} Validation result
 * @returns {boolean} result.isValid - Whether hash is valid
 * @returns {boolean} result.isExpired - Whether unsubscribe link has expired
 * @returns {string} [result.userId] - User ID if hash is valid
 * @throws {400} Invalid hash format
 * @throws {404} Hash not found
 *
 * @example
 * ```javascript
 * GET /api/users/unsubscribe/abc123def456...
 *
 * // Valid hash response
 * {
 *   "isValid": true,
 *   "isExpired": false,
 *   "userId": "507f1f77bcf86cd799439011"
 * }
 *
 * // Expired hash response
 * {
 *   "isValid": false,
 *   "isExpired": true
 * }
 * ```
 */
router.route('/unsubscribe/:hash').get(async (req, res) => {
  try {
    const result = await Controller.unsubscribe.verify(req.params.hash, User);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/unsubscribe
 * Confirm unsubscribe from topic
 *
 * This endpoint confirms the user's intent to unsubscribe from a
 * specific email topic. The user's preferences are updated to
 * exclude the specified topic from future email communications.
 *
 * Available email topics:
 * - celebration_updates: Updates about celebrations and donations
 * - election_updates: Updates about election dates and changes
 * - account_updates: Account-related notifications
 *
 * @route POST /api/users/unsubscribe
 * @param {Object} req.body - Unsubscribe confirmation data
 * @param {string} req.body.hash - Unsubscribe hash from email
 * @param {string} req.body.topic - Email topic to unsubscribe from
 * @returns {Object} Success status
 * @returns {boolean} result.success - Whether unsubscribe was successful
 * @throws {400} Invalid hash or topic
 * @throws {404} Hash not found or expired
 *
 * @example
 * ```javascript
 * POST /api/users/unsubscribe
 * {
 *   "hash": "abc123def456...",
 *   "topic": "election_updates"
 * }
 *
 * // Success response
 * {
 *   "success": true
 * }
 * ```
 */
router
  .route('/unsubscribe')
  .post(validate(schemas.unsubscribe), async (req, res) => {
    const { hash, topic } = req.body;

    try {
      await Controller.unsubscribe.confirm(hash, topic, User);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

/**
 * DELETE /api/users/delete/:userId
 * Deletes user account
 *
 * This endpoint permanently deletes a user account and all associated
 * data. This action is irreversible and should be used with caution.
 *
 * The deletion process:
 * 1. Moves user record to ExUser collection (prevents username reuse)
 * 2. Preserves profile data for FEC compliance and audit purposes
 * 3. Clears authentication tokens and sessions
 *
 * Note: Celebrations and donation history are preserved for FEC compliance.
 *
 * @route DELETE /api/users/delete/:userId
 * @param {string} userId - User ID to delete
 * @returns {Object} Account deletion result
 * @returns {boolean} result.success - Whether deletion was successful
 * @throws {401} Unauthorized
 * @throws {403} Not authorized to delete this user
 * @throws {404} User not found
 *
 * @example
 * ```javascript
 * DELETE /api/users/delete/507f1f77bcf86cd799439011
 *
 * // Success response
 * {
 *   "success": true,
 *   "message": "Account deleted successfully"
 * }
 * ```
 */
router
  .route('/delete/:userId')
  .delete(
    csrfTokenValidator(),
    tokenizer.guard(),
    guardOwnership(),
    async (req, res) => {
      res.json(await Controller.remove(req, res, User, ExUser));
    }
  );

/**
 * POST /api/users/login
 * Authenticates user and creates session
 *
 * This endpoint handles user authentication using username and password.
 * Upon successful authentication, it creates a session and returns
 * user data along with access and refresh tokens.
 *
 * The authentication process:
 * 1. Validates username and password
 * 2. Creates JWT access and refresh tokens
 * 3. Sets refresh token in HTTP-only cookie
 * 4. Returns user data and access token
 *
 * @param {string} req.body.username - Username for login
 * @param {string} req.body.password - Password for login
 * @returns {Object} User data and access token
 *
 * @example
 * ```javascript
 * POST /api/users/login
 * {
 *   "username": "john_doe",
 *   "password": "securepassword123"
 * }
 *
 * // Success response
 * {
 *   "id": "507f1f77bcf86cd799439011",
 *   "username": "john_doe",
 *   "email": "john@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "compliance": "compliant",
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "settings": {
 *     "emailReceipts": true,
 *     "showToolTips": true,
 *     "autoTweet": false
 *   }
 * }
 * ```
 */
router.route('/login').post(loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user and validate password
    const user = await User.findOne({ username: username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user account has been rate-limited
    const rattled = await Controller.rattle('username', username, User);
    if (rattled) {
      return res.status(401).json({ error: 'Account rate limited' });
    }

    // Create JWT tokens
    tokenizer.subject = user._id.toString();
    const accessToken = await tokenizer.createAccessToken();
    const refreshToken = await tokenizer.createRefreshToken({
      user: { _id: user._id, tokenVersion: user.tokenVersion },
    });
    // await
    tokenizer.saveRefreshToken(refreshToken);

    // Determine if cookies should be secure based on environment

    const isCookieSecure = process.env.NODE_ENV === 'production',
      cookieName =
        (isCookieSecure ? '__Secure-' : '') + process.env.COOKIE_NAME;

    // Set refresh token cookie
    res.cookie(cookieName, refreshToken, {
      expires: new Date(Date.now() + SERVER.REFRESH_EXPY * 1000),
      domain: process.env.COOKIE_DOMAIN,
      secure: isCookieSecure,
      sameSite: 'strict',
      httpOnly: true,
      path: '/',
    });

    // Return user data and access token
    const userDoc = user._doc;
    res.json({
      // Return user data with access token for frontend
      id: userDoc._id,
      zip: userDoc.zip ?? '',
      city: userDoc.city ?? '',
      payment: userDoc.payment ?? {
        payment_method: '',
        customer_id: '',
      },
      email: userDoc.email ?? '', // ?? userDoc.username,
      state: userDoc.state ?? '',
      username: userDoc.username,
      settings: userDoc.settings ?? {
        unsubscribedFrom: [],
        emailReceipts: true,
        showToolTips: true,
        autoTweet: false,
      },
      accessToken: accessToken,
      ocd_id: userDoc.ocd_id ?? '',
      address: userDoc.address ?? '',
      country: userDoc.country ?? '',
      isEmployed: userDoc.isEmployed,
      employer: userDoc.employer ?? '',
      lastName: userDoc.lastName ?? '',
      passport: userDoc.passport ?? '',
      firstName: userDoc.firstName ?? '',
      occupation: userDoc.occupation ?? '',
      phoneNumber: userDoc.phoneNumber ?? '',
      compliance: userDoc.compliance ?? 'guest',
      understands: userDoc.understands ?? false,
      tipLimitReached: userDoc.tipLimitReached ?? false,
    });
  } catch (error) {
    const logger = require('../../services/utils/logger')(__filename);

    logger.error('Failed to login with test credentials', {
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
      message: error.message,
    });
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/users/logout
 * Logs out user and clears session
 *
 * This endpoint terminates the user's session by clearing the
 * refresh token cookie and destroying the server-side session.
 * All authentication tokens are invalidated, requiring re-authentication
 * for subsequent requests.
 *
 * @route GET /api/users/logout
 * @returns {boolean} Logout success status (always true)
 * @throws {401} Unauthorized (if not authenticated)
 *
 * @example
 * ```javascript
 * GET /api/users/logout
 *
 * // Response
 * true
 * ```
 */

router
  .route('/logout')
  .get(csrfTokenValidator(), tokenizer.guard(), (req, res, next) => {
    // Clear refresh token cookie
    clearRefreshCookie(res);
    // Clear CSRF token cookie
    clearCSRFCookie(res);

    res.json(true);
  });

module.exports = router;
