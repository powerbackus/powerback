/**
 * @fileoverview Email Unsubscribe Management Module
 *
 * This module provides functions for managing user email subscription preferences,
 * including hash generation, verification, and topic unsubscription. It handles
 * the complete unsubscribe flow from hash generation in emails to confirmation
 * of unsubscribe requests.
 *
 * KEY FUNCTIONS
 *
 * getOrInitiate(hash, model)
 * - Gets existing valid unsubscribe hash or generates new one
 * - Ensures hash has at least 24 hours validity before reuse
 * - Generates new hash with 30-day expiration if needed
 *
 * verify(hash, model)
 * - Verifies unsubscribe hash validity and expiration
 * - Returns user information if hash is valid
 * - Used before processing unsubscribe requests
 *
 * confirm(hash, topic, model)
 * - Confirms unsubscribe from specific email topic
 * - Adds topic to user's unsubscribedFrom array
 * - Clears unsubscribe hash fields after confirmation
 *
 * BUSINESS LOGIC
 *
 * UNSUBSCRIBE HASH LIFECYCLE
 * - Generated when user needs unsubscribe link (30-day expiration)
 * - Reused if existing hash has >24 hours remaining
 * - Verified when user clicks unsubscribe link
 * - Cleared after successful unsubscribe confirmation
 *
 * TOPIC-BASED UNSUBSCRIBE
 * - Users can unsubscribe from specific topics
 * - Topics stored in settings.unsubscribedFrom array
 * - Multiple topics can be unsubscribed independently
 * - Topics: 'election_updates', 'celebration_updates', 'account_updates'
 *
 * DEPENDENCIES
 * - ./getOrInitiate: Hash generation and retrieval
 * - ./verify: Hash verification
 * - ./confirm: Unsubscribe confirmation
 * - ../hash/generate: Hash generation utility
 *
 * @module controller/users/account/utils/unsubscribe
 * @requires ./getOrInitiate
 * @requires ./verify
 * @requires ./confirm
 * @requires ../hash/generate
 */

const { getOrInitiate } = require('./getOrInitiate'),
  { verify } = require('./verify'),
  { confirm } = require('./confirm');

/**
 * Unsubscribe management exports
 *
 * @exports {Object} Unsubscribe management functions
 * @property {Function} getOrInitiate - Get existing valid hash or generate new one
 * @property {Function} verify - Verify unsubscribe hash validity
 * @property {Function} confirm - Confirm unsubscribe from topic
 */
module.exports = {
  unsubscribe: {
    getOrInitiate,
    verify,
    confirm,
  },
};

