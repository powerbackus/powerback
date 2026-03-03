/**
 * Hash generation utility module
 *
 * This module generates secure cryptographic hashes for various account operations
 * such as account activation, password resets, and unsubscribe links. Hashes are
 * time-limited with different expiration periods based on their use case.
 *
 * Hash types and their expiration periods:
 * - 'join': 5 minutes (account activation)
 * - 'unsubscribe': 30 days (email unsubscribe)
 * - default: 24 hours (password reset)
 *
 * @module controller/users/account/utils/hash/generate
 * @exports {Object} Hash generation functions
 */

const { nanoid } = require('nanoid');
const logger = require('../../../../../services/utils/logger')(__filename);

module.exports = {
  /**
   * Generates a secure hash with expiration date
   *
   * This function creates a cryptographically secure hash using SHA-256 and nanoid
   * for uniqueness. The hash includes an issue date and expiration time based on
   * the hash type. Different hash types have different expiration periods.
   *
   * @param {string} type - The type of hash ('join', 'unsubscribe', or default)
   * @returns {Promise<Object>} - Hash object with hash, issueDate, and expires
   * @returns {string} hashObj.hash - The generated hash string
   * @returns {number} hashObj.issueDate - Timestamp when hash was created
   * @returns {number} hashObj.expires - Timestamp when hash expires
   *
   * @example
   * ```javascript
   * const { generate } = require('./controller/users/account/utils/hash/generate');
   * const hashObj = await generate('join');
   * // Returns: { hash: 'abc123...', issueDate: 1234567890, expires: 1234568190 }
   * ```
   */
  generate: async (type) => {
    const HASHING_DATE = Date.now();
    const { createHash } = await import('crypto');
    const hash = createHash('sha256');

    let HASH;

    try {
      hash.on('readable', () => {
        const data = hash.read();
        if (data) {
          HASH = data.toString('hex').substring(18, 36);
          // e.g. 6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50
        }
      });

      // Write the data as a Buffer, not a string
      hash.write(
        Buffer.from((HASHING_DATE + '.' + nanoid()).toString('hex'))
      );
      hash.end();
    } catch (err) {
      logger.error('Error generating hash', err);
      throw err;
    }

    let ttl = 86400000; // 24h default
    if (type === 'join') ttl = 300000; // 5m
    if (type === 'unsubscribe') ttl = 2592000000; // 30d

    const hashObj = {
      hash: HASH,
      issueDate: HASHING_DATE,
      expires: HASHING_DATE + ttl,
    };
    logger.debug('Generated hash object', hashObj);
    return hashObj;
  },
};
