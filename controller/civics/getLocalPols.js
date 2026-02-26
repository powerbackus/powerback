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
 * - Format: "ocd-division/country:us/state:XX/cd:YY"
 * - Example: "ocd-division/country:us/state:ny/cd:14"
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
 * - process.env.GOOGLE_CIVICS_DISTRICT_PATTERN: Regex pattern for district matching
 *
 * @module controller/civics/getLocalPols
 * @requires superagent
 * @requires ../../services/utils/logger
 */

const superagent = require('superagent');
const logger = require('../../services/utils/logger')(__filename);

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
 * // Returns: 'ocd-division/country:us/state:ny/cd:14'
 * ```
 */
async function getLocalPols(address) {
  // Matches congressional district OCD IDs (e.g. ocd-division/country:us/state:ny/cd:19)
  const CONGRESSIONAL_DISTRICT_PATTERN = new RegExp(
    process.env.GOOGLE_CIVICS_DISTRICT_PATTERN
  );

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
      const ocd_id = Object.keys(json.divisions).find((k) => {
        return CONGRESSIONAL_DISTRICT_PATTERN.test(k);
      });

      return ocd_id;
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
    const ocd_id = Object.keys(retryJson.divisions).find((k) => {
      return CONGRESSIONAL_DISTRICT_PATTERN.test(k);
    });

    return ocd_id;
  } catch (err) {
    logger.error('Failed to get local pols:', err);
    return undefined;
  }
}

module.exports = { getLocalPols };
