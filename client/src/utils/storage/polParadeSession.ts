/**
 * One shuffled pol carousel order per browser tab (Rally backdrop + Lobby).
 * @module utils/storage/polParadeSession
 */
import type { HouseMember, PolsOnParade } from '@Interfaces';
import { shuffle } from '../ids/shuffle';
import { storage } from './storage';

const SESSION_ORDER_KEY = 'polParadeOrder';

let memoryParade: PolsOnParade | null = null;

function readOrderIds(): string[] | null {
  const raw = storage.session.getItem(SESSION_ORDER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function writeOrderIds(ids: string[]): void {
  storage.session.setItem(SESSION_ORDER_KEY, JSON.stringify(ids));
}

/**
 * Reorders API pols to a saved id list; appends any new members not in the list.
 *
 * @param members - Fresh pol roster from API
 * @param orderedIds - Previously shuffled ids for this tab session
 * @returns Members in parade order
 */
function orderHouseMembers(
  members: HouseMember[],
  orderedIds: string[]
): HouseMember[] {
  const byId = new Map(members.map((pol) => [pol.id, pol]));
  const ordered: HouseMember[] = [];

  for (const id of orderedIds) {
    const pol = byId.get(id);
    if (pol) {
      ordered.push(pol);
      byId.delete(id);
    }
  }

  for (const pol of byId.values()) {
    ordered.push(pol);
  }

  return ordered;
}

/**
 * Returns the tab-session parade if already built (e.g. after Rally fetch).
 *
 * @returns Cached parade or null
 */
export function getSessionPolParade(): PolsOnParade | null {
  return memoryParade;
}

/**
 * Builds or reuses the session pol parade order (shuffle once per tab).
 *
 * @param members - Full house roster from API
 * @returns Parade with houseMembers and applied set to the same ordered list
 */
export function buildSessionPolParade(members: HouseMember[]): PolsOnParade {
  if (!members.length) {
    memoryParade = { houseMembers: [], applied: [] };
    return memoryParade;
  }

  if (memoryParade) {
    return memoryParade;
  }

  const savedIds = readOrderIds();
  let ordered: HouseMember[];

  if (savedIds?.length) {
    ordered = orderHouseMembers(members, savedIds);
    if (ordered.length !== members.length) {
      ordered = shuffle([...members]);
      writeOrderIds(ordered.map((pol) => pol.id));
    }
  } else {
    ordered = shuffle([...members]);
    writeOrderIds(ordered.map((pol) => pol.id));
  }

  memoryParade = {
    houseMembers: ordered,
    applied: ordered,
  };
  return memoryParade;
}
