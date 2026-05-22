/**
 * @fileoverview Inbound ?share= visit recording (once per session per code).
 * @module utils/app/recordShareLinkVisit
 *
 * Wired from App.tsx on mount: visit API first, then stripShareQueryFromUrl.
 * pb:refShareCode is set only after successful visit response.
 */

import API from '@API';
import { storage } from '../storage/storage';
import { setStoredRefShareCode } from '../storage/refShareCodeStorage';
import { trackGoogleAnalyticsEvent } from '../analytics/analytics';

/** Session flag for rally_page_seen entry=share (no publicCode in GA). */
const INBOUND_FLAG = 'rallyShareInbound';

/**
 * Parse share public code from current location query.
 *
 * @param search - location.search; defaults to window.location.search
 * @returns publicCode or null if absent/invalid pattern
 */
export function getShareCodeFromLocation(
  search = typeof window !== 'undefined' ? window.location.search : ''
): string | null {
  const code = new URLSearchParams(search).get('share');
  if (!code || !/^[A-Za-z0-9_-]{10,24}$/.test(code)) {
    return null;
  }
  return code;
}

/**
 * Session dedupe key after a successful visit API for this code.
 *
 * @param publicCode - Inbound referral code
 * @returns Logical key (prefixed pb:shareVisit:… in storage)
 */
function visitRecordedKey(publicCode: string): string {
  return `shareVisit:${publicCode}`;
}

/**
 * Record share link visit via API once per session; fire GA without identifiers.
 *
 * Non-blocking: failures do not throw to App bootstrap.
 */
export async function recordShareLinkVisitFromQuery(): Promise<void> {
  const publicCode = getShareCodeFromLocation();
  if (!publicCode) {
    return;
  }

  if (storage.session.getItem(visitRecordedKey(publicCode))) {
    return;
  }

  try {
    await API.recordShareLinkVisit(publicCode);
    storage.session.setItem(visitRecordedKey(publicCode), '1');
    storage.session.setItem(INBOUND_FLAG, 'true');
    setStoredRefShareCode(publicCode);
    trackGoogleAnalyticsEvent('share_link_visited', {
      has_share_param: true,
      entry: 'share_link',
    });
  } catch {
    // Visit API failed: no pb:refShareCode; strip still runs in App.tsx
  }
}

/**
 * Whether user arrived via share link this session (for Rally analytics entry).
 *
 * @returns true after successful visit API in this tab session
 */
export function hasShareInboundThisSession(): boolean {
  return storage.session.getItem(INBOUND_FLAG) === 'true';
}

/**
 * Remove share query param from URL without reload (after visit handling).
 */
export function stripShareQueryFromUrl(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const url = new URL(window.location.href);
  if (!url.searchParams.has('share')) {
    return;
  }
  url.searchParams.delete('share');
  const next = url.pathname + (url.search ? url.search : '') + url.hash;
  window.history.replaceState(window.history.state, '', next);
}
