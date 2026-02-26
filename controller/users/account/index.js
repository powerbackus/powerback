/**
 * @fileoverview Account Management Controller Module
 *
 * This module provides account-related functionality including user management,
 * FEC compliance validation, donation limit calculations, account activation,
 * and user privileges. It serves as the main entry point for account-related
 * operations in the user controller system.
 *
 * KEY FUNCTION CATEGORIES
 *
 * ACCOUNT LIFECYCLE
 * - create: Creates new user accounts
 * - activate: Activates accounts via email verification
 * - update: Updates user account information
 * - remove: Deletes user accounts
 * - contact: Retrieves user contact information
 *
 * ACCOUNT STATUS
 * - lock: Locks user accounts
 * - open: Unlocks user accounts
 * - rattle: Checks account lock status
 *
 * FEC COMPLIANCE
 * - deem: Retrieves user's compliance tier
 * - promote: Promotes user to higher compliance tier
 * - reckon: Validates donation compliance with FEC limits
 *
 * USER PRIVILEGES
 * - certify: Checks if user has donation privileges
 * - empower: Grants donation privileges
 * - attest: Attests to user field values
 *
 * UTILITIES
 * - generate: Generates secure hashes
 * - confirm: Confirms hash validity
 * - verify: Verifies field values
 * - prune: Removes sensitive data
 * - transfer: Transfers applicant to user
 * - unsubscribe: Email unsubscribe management
 *
 * DEPENDENCIES
 * - ./utils: Account utility functions
 * - ./create: Account creation
 * - ./remove: Account removal
 * - ./update: Account updates
 * - ./contact: Contact information
 * - ./privileges: Privilege management
 *
 * @module controller/users/account
 * @requires ./utils
 * @requires ./create
 * @requires ./remove
 * @requires ./update
 * @requires ./contact
 * @requires ./privileges
 */
const {
    lock,
    open,
    prune,
    attest,
    rattle,
    reckon,
    verify,
    confirm,
    activate,
    generate,
    transfer,
    unsubscribe,
  } = require('./utils'),
  { create } = require('./create'),
  { remove } = require('./remove'),
  { update } = require('./update'),
  { contact } = require('./contact'),
  { deem, certify, empower, promote } = require('./privileges');

/**
 * Account management controller exports
 *
 * @exports {Object} Account management functions
 * @property {Function} reckon - Reckon FEC compliance for donation amounts
 * @property {Function} transfer - Transfer account data or permissions
 * @property {Function} generate - Generate account-related data or tokens
 * @property {Function} activate - Activate user accounts
 * @property {Function} confirm - Confirm account operations
 * @property {Function} contact - Handle contact information operations
 * @property {Function} certify - Certify user eligibility
 * @property {Function} empower - Empower users with additional permissions
 * @property {Function} promote - Promote users to higher compliance tiers
 * @property {Function} attest - Attest to account information
 * @property {Function} create - Create new accounts
 * @property {Function} rattle - Rattle account data (utility function)
 * @property {Function} remove - Remove account data
 * @property {Function} update - Update account information
 * @property {Function} verify - Verify account information
 * @property {Function} prune - Prune account data
 * @property {Function} lock - Lock user accounts
 * @property {Function} open - Open/unlock user accounts
 * @property {Function} deem - Deem user compliance status
 * @property {Object} unsubscribe - Unsubscribe management functions
 */
module.exports = {
  activate,
  generate,
  transfer,
  confirm,
  contact,
  certify,
  empower,
  promote,
  attest,
  create,
  rattle,
  reckon,
  remove,
  update,
  verify,
  prune,
  lock,
  open,
  deem,
  unsubscribe,
};
