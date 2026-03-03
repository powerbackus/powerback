/**
 * @fileoverview Account Utilities Module
 *
 * This module provides utility functions for account management operations
 * including hashing, activation, transfer operations, FEC compliance validation,
 * and account status management. It serves as a collection of utility functions
 * used by the account controller and routes.
 *
 * KEY FUNCTION CATEGORIES
 *
 * ACCOUNT ACTIVATION
 * - activate: Activates user accounts via email hash verification
 * - transfer: Transfers applicants to active user accounts
 * - generate: Generates secure hashes for activation links
 * - confirm: Confirms activation hashes
 *
 * ACCOUNT STATUS
 * - lock: Locks user accounts for security
 * - open: Unlocks user accounts
 * - rattle: Checks if account is locked
 *
 * DATA MANAGEMENT
 * - verify: Verifies field values exist in database
 * - prune: Removes sensitive fields from user documents
 * - attest: Attests to user field-value combinations
 *
 * FEC COMPLIANCE
 * - reckon: FEC compliance validation (see ./reckon for details)
 *
 * UNSUBSCRIBE MANAGEMENT
 * - unsubscribe: Email unsubscribe management (see ./unsubscribe for details)
 *
 * DEPENDENCIES
 * - ./hash: Hash generation and confirmation
 * - ./activate: Account activation
 * - ./transfer: Applicant to user transfer
 * - ./attest: Field attestation
 * - ./rattle: Account lock checking
 * - ./reckon: FEC compliance validation
 * - ./verify: Field verification
 * - ./prune: Data pruning
 * - ./lock: Account locking
 * - ./open: Account unlocking
 * - ./unsubscribe: Unsubscribe management
 *
 * @module controller/users/account/utils
 * @requires ./unsubscribe
 * @requires ./hash
 * @requires ./activate
 * @requires ./transfer
 * @requires ./attest
 * @requires ./rattle
 * @requires ./reckon
 * @requires ./verify
 * @requires ./prune
 * @requires ./lock
 * @requires ./open
 */
const { unsubscribe } = require('./unsubscribe'),
  { confirm, generate } = require('./hash'),
  { activate } = require('./activate'),
  { transfer } = require('./transfer'),
  { attest } = require('./attest'),
  { rattle } = require('./rattle'),
  { reckon } = require('./reckon'),
  { verify } = require('./verify'),
  { prune } = require('./prune'),
  { lock } = require('./lock'),
  { open } = require('./open');

/**
 * Account utilities exports
 *
 * @exports {Object} Utility functions
 * @property {Function} activate - Activate account-related operations
 * @property {Function} generate - Generate account-related data or tokens
 * @property {Function} transfer - Transfer account data or permissions
 * @property {Function} confirm - Confirm account operations
 * @property {Function} attest - Attest to account information
 * @property {Function} rattle - Rattle account data (utility function)
 * @property {Function} verify - Verify account information
 * @property {Function} prune - Prune account data
 * @property {Function} lock - Lock account operations
 * @property {Function} open - Open/unlock account operations
 * @property {Function} reckon - Reckon FEC compliance for donation amounts
 * @property {Function} unsubscribe - Unsubscribe management
 */
module.exports = {
  activate,
  generate,
  transfer,
  confirm,
  attest,
  rattle,
  reckon,
  verify,
  prune,
  lock,
  open,
  unsubscribe,
};
