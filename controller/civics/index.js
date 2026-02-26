/**
 * @fileoverview Civics Controller Module
 *
 * This module provides civic data operations, primarily focused on address
 * validation and congressional district lookup. It enables users to find their
 * local representatives based on their address using the Google Civics API.
 *
 * KEY FUNCTIONS
 *
 * getLocalPols(address)
 * - Validates address and returns congressional district information
 * - Uses Google Civics API for geocoding and district lookup
 * - Returns Open Civic Data ID (ocd_id) for district identification
 *
 * BUSINESS LOGIC
 *
 * ADDRESS VALIDATION
 * - Geocodes address using Google Civics API
 * - Extracts congressional district from API response
 * - Falls back to city/state lookup if full address fails
 * - Returns ocd_id for district identification
 *
 * OCD_ID FORMAT
 * - Format: "ocd-division/country:us/state:XX/cd:YY"
 * - Used to identify user's congressional district
 * - Links to local representatives
 *
 * DEPENDENCIES
 * - ./getLocalPols: Address validation and district lookup
 * - superagent: HTTP client for Google Civics API
 * - process.env.GOOGLE_CIVICS_API_ENDPOINT: API endpoint
 * - process.env.GOOGLE_CIVICS_API_KEY: API key
 *
 * @module controller/civics
 * @requires ./getLocalPols
 * @requires superagent
 */

const { getLocalPols } = require('./getLocalPols');

module.exports = { getLocalPols };
