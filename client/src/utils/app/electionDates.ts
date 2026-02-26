/**
 * Shared election dates fetch and cache. Single source for bundled + server dates.
 * @module utils/app/electionDates
 */

import { getCachedElectionDates, setCachedElectionDates } from './localStorage';
import API from '@API';

/** Cached/API result shape: state map plus metadata */
export interface ElectionDatesResult {
  timestamp?: string | null;
  data: Record<
    string,
    {
      primary: string;
      general: string;
      runoff?: string | null;
      special?: string | null;
    }
  >;
  source?: string;
  success?: boolean;
}

/** Bundled snapshot shape (public asset) */
interface BundledSnapshot {
  dates: ElectionDatesResult['data'];
  lastUpdated: string;
}

/**
 * Loads the bundled election dates snapshot from public assets.
 * Does not require auth. Used as fallback when API fails or for preload.
 */
export async function loadBundledElectionDates(): Promise<BundledSnapshot | null> {
  try {
    const res = await fetch(
      `${process.env.PUBLIC_URL || ''}/assets/electionDates.snapshot.json`
    );
    if (!res.ok) throw new Error('failed-to-load-bundled-elections');
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches election dates with 24-hour cache. Prefers server snapshot if newer than bundled.
 * Safe for guests: on API failure (e.g. 401), falls back to bundled and caches that.
 * Call on app init (preload) and after login so ElectionCycleContext and Auth share one source.
 *
 * @returns Cached or freshly fetched result; result.data is keyed by state
 */
export async function fetchAndCacheElectionDates(): Promise<ElectionDatesResult> {
  const cached = getCachedElectionDates();
  if (cached) {
    return cached as ElectionDatesResult;
  }

  try {
    const bundled = await loadBundledElectionDates();
    const { data } = await API.getElectionDates();

    const bundledTs = bundled ? new Date(bundled.lastUpdated).getTime() : 0;
    const serverTs = new Date(data.timestamp).getTime();

    let result: ElectionDatesResult;
    if (serverTs > bundledTs) {
      result = data as ElectionDatesResult;
    } else if (bundled) {
      result = {
        timestamp: bundled.lastUpdated,
        data: bundled.dates,
        source: 'bundled',
        success: true,
      };
    } else {
      result = data as ElectionDatesResult;
    }

    setCachedElectionDates(result);
    return result;
  } catch {
    const bundled = await loadBundledElectionDates();
    let result: ElectionDatesResult;
    if (bundled) {
      result = {
        timestamp: bundled.lastUpdated,
        data: bundled.dates,
        source: 'bundled',
        success: true,
      };
    } else {
      result = {
        success: false,
        data: {},
        source: 'none',
        timestamp: null,
      };
    }
    setCachedElectionDates(result);
    return result;
  }
}
