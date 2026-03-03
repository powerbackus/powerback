/**
 * @fileoverview Password Management Controller Module
 *
 * This module provides password management functionality including password changes,
 * password reset flows, validation, and attempt tracking. It handles the complete
 * password lifecycle from creation to reset to change operations.
 *
 * KEY FUNCTIONS
 *
 * PASSWORD OPERATIONS
 * - change: Changes user password (requires current password)
 * - reset: Resets password via email link
 * - forgot: Initiates password reset process
 *
 * VALIDATION & TRACKING
 * - validate: Validates password reset attempts
 * - increment: Increments password attempt counters
 * - invalidate: Invalidates password reset hashes
 *
 * BUSINESS LOGIC
 *
 * PASSWORD RESET FLOW
 * 1. User requests reset → forgot() generates hash and sends email
 * 2. User clicks link → validate() verifies hash and username
 * 3. User sets new password → reset() updates password and invalidates tokens
 *
 * PASSWORD CHANGE FLOW
 * 1. User provides current password → change() verifies and updates
 * 2. All tokens invalidated → New tokens created
 * 3. Confirmation email sent
 *
 * ATTEMPT TRACKING
 * - Tracks failed password attempts
 * - Locks account after too many failed attempts
 * - Resets counter on successful password change/reset
 *
 * DEPENDENCIES
 * - ./utils: Password validation and tracking utilities
 * - ./change: Password change operations
 * - ./forgot: Password reset initiation
 * - ./reset: Password reset completion
 *
 * @module controller/users/password
 * @requires ./utils
 * @requires ./change
 * @requires ./forgot
 * @requires ./reset
 */

const { validate, increment, invalidate } = require('./utils'),
  { change } = require('./change'),
  { forgot } = require('./forgot'),
  { reset } = require('./reset');

module.exports = {
  invalidate,
  increment,
  validate,
  change,
  forgot,
  reset,
};
