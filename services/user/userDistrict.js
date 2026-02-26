/**
 * @fileoverview User Congressional District Update Service
 *
 * This service looks up a user's congressional district and representative
 * using the Google Civics API based on their home address. It updates the
 * user document with district information, representative details, and
 * division ID (OCD ID) for future lookups.
 *
 * KEY FEATURES
 *
 * GOOGLE CIVICS API INTEGRATION
 * - Calls Google Civics API with user's address
 * - Retrieves congressional district information
 * - Extracts representative details
 *
 * DISTRICT EXTRACTION
 * - Extracts division ID (OCD ID) from API response
 * - Parses district number from division ID
 * - Format: "ocd-division/country:us/state:XX/cd:YY"
 *
 * REPRESENTATIVE INFORMATION
 * - Extracts representative name, party, phones, URLs
 * - Stores in user.address.representative field
 * - Used for user display and contact information
 *
 * BUSINESS LOGIC
 *
 * API CALL
 * - Sends address to Google Civics API
 * - Retrieves offices and officials arrays
 * - Finds House office entry
 *
 * DISTRICT MAPPING
 * - Maps office officialIndices to officials array
 * - Extracts first representative (primary)
 * - Parses district number from division ID
 *
 * DATABASE UPDATE
 * - Updates user.address.district (district number)
 * - Updates user.address.divisionId (OCD ID)
 * - Updates user.address.representative (representative info)
 *
 * DEPENDENCIES
 * - axios: HTTP client for Google Civics API
 * - models/User: User model
 * - constants/API: API configuration
 * - services/utils/logger: Logging
 * - process.env.GOOGLE_CIVICS_API_ENDPOINT: API endpoint URL
 *
 * @module services/user/userDistrict
 * @requires axios
 * @requires ../../models/User
 * @requires ../../constants
 * @requires ../utils/logger
 */

const axios = require('axios');
const User = require('../../models/User');
const { API } = require('../../constants');
const logger = require('../utils/logger')(__filename);

const CIVICS_URL = process.env.GOOGLE_CIVICS_API_ENDPOINT;
// not working? try this address! -> 'https://www.googleapis.com/civicinfo/v2/representatives';
async function updateUserDistrict(userId, address) {
  try {
    // call Google Civics API
    const resp = await axios.get(CIVICS_URL, {
      params: {
        address,
        key: API.GOOGLE_CIVICS_KEY,
      },
    });

    const offices = resp.data.offices || [];
    const officials = resp.data.officials || [];

    // find House office entry
    const houseOffice = offices.find(
      (o) =>
        o.name.includes('United States House') ||
        o.divisionId.includes('cd:')
    );

    if (!houseOffice) {
      throw new Error('No House office found for address');
    }

    // map indices to officials
    const repIndex = houseOffice.officialIndices[0];
    const representative = officials[repIndex];

    // extract division ID for district (e.g. "ocd-division/country:us/state:tx/cd:05")
    const division = houseOffice.divisionId;
    const cdMatch = division.match(/cd:(\d+)/);
    const districtNumber = cdMatch ? parseInt(cdMatch[1], 10) : null;

    // prepare update object
    const update = {
      'address.district': districtNumber,
      'address.divisionId': division,
      'address.representative': {
        name: representative.name,
        party: representative.party || null,
        phones: representative.phones || [],
        urls: representative.urls || [],
      },
    };

    // persist to DB
    await User.findByIdAndUpdate(userId, { $set: update });
    logger.info(`Updated user ${userId} district to ${division}`);

    return { district: districtNumber, representative };
  } catch (err) {
    logger.error(
      `Failed to update district for user ${userId}`,
      err.message
    );
    throw err;
  }
}

module.exports = { updateUserDistrict };
