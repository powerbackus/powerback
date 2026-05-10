/**
 * @fileoverview House district normalization for FEC, OCD IDs, and DB storage.
 *
 * Convention (voting U.S. House):
 * - Ordinary districts: two-digit strings 01–53 (matches OpenFEC padding).
 * - At-large voting states: internal storage `00`; `ocd_id` is **state only**:
 *   `ocd-division/country:us/state:xx` (no `/cd:` segment; state is the division tail).
 * - Numeric `0` in a non-voting jurisdiction (e.g. DC delegate) stays `0`, not
 *   `00`, so at-large voting members are not conflated with delegates; whole-area
 *   delegate OCD also uses the state-only form (no `cd`).
 * - Textual at-large in a territory: `resolveHouseDistrictForPolRole` maps to
 *   `0` before other rules; `normalizeHouseDistrictKeyPart` does the same when
 *   state is known. At-large text with no state returns '' (do not assume `00`).
 *
 * @module services/utils/normalizeHouseDistrict
 */

/** Canonical internal storage for a voting at-large House district. */
const HOUSE_AT_LARGE_STORAGE = '00';

const NON_VOTING_HOUSE_JURISDICTIONS = new Set([
  'DC',
  'PR',
  'GU',
  'VI',
  'AS',
  'MP',
]);

/**
 * States with exactly one voting House seat (entire state is one district).
 * Update when reapportionment adds or removes multi-district states.
 */
const SINGLE_HOUSE_AT_LARGE_STATES = new Set([
  'AK',
  'DE',
  'ND',
  'SD',
  'VT',
  'WY',
]);

/**
 * True for territories whose House delegation is non-voting in Congress.
 * @param {string|undefined|null} state
 * @returns {boolean}
 */
function isNonVotingHouseJurisdiction(state) {
  return NON_VOTING_HOUSE_JURISDICTIONS.has(String(state || '').toUpperCase());
}

/**
 * True when Congress.gov / FEC uses a textual at-large label (voting or delegate).
 * Handles Unicode dashes, extra words (e.g. Congressional District (At Large)), NFKC.
 * @param {string} s
 * @returns {boolean}
 */
function isAtLargeTextDistrict(s) {
  const raw = String(s || '').trim();
  if (!raw) return false;
  const norm = raw
    .normalize('NFKC')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .toLowerCase();
  const spaced = norm.replace(/[-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\bat[\s-]*large\b/.test(spaced)) return true;
  const compact = spaced.replace(/\s/g, '');
  return compact === 'atlarge';
}

/**
 * Full Open Civic Data division id for a U.S. House role.
 * At-large (internal `00`) and whole-area delegate `0` use state-only ids (no `cd`).
 * Numbered districts use `.../cd:NN` (two-digit when single-digit).
 *
 * @param {string} stateUpper - Two-letter state
 * @param {string} districtNormalized - `00`, `01`–`53`, or territory `0`/`98`/etc.
 * @returns {string}
 */
function buildHouseRoleOcdId(stateUpper, districtNormalized) {
  const st = String(stateUpper || '')
    .trim()
    .toLowerCase();
  if (!st) return '';
  const base = `ocd-division/country:us/state:${st}`;
  const d = String(districtNormalized || '');
  if (!d) return '';

  if (d === HOUSE_AT_LARGE_STORAGE) {
    return base;
  }
  if (d === '0' && isNonVotingHouseJurisdiction(stateUpper)) {
    return base;
  }
  if (!/^\d+$/.test(d)) {
    return '';
  }
  const cdSeg = d.length === 1 ? d.padStart(2, '0') : d;
  return `${base}/cd:${cdSeg}`;
}

/**
 * Canonical district string for comparisons and storage.
 * Aligns Pol (e.g. "4") with OpenFEC (e.g. "04"). At-large labels and numeric 0
 * map to `00` except in non-voting jurisdictions, where lone `0` stays `0`.
 *
 * @param {string|number|null|undefined} district
 * @param {string} [stateUpper] - When district is numeric 0, disambiguates delegate vs at-large.
 * @returns {string}
 */
function normalizeHouseDistrictKeyPart(district, stateUpper) {
  if (district == null || district === '') return '';
  const s = String(district).trim();
  const state = String(stateUpper || '').toUpperCase();

  if (isAtLargeTextDistrict(s)) {
    if (state && isNonVotingHouseJurisdiction(state)) {
      return '0';
    }
    if (!state) {
      return '';
    }
    return HOUSE_AT_LARGE_STORAGE;
  }

  if (!/^\d+$/.test(s)) return s;

  const n = Number.parseInt(s, 10);
  if (n === 0) {
    if (state && isNonVotingHouseJurisdiction(state)) {
      return '0';
    }
    return HOUSE_AT_LARGE_STORAGE;
  }

  return String(n).padStart(2, '0');
}

/**
 * Resolves Congress.gov `term.district` + state into Pol `roles[].district` and
 * `roles[].ocd_id` (full division string; never `cd:undefined`).
 *
 * @param {string|number|null|undefined} rawDistrict
 * @param {string} stateCode - term.stateCode from Congress.gov
 * @returns {{ district: string, ocd_id: string } | null} null if district cannot be resolved
 */
function resolveHouseDistrictForPolRole(rawDistrict, stateCode) {
  const state = String(stateCode || '').toUpperCase();
  if (!state) return null;

  if (isNonVotingHouseJurisdiction(state)) {
    const raw = rawDistrict == null ? '' : String(rawDistrict).trim();
    if (isAtLargeTextDistrict(raw)) {
      return {
        district: '0',
        ocd_id: buildHouseRoleOcdId(state, '0'),
      };
    }

    let normalized = normalizeHouseDistrictKeyPart(rawDistrict, state);
    if (
      normalized === '' &&
      rawDistrict != null &&
      String(rawDistrict).trim() !== ''
    ) {
      const digits = String(rawDistrict).match(/(\d+)/);
      if (digits) {
        normalized = normalizeHouseDistrictKeyPart(digits[1], state);
      }
    }
    if (normalized === '' || !/^\d+$/.test(normalized)) {
      normalized = '0';
    }
    return {
      district: normalized,
      ocd_id: buildHouseRoleOcdId(state, normalized),
    };
  }

  let normalized = normalizeHouseDistrictKeyPart(rawDistrict, state);

  if (
    normalized === '' &&
    SINGLE_HOUSE_AT_LARGE_STATES.has(state) &&
    !isNonVotingHouseJurisdiction(state)
  ) {
    const raw = rawDistrict == null ? '' : String(rawDistrict).trim();
    if (raw === '' || isAtLargeTextDistrict(raw)) {
      normalized = HOUSE_AT_LARGE_STORAGE;
    }
  }

  if (normalized === '') {
    return null;
  }

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  return {
    district: normalized,
    ocd_id: buildHouseRoleOcdId(state, normalized),
  };
}

module.exports = {
  HOUSE_AT_LARGE_STORAGE,
  normalizeHouseDistrictKeyPart,
  resolveHouseDistrictForPolRole,
  buildHouseRoleOcdId,
  isNonVotingHouseJurisdiction,
  SINGLE_HOUSE_AT_LARGE_STATES,
};
