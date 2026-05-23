/**
 * Builds Rally manual-share suggested message by platform and public URL.
 * @module pages/Rally/fn/buildSuggestedShareMessage
 */

import type { RallySharePlatform } from '@CONSTANTS';
import {
  RALLY_BLUESKY_HANDLE,
  RALLY_X_HANDLE,
} from '../../../constants/rallySocial';

/**
 * Public URL for share copy: anonymous link when present, else site home.
 *
 * @param siteUrl - Fallback home URL (origin or SHARED_DOMAIN)
 * @param storedPublicShareUrl - Optional anonymous share URL from localStorage
 * @returns Public URL only; never includes claim codes
 */
export function resolveRallyShareUrl(
  siteUrl: string,
  storedPublicShareUrl?: string | null
): string {
  if (storedPublicShareUrl?.trim()) {
    return storedPublicShareUrl.trim();
  }
  return siteUrl;
}

/**
 * Platform-specific suggested post text (short; includes link; no claim codes).
 *
 * Reddit omits handles to avoid spammy tone; generic omits handles by design.
 *
 * @param platform - Target platform for tone/handle
 * @param link - Public share URL only (no PII)
 * @returns Single-line message suitable for clipboard or Web Share API
 */
export function buildSuggestedShareMessage(
  platform: RallySharePlatform,
  link: string
): string {
  const core =
    'POWERBACK is a campaign-finance protest tool. Make public support visible before money enters the picture.';

  switch (platform) {
    case 'x':
      return `${core} ${RALLY_X_HANDLE} ${link}`;
    case 'bluesky': {
      const handle = RALLY_BLUESKY_HANDLE.trim();
      return handle ? `${core} ${handle} ${link}` : `${core} ${link}`;
    }
    case 'reddit':
      return `${core} Worth a look if you care about how Congress earns support: ${link}`;
    case 'linkedin':
      return `${core} Learn how conditional public support works before donations: ${link}`;
    case 'facebook':
      return `${core} Share if this idea matters to you: ${link}`;
    case 'generic':
    default:
      return `${core} ${link}`;
  }
}
