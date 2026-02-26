/**
 * @fileoverview User Data Pruning Utility
 *
 * This utility function removes sensitive and internal properties from a user
 * object to create a safe profile object suitable for form state management.
 * It's used as an initialization function for account profile form reducers
 * to format userData to match contactInfo object structure.
 *
 * REMOVED FIELDS
 *
 * IDENTIFIERS
 * - id: User ID
 * - _id: MongoDB document ID
 * - __v: MongoDB version key
 *
 * SECURITY & AUTHENTICATION
 * - password: Password hash (never exposed)
 * - tokenVersion: Token version for invalidation
 * - resetPasswordHash: Password reset hash
 * - resetPasswordHashExpires: Reset hash expiration
 * - resetPasswordHashIssueDate: Reset hash issue date
 * - tryPasswordAttempts: Password attempt counter
 * - lastTimeUpdatedPassword: Last password update timestamp
 * - locked: Account lock status
 *
 * INTERNAL DATA
 * - username: Username (not part of contact info)
 * - createdAt: Account creation date
 * - updatedAt: Last update date
 * - donations: User donations array
 * - payment: Payment information
 * - settings: User settings
 * - understands: Terms understanding flag
 * - compliance: Compliance tier (handled separately)
 *
 * BUSINESS LOGIC
 *
 * DATA SANITIZATION
 * - Removes all sensitive authentication data
 * - Removes internal metadata and timestamps
 * - Removes non-contact information
 * - Returns only contact-relevant fields
 *
 * FALLBACK HANDLING
 * - Returns INIT.userData if no user provided
 * - Ensures form always has valid initial state
 * - Prevents undefined errors in form reducers
 *
 * USAGE
 * Used by useContactInfo hook to initialize form state from user data,
 * ensuring only safe, contact-relevant fields are included in form state.
 *
 * DEPENDENCIES
 * - @CONSTANTS: INIT constant for fallback user data
 *
 * @module hooks/fn/prune
 * @requires @CONSTANTS
 */

import { INIT } from '@CONSTANTS';
const prune = (user) => {
  if (!user) {
    return INIT.userData;
  }
  const {
    id,
    _id,
    __v,
    locked,
    payment,
    password,
    settings,
    username,
    createdAt,
    donations,
    updatedAt,
    compliance,
    understands,
    tokenVersion,
    resetPasswordHash,
    tryPasswordAttempts,
    lastTimeUpdatedPassword,
    resetPasswordHashExpires,
    resetPasswordHashIssueDate,
    ...pruned
  } = user;
  return pruned;
};

export default prune;
