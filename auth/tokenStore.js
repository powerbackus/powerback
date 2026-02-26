const logger = require('../services/utils/logger')(__filename);
/**
 * In-memory token store for refresh tokens
 * Maps token strings to expiration timestamps
 * @type {Map<string, number>}
 */
const store = new Map(); // token → expiresAt (timestamp in ms)

/**
 * Saves a refresh token with expiration time
 * @param {string} token - The refresh token to store
 * @param {number} [ttl=1555200] - Time to live in seconds (default: 18 days)
 */
function saveRefreshToken(token, ttl = 1555200) {
  const expiresAt = Date.now() + ttl * 1000;
  store.set(token, expiresAt);
}

/**
 * Checks if a refresh token is valid and removes it from store
 * Refresh tokens are single-use, so they are always deleted after validation
 * @param {string} token - The refresh token to validate
 * @returns {boolean} True if token is valid and not expired, false otherwise
 */
function findAndRemoveRefreshToken(token) {
  const expiresAt = store.get(token);

  if (!expiresAt) {
    return false;
  }

  const isExpired = Date.now() > expiresAt;
  store.delete(token); // Always delete (single-use logic)

  return !isExpired;
}

/**
 * Periodic cleanup task to remove expired tokens from memory
 * Runs every hour to prevent memory bloat
 */
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [token, exp] of store.entries()) {
      if (now > exp) {
        store.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Token store cleanup completed', { cleanedCount });
    }
  }, 60 * 60 * 1000); // Run hourly
}

module.exports = {
  saveRefreshToken,
  findAndRemoveRefreshToken,
};
