/**
 * @fileoverview Resolve directory for served `{bioguide}.webp` headshots.
 *
 * Shared by `scripts/pfp-sync.js` and image-error reporting so paths stay aligned.
 *
 * @module services/utils/pfpOutDir
 */

const path = require('path');

/**
 * Order: `PFP_SYNC_OUT_DIR`, else `STATIC_PUBLIC_DIR/pfp`, else repo `client/public/pfp`.
 *
 * @returns {string}
 */
function getResolvedPfpOutDir() {
  if (process.env.PFP_SYNC_OUT_DIR) {
    return path.resolve(process.env.PFP_SYNC_OUT_DIR);
  }
  if (process.env.STATIC_PUBLIC_DIR) {
    return path.resolve(process.env.STATIC_PUBLIC_DIR, 'pfp');
  }
  return path.resolve(__dirname, '../../client/public/pfp');
}

module.exports = { getResolvedPfpOutDir };
