/**
 * @fileoverview Local Politician Lookup Controller
 *
 * This controller handles looking up congressional district information for
 * a given address using the Google Civics API. It returns the Open Civic Data
 * ID (ocd_id) that can be used to identify local representatives and their
 * congressional districts.
 *
 * BUSINESS LOGIC
 *
 * ADDRESS VALIDATION PROCESS
 * 1. Sends address to Google Civics API for geocoding
 * 2. Extracts congressional district from API response
 * 3. Returns ocd_id matching congressional district pattern
 * 4. Falls back to city/state lookup if full address fails
 *
 * OCD_ID PATTERN
 * - Numbered district: "ocd-division/country:us/state:XX/cd:YY" (e.g. NY cd:14)
 * - At-large: "ocd-division/country:us/state:xx" (no cd segment; state is the division tail)
 * - Used to identify user's congressional district
 *
 * RETRY LOGIC
 * - If full address fails but has normalized components, retries with city/state
 * - Returns 'prompt-requery' if address needs more information
 * - Handles API errors gracefully
 *
 * DEPENDENCIES
 * - superagent: HTTP client for Google Civics API
 * - services/utils/logger: Logging
 * - process.env.GOOGLE_CIVICS_API_ENDPOINT: API endpoint URL
 * - process.env.GOOGLE_CIVICS_API_KEY: API key
 * - process.env.GOOGLE_CIVICS_DISTRICT_PATTERN: Optional legacy regex; used only if
 *   automatic picking finds no division. State-only matches require an at-large state
 *   (same set as internal district `00`). Tight example: `^ocd-division/country:us/state:[a-z]{2}(/cd:[0-9]{1,2})?$`
 *
 * @module controller/civics/getLocalPols
 * @requires superagent
 * @requires ../../services/utils/logger
 */

const superagent = require('superagent');
const logger = require('../../services/utils/logger')(__filename);
const {
  SINGLE_HOUSE_AT_LARGE_STATES,
} = require('../../services/utils/normalizeHouseDistrict');

/**
 * @param {string} key - Civics division id
 * @returns {string|null} Two-letter state if `.../state:xx` with no further path
 */
function stateCodeFromStateOnlyOcd(key) {
  const m = String(key).match(/^ocd-division\/country:us\/state:([a-z]{2})$/i);
  return m ? m[1].toUpperCase() : null;
}

/**
 * True for state-only ids (no `/cd:`), i.e. at-large shape.
 * @param {string} key
 * @returns {boolean}
 */
function isStateOnlyHouseOcd(key) {
  return /^ocd-division\/country:us\/state:[a-z]{2}$/i.test(String(key));
}

/**
 * Picks the U.S. House congressional division OCD id from Google Civics `divisions` keys.
 * Numbered districts use `.../state:xx/cd:NN`. At-large states use `.../state:xx` only
 * (no `cd`); if Civics only returns `.../cd:0` or `cd:00`, normalizes to state-only
 * to match POWERBACK Pol `ocd_id` storage.
 *
 * @param {string[]} divisionKeys - `Object.keys(response.divisions)`
 * @returns {string|undefined} Lowercased division id, or undefined
 */
function pickHouseCongressionalDivisionId(divisionKeys) {
  if (!divisionKeys?.length) return undefined;
  const keys = [...divisionKeys];

  const cdKeys = keys.filter((k) =>
    /^ocd-division\/country:us\/state:[a-z]{2}\/cd:\d+$/i.test(k)
  );
  const substantiveCd = cdKeys.filter(
    (k) => !/\/cd:0$/i.test(k) && !/\/cd:00$/i.test(k)
  );

  let chosen;
  if (substantiveCd.length > 0) {
    chosen = substantiveCd[0];
  } else if (cdKeys.length > 0) {
    const m = cdKeys[0].match(
      /^(ocd-division\/country:us\/state:[a-z]{2})\/cd:/i
    );
    chosen = m ? m[1] : cdKeys[0];
  } else {
    const stateOnly = keys.filter((k) =>
      /^ocd-division\/country:us\/state:[a-z]{2}$/i.test(k)
    );
    if (stateOnly.length === 1) {
      const st = stateCodeFromStateOnlyOcd(stateOnly[0]);
      // State-only House divisions match internal at-large (`00`); reject for multi-CD states.
      if (st && SINGLE_HOUSE_AT_LARGE_STATES.has(st)) {
        chosen = stateOnly[0];
      }
    }
  }

  if (chosen) {
    return chosen.toLowerCase();
  }

  if (process.env.GOOGLE_CIVICS_DISTRICT_PATTERN) {
    try {
      const re = new RegExp(process.env.GOOGLE_CIVICS_DISTRICT_PATTERN, 'i');
      const fromEnv = keys.find((k) => re.test(k));
      if (!fromEnv) return undefined;
      if (isStateOnlyHouseOcd(fromEnv)) {
        const st = stateCodeFromStateOnlyOcd(fromEnv);
        if (!st || !SINGLE_HOUSE_AT_LARGE_STATES.has(st)) {
          return undefined;
        }
      }
      return fromEnv.toLowerCase();
    } catch (err) {
      logger.warn('Invalid GOOGLE_CIVICS_DISTRICT_PATTERN', {
        message: err.message,
      });
    }
  }

  return undefined;
}

/**
 * Gets congressional district information for an address
 *
 * This function uses the Google Civics API to geocode an address and determine
 * the congressional district. Returns the Open Civic Data ID (ocd_id) that
 * identifies the district.
 *
 * @param {string} address - The address to look up
 * @returns {Promise<string|undefined>} OCD ID for congressional district or undefined if not found
 * @returns {string} 'prompt-requery' if address needs more information
 *
 * @example
 * ```javascript
 * const { getLocalPols } = require('./controller/civics/getLocalPols');
 * const ocd_id = await getLocalPols('123 Main St, New York, NY 10001');
 * // Returns: 'ocd-division/country:us/state:ny/cd:14' or state-only for at-large (e.g. AK)
 * ```
 */
async function getLocalPols(address) {
  const baseURI = process.env.GOOGLE_CIVICS_API_ENDPOINT,
    encodedAddress = encodeURIComponent(address),
    CIVICS_API_KEY = process.env.GOOGLE_CIVICS_API_KEY,
    queryURI = `${baseURI}?address=${encodedAddress}&levels=country&key=${CIVICS_API_KEY}`;

  try {
    const response = await superagent
      .get(queryURI)
      .set({ Accept: 'application/json' });
    const json = JSON.parse(response.text);

    if (json.divisions) {
      return pickHouseCongressionalDivisionId(Object.keys(json.divisions));
    }

    const { normalizedInput } = json;
    if (
      normalizedInput.line1?.length &&
      (!normalizedInput.city?.length ||
        !normalizedInput.state?.length ||
        !normalizedInput.zip?.length)
    ) {
      return 'prompt-requery';
    }

    const retryAddress = `${normalizedInput.city} ${normalizedInput.state}`;
    const retryURI = `${baseURI}?address=${encodeURIComponent(
      retryAddress
    )}&levels=country&roles=legislatorLowerBody&key=${CIVICS_API_KEY}`;

    const retryResponse = await superagent
      .get(retryURI)
      .set({ Accept: 'application/json' });
    const retryJson = JSON.parse(retryResponse.text);
    return retryJson.divisions
      ? pickHouseCongressionalDivisionId(Object.keys(retryJson.divisions))
      : undefined;
  } catch (err) {
    logger.error('Failed to get local pols:', err);
    return undefined;
  }
}

module.exports = { getLocalPols };
