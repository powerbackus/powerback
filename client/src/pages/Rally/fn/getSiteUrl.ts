/**
 * Public site home URL for Rally share copy (browser origin in dev, env domain otherwise).
 * @module pages/Rally/fn/getSiteUrl
 */

import { SHARED_DOMAIN } from '@CONSTANTS';

/**
 * Home URL for suggested share messages when no anonymous link is stored.
 *
 * Uses `window.location.origin` in the browser so localhost/dev URLs copy correctly;
 * falls back to SHARED_DOMAIN for non-browser contexts.
 *
 * @returns Trailing-slash site URL
 */
export function getRallySiteUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`;
  }
  return `https://${SHARED_DOMAIN}/`;
}
