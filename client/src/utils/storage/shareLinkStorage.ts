/**
 * @fileoverview localStorage helpers for outbound Rally share links (pb:shareLink).
 * @module utils/storage/shareLinkStorage
 *
 * Stores the link this visitor generated for others — not inbound pb:refShareCode.
 * Set only after explicit POST /api/share-links from Rally generate click.
 */

import { storage } from './storage';

/** Logical key; persisted as pb:shareLink via storage utility. */
const SHARE_LINK_KEY = 'shareLink';

/**
 * Outbound share link persisted after successful generate.
 */
export type StoredShareLink = {
  publicCode: string;
  claimCode: string;
  shareUrl: string;
};

/**
 * Read stored outbound share link from localStorage.
 *
 * @returns Parsed link or null if missing/invalid (corrupt entries are removed)
 */
export function getStoredShareLink(): StoredShareLink | null {
  const raw = storage.local.getItem(SHARE_LINK_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StoredShareLink;
    if (
      typeof parsed.publicCode === 'string' &&
      typeof parsed.claimCode === 'string' &&
      typeof parsed.shareUrl === 'string'
    ) {
      return parsed;
    }
  } catch {
    storage.local.removeItem(SHARE_LINK_KEY);
  }
  return null;
}

/**
 * Persist outbound share link after explicit generate on Rally.
 *
 * @param data - API create response fields
 */
export function setStoredShareLink(data: StoredShareLink): void {
  storage.local.setItem(SHARE_LINK_KEY, JSON.stringify(data));
}
