/**
 * @fileoverview Inbound share referral code (pb:refShareCode), separate from pb:shareLink.
 * @module utils/storage/refShareCodeStorage
 *
 * Holds the publicCode that brought this visitor to POWERBACK.
 * Set only after successful GET visit API; sent on signup POST; cleared after activation.
 */

import { storage } from './storage';

/** Logical key; persisted as pb:refShareCode via storage utility. */
const REF_SHARE_KEY = 'refShareCode';

/** 30-day TTL per specs/rally-page.md and client storage policy. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Inbound referral payload in localStorage.
 */
export type StoredRefShareCode = {
  publicCode: string;
  storedAt: number;
};

const PUBLIC_CODE_PATTERN = /^[A-Za-z0-9_-]{10,24}$/;

/**
 * @param raw - JSON string from localStorage
 * @returns Parsed entry or null if shape invalid
 */
function parseStored(raw: string): StoredRefShareCode | null {
  try {
    const parsed = JSON.parse(raw) as StoredRefShareCode;
    if (
      typeof parsed.publicCode === 'string' &&
      PUBLIC_CODE_PATTERN.test(parsed.publicCode) &&
      typeof parsed.storedAt === 'number'
    ) {
      return parsed;
    }
  } catch {
    // Corrupt entry
  }
  return null;
}

/**
 * Read inbound referral publicCode for signup body.
 *
 * @returns publicCode or null if missing, invalid, or past TTL (stale entries removed)
 */
export function getStoredRefShareCode(): string | null {
  const raw = storage.local.getItem(REF_SHARE_KEY);
  if (!raw) {
    return null;
  }
  const parsed = parseStored(raw);
  if (!parsed) {
    storage.local.removeItem(REF_SHARE_KEY);
    return null;
  }
  if (Date.now() - parsed.storedAt > TTL_MS) {
    storage.local.removeItem(REF_SHARE_KEY);
    return null;
  }
  return parsed.publicCode;
}

/**
 * Persist inbound referral after successful visit API (not on failed visit).
 *
 * @param publicCode - Validated inbound code from ?share= (no claimCode)
 */
export function setStoredRefShareCode(publicCode: string): void {
  if (!PUBLIC_CODE_PATTERN.test(publicCode)) {
    return;
  }
  const entry: StoredRefShareCode = {
    publicCode,
    storedAt: Date.now(),
  };
  storage.local.setItem(REF_SHARE_KEY, JSON.stringify(entry));
}

/**
 * Remove inbound referral after successful activation attribution.
 */
export function clearStoredRefShareCode(): void {
  storage.local.removeItem(REF_SHARE_KEY);
}
