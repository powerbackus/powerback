/**
 * @fileoverview House district normalization for FEC and DB alignment.
 * @module services/utils/normalizeHouseDistrict
 */

/**
 * Canonical district string for comparisons and storage when district is numeric.
 * Aligns Pol (e.g. "4") with OpenFEC (e.g. "04"). Non-numeric values pass through trimmed.
 *
 * @param {string|number|null|undefined} district
 * @returns {string}
 */
function normalizeHouseDistrictKeyPart(district) {
  if (district == null || district === '') return '';
  const s = String(district).trim();
  if (!/^\d+$/.test(s)) return s;
  return String(Number.parseInt(s, 10)).padStart(2, '0');
}

module.exports = { normalizeHouseDistrictKeyPart };
