import { APP } from '@CONSTANTS';

export const clearLocalMap = () => {
  // Preserve DonorId when clearing other values after successful payment
  const donorId = localStorage.getItem('pb:donorId');

  APP.STORE.forEach((k) => localStorage.removeItem('pb:' + k));

  // Restore DonorId if it was preserved
  if (donorId) {
    localStorage.setItem('pb:donorId', donorId);
  }

  // Also clear election dates cache
  localStorage.removeItem('pb:electionDates');
};

export const storeMapLocally = (payload) =>
  APP.STORE.forEach((k, n) => {
    // Only update values that are explicitly provided in the payload
    // This prevents overwriting existing values with undefined
    if (n < payload.length && payload[n] !== undefined) {
      localStorage.setItem('pb:' + k, payload[n]);
    }
  });

export const removeLocal = (key) => localStorage.removeItem(key);

export const retrieveLocal = (key) => localStorage.getItem(key);

export const storeLocally = (key, value) =>
  localStorage.setItem(key, value);

/**
 * Cache utility for election dates with TTL support
 * Follows client storage policy: uses pb: prefix, JSON encoding, and try/catch
 */
export const getCachedElectionDates = () => {
  try {
    const cached = localStorage.getItem('pb:electionDates');
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const cacheAge = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (cacheAge > maxAge) {
      localStorage.removeItem('pb:electionDates');
      return null;
    }

    return data;
  } catch {
    // Clear corrupted cache
    localStorage.removeItem('pb:electionDates');
    return null;
  }
};

export const setCachedElectionDates = (data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem('pb:electionDates', JSON.stringify(cacheEntry));
  } catch {
    // Ignore storage errors - fallback to no caching
  }
};
