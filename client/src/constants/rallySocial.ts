/**
 * Rally share platform handles and URLs (no PII; used for suggested message copy only).
 * @module constants/rallySocial
 */

/** Share platform for Rally suggested-message copy (not OAuth). */
export type RallySharePlatform =
  | 'generic'
  | 'x'
  | 'bluesky'
  | 'reddit'
  | 'linkedin'
  | 'facebook';

/** Platform options for the Rally manual-share selector (copy-only; no posting integration). */
export const RALLY_SHARE_PLATFORMS: {
  id: RallySharePlatform;
  label: string;
}[] = [
  { id: 'generic', label: 'Generic' },
  { id: 'x', label: 'X / Twitter' },
  { id: 'bluesky', label: 'Bluesky' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
];

/** X handle appended to suggested copy when platform is X. */
export const RALLY_X_HANDLE =
  process.env.REACT_APP_TWITTER_HANDLE || '@PowerbackApp';

/**
 * Bluesky handle when configured; omit from copy when empty.
 * Set REACT_APP_BLUESKY_HANDLE in env when available.
 */
export const RALLY_BLUESKY_HANDLE = process.env.REACT_APP_BLUESKY_HANDLE || '';
