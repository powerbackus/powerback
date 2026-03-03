/**
 * Demo mode: guest-only funnel, no login/account, no payment step.
 * Enabled when served from demo.powerback.us (prod) or demo.localhost (local).
 *
 * In demo: tours off; auth/credentials/Account UI off; no payment/DB/emails;
 * only localStorage write is pb:demoDonations (cumulative mock donations for EscrowDisplay).
 * Server validators, CSRF, and auth gates remain on for all routes.
 *
 * @module demoMode
 */

const DEMO_HOSTNAMES = ['demo.powerback.us', 'demo.localhost'];

export const isDemoMode =
  typeof window !== 'undefined' &&
  DEMO_HOSTNAMES.includes(window.location.hostname);

/**
 * React hook to access demo mode state.
 * Prefer this over direct import in React components/hooks for cleaner imports.
 *
 * @returns {boolean} True if app is running in demo mode
 */
export const useIsDemoMode = (): boolean => isDemoMode;

const DEMO_DONATIONS_KEY = 'pb:demoDonations';

export interface DemoDonationEntry {
  polName: string;
  pol_id: string;
  amount: number;
  date: number;
}

/** Aggregated by pol_id for EscrowDisplay: { pol_id, donation (sum), count } */
export interface DemoDonationByPol {
  donation: number;
  pol_id: string;
  count: number;
}

export function getDemoDonationsRaw(): DemoDonationEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEMO_DONATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoDonationEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendDemoDonation(entry: DemoDonationEntry): void {
  const list = getDemoDonationsRaw();
  list.push(entry);
  try {
    localStorage.setItem(DEMO_DONATIONS_KEY, JSON.stringify(list));
  } catch {
    // ignore quota or other errors
  }
}

/** Aggregate raw entries by pol_id for use as PolDonations[] in EscrowDisplay. */
export function getDemoDonationsByPol(): DemoDonationByPol[] {
  const raw = getDemoDonationsRaw();
  const byPol = new Map<string, { donation: number; count: number }>();
  for (const e of raw) {
    const cur = byPol.get(e.pol_id) ?? { donation: 0, count: 0 };
    cur.donation += e.amount;
    cur.count += 1;
    byPol.set(e.pol_id, cur);
  }
  return Array.from(byPol.entries()).map(([pol_id, { donation, count }]) => ({
    donation,
    pol_id,
    count,
  }));
}
