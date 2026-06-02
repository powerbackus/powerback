/**
 * Builds Rally manual-share suggested message by platform and public URL.
 * @module pages/Rally/fn/buildSuggestedShareMessage
 */

import { RALLY_COPY, type RallySharePlatform } from '@CONSTANTS';
import {
  RALLY_BLUESKY_HANDLE,
  RALLY_MASTODON_HANDLE,
  RALLY_TRUTH_SOCIAL_HANDLE,
  RALLY_X_HANDLE,
} from '../../../constants/rallySocial';

const GENERIC_POST = RALLY_COPY.MANUAL_SHARE.suggestedMessage;

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
 * @param platform - Target platform for tone/handle
 * @param link - Public share URL only (no PII)
 * @returns Single-line message suitable for clipboard or Web Share API
 */
export function buildSuggestedShareMessage(
  platform: RallySharePlatform,
  link: string
): string {
  switch (platform) {
    case 'x':
      return `${GENERIC_POST} ${RALLY_X_HANDLE} ${link}`;
    case 'bluesky':
      return `${GENERIC_POST} ${RALLY_BLUESKY_HANDLE.trim()} ${link}`;
    case 'mastodon':
      return `${GENERIC_POST} ${RALLY_MASTODON_HANDLE.trim()} ${link}`;
    case 'truth_social':
      return `${GENERIC_POST} ${RALLY_TRUTH_SOCIAL_HANDLE.trim()} ${link}`;
    case 'generic':
    default:
      return `${GENERIC_POST} ${link}`;
  }
}
