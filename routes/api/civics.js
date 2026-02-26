/**
 * @fileoverview Civics API routes for civic data and address validation
 *
 * This module provides endpoints for civic data operations, primarily focused on
 * address validation and congressional district lookup. It enables users to
 * find their local representatives based on their address.
 *
 * TABLE OF CONTENTS - API ENDPOINTS
 *
 * ADDRESS & DISTRICT LOOKUP
 * └── PUT    /api/civics/                           - Validate address and get congressional district
 *
 * KEY FEATURES
 * - Address validation and geocoding
 * - Congressional district lookup
 * - Local politician identification
 *
 * @module routes/api/civics
 * @requires express
 * @requires ../../validation
 * @requires ../../controller/civics
 */

const router = require('express').Router(),
  Controller = require('../../controller/civics'),
  { validate } = require('../../validation'),
  schemas = require('../../validation');

/**
 * PUT /api/civics
 * Validates an address and returns congressional district information
 *
 * This endpoint takes a user's address and returns the corresponding
 * congressional district information, including the Open Civic Data ID (ocd_id)
 * that can be used to identify local representatives.
 *
 * The address validation process:
 * 1. Validates the address format
 * 2. Geocodes the address to determine location
 * 3. Maps the location to congressional district boundaries
 * 4. Returns the district identifier and representative information
 *
 * @param {Object} req.body - Address validation request
 * @param {string} req.body.address - The address to validate and lookup
 * @returns {Object} Congressional district information or error response
 *
 * @example
 * ```javascript
 * PUT /api/civics
 * {
 *   "address": "123 Main St, New York, NY 10001"
 * }
 *
 * // Success response
 * {
 *   "ocd_id": "ocd-division/country:us/state:ny/cd:14",
 *   "district": "14",
 *   "state": "NY",
 *   "representative": {
 *     "name": "Alexandria Ocasio-Cortez",
 *     "party": "D"
 *   }
 * }
 *
 * // Error response
 * {
 *   "error": "District not found"
 * }
 * ```
 */

// All routes prefixed with '/api/civics'
router.route('/').put(validate(schemas.address), async (req, res) => {
  // Extract address from request body
  const { address } = req.body;

  // Validate that address was provided
  if (!address) return res.status(400).json({ error: 'Missing address' });

  // Look up congressional district information for the address
  const ocd_id = await Controller.getLocalPols(address);

  // Return error if district not found
  if (!ocd_id)
    return res.status(404).json({ error: 'District not found' });

  // Return district information
  res.json(ocd_id);
});

module.exports = router;
