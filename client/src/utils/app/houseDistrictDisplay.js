/**
 * User-facing House district labels. Internal storage uses `00` for voting
 * at-large; the UI shows At-Large instead of District 00.
 * @module utils/app/houseDistrictDisplay
 */

const NON_VOTING_HOUSE_JURISDICTIONS = new Set([
  'DC',
  'PR',
  'GU',
  'VI',
  'AS',
  'MP',
]);

/**
 * One voting House seat for the whole state (at-large). Keep in sync with
 * `SINGLE_HOUSE_AT_LARGE_STATES` in `services/utils/normalizeHouseDistrict.js`.
 */
const SINGLE_SEAT_AT_LARGE_STATES = new Set([
  'AK',
  'DE',
  'ND',
  'SD',
  'VT',
  'WY',
]);

/** Label used in PolData / Constituency when district is at-large (voting). */
const HOUSE_AT_LARGE_LABEL = 'At-Large';

/**
 * @param {string|undefined|null} district
 * @param {string|undefined|null} state - Two-letter state; avoids treating delegate `0` as at-large.
 * @returns {string} Display district, or empty when unknown
 */
function formatHouseDistrictForDisplay(district, state) {
  const d = String(district ?? '').trim();
  const st = String(state ?? '').toUpperCase();

  if (
    !d &&
    st &&
    SINGLE_SEAT_AT_LARGE_STATES.has(st) &&
    !NON_VOTING_HOUSE_JURISDICTIONS.has(st)
  ) {
    return HOUSE_AT_LARGE_LABEL;
  }

  if (!d) return '';

  if (d === '00') {
    return HOUSE_AT_LARGE_LABEL;
  }

  if (d === '0' && st && !NON_VOTING_HOUSE_JURISDICTIONS.has(st)) {
    return HOUSE_AT_LARGE_LABEL;
  }

  const lower = d.toLowerCase().replace(/[-\s]+/g, ' ');
  if (lower === 'at large' || lower === 'atlarge') {
    return HOUSE_AT_LARGE_LABEL;
  }

  return d;
}

/**
 * @param {string|undefined|null} district
 * @param {string|undefined|null} state
 * @returns {boolean}
 */
function isHouseDistrictAtLargeDisplay(district, state) {
  return (
    formatHouseDistrictForDisplay(district, state) === HOUSE_AT_LARGE_LABEL
  );
}

module.exports = {
  formatHouseDistrictForDisplay,
  isHouseDistrictAtLargeDisplay,
  HOUSE_AT_LARGE_LABEL,
};
