/**
 * Rally share platform handles (no PII; used for suggested message copy only).
 * @module constants/rallySocial
 */

/** Share platform for Rally suggested-message copy (not OAuth). */
export type RallySharePlatform =
  | 'generic'
  | 'x'
  | 'bluesky'
  | 'mastodon'
  | 'truth_social';

/** Platform options for the Rally manual-share selector (copy-only; no posting integration). */
export const RALLY_SHARE_PLATFORMS: {
  id: RallySharePlatform;
  label: string;
}[] = [
  { id: 'generic', label: 'Generic post' },
  { id: 'x', label: 'X / Twitter' },
  { id: 'bluesky', label: 'Bluesky' },
  { id: 'mastodon', label: 'Mastodon' },
  { id: 'truth_social', label: 'Truth Social' },
];

/** X handle appended to suggested copy when platform is X. */
export const RALLY_X_HANDLE =
  process.env.REACT_APP_TWITTER_HANDLE || '@PowerbackApp';

/** Bluesky handle appended to suggested copy when platform is Bluesky. */
export const RALLY_BLUESKY_HANDLE =
  process.env.REACT_APP_BLUESKY_HANDLE || '@powerbackus.bsky.social';

/** Mastodon handle appended to suggested copy when platform is Mastodon. */
export const RALLY_MASTODON_HANDLE =
  process.env.REACT_APP_MASTODON_HANDLE || '@powerback@mastodon.social';

/** Truth Social handle appended to suggested copy when platform is Truth Social. */
export const RALLY_TRUTH_SOCIAL_HANDLE =
  process.env.REACT_APP_TRUTH_SOCIAL_HANDLE || '@powerbackapp';
