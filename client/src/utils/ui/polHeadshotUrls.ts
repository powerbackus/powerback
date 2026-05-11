/**
 * Central URL builders for Pol headshots: bundled webp under public/pfp and
 * Congress Clerk JPG fallback (same sources as carousel Headshot).
 * @module utils/ui/polHeadshotUrls
 */

import { BACKUP_IMG } from '@CONSTANTS';

/**
 * Relative path to the locally bundled webp headshot (CRA public folder).
 */
export function polHeadshotLocalWebpSrc(bioguideId: string): string {
  return `../pfp/${bioguideId}.webp`;
}

/**
 * Official House clerk image URL for a bioguide ID (JPG).
 */
export function polHeadshotCongressJpgSrc(bioguideId: string): string {
  return `${BACKUP_IMG}${bioguideId}.jpg`;
}
