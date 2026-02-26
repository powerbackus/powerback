/**
 * @fileoverview User Management Controller Module
 *
 * This module serves as the main entry point for all user-related operations
 * including account management, password operations, FEC compliance validation,
 * and user privileges. It consolidates functionality from account and password
 * sub-modules into a unified interface.
 *
 * KEY FUNCTION CATEGORIES
 *
 * ACCOUNT MANAGEMENT
 * - create: Creates new user accounts
 * - update: Updates user account information
 * - remove: Deletes user accounts
 * - contact: Retrieves user contact information
 * - activate: Activates user accounts via email verification
 *
 * PASSWORD OPERATIONS
 * - change: Changes user passwords
 * - reset: Resets user passwords via email link
 * - forgot: Initiates password reset process
 * - validate: Validates password reset attempts
 * - increment: Increments password attempt counters
 * - invalidate: Invalidates password reset hashes
 *
 * FEC COMPLIANCE
 * - deem: Retrieves user's compliance tier
 * - promote: Promotes user to higher compliance tier
 * - reckon: Validates donation compliance with FEC limits
 *
 * USER PRIVILEGES
 * - certify: Checks if user has donation privileges
 * - empower: Grants donation privileges to user
 * - attest: Attests to user field values
 *
 * ACCOUNT STATUS
 * - lock: Locks user accounts
 * - open: Unlocks user accounts
 * - rattle: Checks account lock status
 *
 * UTILITIES
 * - generate: Generates secure hashes
 * - confirm: Confirms hash validity
 * - verify: Verifies field values
 * - prune: Removes sensitive data
 * - transfer: Transfers applicant to user
 *
 * UNSUBSCRIBE MANAGEMENT
 * - unsubscribe: Email unsubscribe management
 *
 * DEPENDENCIES
 * - ./account: Account management functions
 * - ./password: Password management functions
 *
 * @module controller/users
 * @requires ./account
 * @requires ./password
 */
// tw: I enjoy two things: brevity and thesauruses.

const {
    activate,
    generate,
    transfer,
    certify,
    confirm,
    contact,
    empower,
    promote,
    reckon,
    attest,
    create,
    rattle,
    remove,
    update,
    verify,
    prune,
    deem,
    lock,
    open,
    unsubscribe,
  } = require('./account'),
  {
    reset,
    change,
    forgot,
    validate,
    increment,
    invalidate,
  } = require('./password');

/**
 * User management controller exports
 *
 * @exports {Object} User management functions
 * @property {Function} invalidate - Invalidate password tokens
 * @property {Function} increment - Increment password attempt counters
 * @property {Function} activate - Activate user accounts
 * @property {Function} generate - Generate user-related data or tokens
 * @property {Function} transfer - Transfer user data or permissions
 * @property {Function} validate - Validate password operations
 * @property {Function} certify - Certify user eligibility
 * @property {Function} confirm - Confirm user operations
 * @property {Function} contact - Handle user contact information
 * @property {Function} empower - Empower users with additional permissions
 * @property {Function} promote - Promote users to higher compliance tiers
 * @property {Function} reckon - Reckon FEC compliance for donation amounts
 * @property {Function} attest - Attest to user information
 * @property {Function} change - Change user passwords
 * @property {Function} create - Create new users
 * @property {Function} forgot - Handle forgotten password requests
 * @property {Function} rattle - Rattle user data (utility function)
 * @property {Function} remove - Remove user data
 * @property {Function} update - Update user information
 * @property {Function} verify - Verify user information
 * @property {Function} prune - Prune user data
 * @property {Function} reset - Reset user passwords
 * @property {Function} deem - Deem user compliance status
 * @property {Function} lock - Lock user accounts
 * @property {Function} open - Open/unlock user accounts
 * @property {Object} unsubscribe - Unsubscribe management functions
 */
module.exports = {
  invalidate,
  increment,
  activate,
  generate,
  transfer,
  validate,
  certify,
  confirm,
  contact,
  empower,
  promote,
  reckon,
  attest,
  change,
  create,
  forgot,
  rattle,
  remove,
  update,
  verify,
  prune,
  reset,
  deem,
  lock,
  open,
  unsubscribe,
};
