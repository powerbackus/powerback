/**
 * @fileoverview Congress API routes for congressional data and election information
 *
 * This module provides endpoints for accessing congressional data, including
 * politician information, election dates, and campaign cycle management.
 * It serves as the primary interface for all congressional data operations
 * in the POWERBACK.us application.
 *
 * TABLE OF CONTENTS - API ENDPOINTS
 *
 * CONGRESSIONAL DATA
 * ├── GET    /api/congress/                         - Get all politicians/congressional members
 * ├── GET    /api/congress/members/:pol             - Get specific politician information
 * └── GET    /api/congress/election-dates           - Get election dates with fallback support
 *
 * KEY FEATURES
 * - Politician data retrieval and management
 * - Election date information from snapshots
 * - Campaign cycle calculations
 * - Statutory election date fallbacks
 *
 * ELECTION DATE MANAGEMENT
 * - Primary source: election dates snapshot file
 * - Fallback: statutory general election date calculation
 * - State-specific election date filtering
 * - Year validation and mismatch handling
 *
 * @module routes/api/congress
 * @requires fs
 * @requires path
 * @requires express
 * @requires ../../controller/congress
 * @requires ../../services/logger
 * @requires ../../auth/tokenizer
 * @requires ../../validation
 * @requires ../../constants
 * @requires ../../models
 */

const fs = require('fs'),
  path = require('path'),
  router = require('express').Router(),
  { validate, ...schemas } = require('../../validation'),
  { getSnapshotsDir } = require('../../constants/paths'),
  Controller = require('../../controller/congress'),
  tokenizer = require('../../auth/tokenizer'),
  { Pol } = require('../../models'),
  logger = require('../../services/utils/logger')(__filename);

/**
 * Load statutory general election date from election dates snapshot
 *
 * This function reads the statutory general election date from the election
 * dates snapshot file. This date is used as a fallback when the snapshot
 * is outdated or unavailable.
 *
 * @returns {string|null} Statutory general election date or null if not found
 */
function loadStatutoryGeneralElectionDate() {
  try {
    // Construct path to election dates snapshot file
    const snapshotPath = path.join(
      getSnapshotsDir(),
      'electionDates.snapshot.json'
    );

    // Check if snapshot file exists and read it
    if (fs.existsSync(snapshotPath)) {
      const data = fs.readFileSync(snapshotPath, 'utf8');
      const snapshot = JSON.parse(data);
      return snapshot.statutoryGeneralElectionDate || null;
    }
  } catch (error) {
    logger.error('Failed to load statutory general election date:', error);
  }
  return null;
}

// All routes prefixed with '/api/congress'

/**
 * GET /api/congress
 * Retrieves all politicians/congressional members
 *
 * This endpoint returns a comprehensive list of all politicians serving in
 * the U.S. Congress, including House and Senate members. The data includes
 * biographical information, social media accounts, current party affiliation,
 * and congressional role history.
 *
 * The endpoint is publicly accessible and does not require authentication.
 * Data is primarily sourced from the OpenFEC API and Congress.gov API.
 *
 * @route GET /api/congress
 * @returns {Array<Object>} Array of politician objects
 *
 * @example
 * ```javascript
 * GET /api/congress
 *
 * // Response
 * [
 *   {
 *     "id": "A000055",
 *     "first_name": "Alexandria",
 *     "last_name": "Ocasio-Cortez",
 *     "current_party": "D",
 *     "has_stakes": true,
 *     "roles": [
 *       {
 *         "fec_candidate_id": "H8NY15148",
 *         "short_title": "Rep.",
 *         "congress": 118,
 *         "district": "14",
 *         "chamber": "house",
 *         "state": "NY"
 *       }
 *     ]
 *   }
 * ]
 * ```
 */
router.route('/').get((req, res) => Controller.getPols(req, res, Pol));

/**
 * GET /api/congress/members/:pol
 * Retrieves detailed information for a specific politician
 *
 * This endpoint returns comprehensive information for a single politician,
 * including all congressional roles, committee assignments, social media
 * accounts, and other biographical data. Requires authentication.
 *
 * @route GET /api/congress/members/:pol
 * @param {string} pol - Politician identifier (bioguide ID)
 * @returns {Object} Detailed politician information object
 * @throws {401} Unauthorized - Authentication required
 * @throws {404} Politician not found
 *
 * @example
 * ```javascript
 * GET /api/congress/members/A000055
 *
 * // Response
 * {
 *   "id": "A000055",
 *   "first_name": "Alexandria",
 *   "last_name": "Ocasio-Cortez",
 *   "middle_name": null,
 *   "current_party": "D",
 *   "has_stakes": true,
 *   "twitter_account": "AOC",
 *   "roles": [
 *     {
 *       "fec_candidate_id": "H8NY15148",
 *       "short_title": "Rep.",
 *       "congress": 118,
 *       "district": "14",
 *       "chamber": "house",
 *       "ocd_id": "ocd-division/country:us/state:ny/cd:14",
 *       "state": "NY",
 *       "committees": [
 *         {
 *           "code": "HCFA",
 *           "name": "House Committee on Financial Services"
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 */
router.route('/members/:pol').get(tokenizer.guard(), (req, res) => {
  Controller.getPol(req, res, Pol);
});

/**
 * GET /api/congress/election-dates
 * Returns election dates from the snapshot file with fallback support
 *
 * This endpoint provides election date information for all states or a specific state.
 * It uses a snapshot file as the primary source but includes robust fallback mechanisms
 * for when the snapshot is outdated or unavailable.
 *
 * The endpoint handles several scenarios:
 * 1. Current snapshot data (preferred)
 * 2. Outdated snapshot with statutory general election date fallback
 * 3. Complete fallback to calculated dates when snapshot is unavailable
 *
 * Query Parameters:
 * - state: Optional state code to filter results (e.g., 'CA', 'NY')
 * - year: Optional year to validate against snapshot
 *
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.state] - State code to filter results
 * @param {string} [req.query.year] - Year to validate against snapshot
 * @returns {Object} Election dates data with metadata
 *
 * @example
 * ```javascript
 * // Get all election dates
 * GET /api/congress/election-dates
 *
 * // Get election dates for specific state
 * GET /api/congress/election-dates?state=CA
 *
 * // Validate against specific year
 * GET /api/congress/election-dates?year=2026
 *
 * // Success response
 * {
 *   "success": true,
 *   "data": {
 *     "CA": {
 *       "primary": "2026-03-05",
 *       "general": "2026-11-05",
 *       "runoff": null,
 *       "special": null
 *     }
 *   },
 *   "source": "snapshot_with_statutory_general",
 *   "timestamp": "2026-01-15T10:30:00.000Z",
 *   "electionYear": 2026
 * }
 * ```
 */
router.get(
  '/election-dates',
  tokenizer.guard(),
  validate(schemas.electionDates),
  async (req, res) => {
    try {
      // Construct path to election dates snapshot file
      const snapshotPath = path.join(
        getSnapshotsDir(),
        'electionDates.snapshot.json'
      );

      // Read election dates from snapshot file
      const snapshotData = fs.readFileSync(snapshotPath, 'utf8');
      const electionSnapshot = JSON.parse(snapshotData);

      // Calculate expected election year (even years only)
      const currentYear = new Date().getFullYear();
      const expectedElectionYear =
        currentYear % 2 === 0 ? currentYear : currentYear + 1;

      // Extract optional query parameters for filtering
      const { state, year } = req.query;

      // Validate requested state exists in snapshot
      if (state && !electionSnapshot.dates[state]) {
        return res.status(404).json({
          success: false,
          error: 'State not found',
          message: `No election dates found for state: ${state}`,
          availableStates: Object.keys(electionSnapshot.dates),
        });
      }

      // Validate requested year matches snapshot year
      if (year && parseInt(year) !== electionSnapshot.electionYear) {
        return res.status(400).json({
          success: false,
          error: 'Year mismatch',
          message: `Requested year ${year} does not match snapshot year ${electionSnapshot.electionYear}`,
          snapshotYear: electionSnapshot.electionYear,
        });
      }

      // Check if snapshot is for current election year
      if (electionSnapshot.electionYear !== expectedElectionYear) {
        // Snapshot is outdated - use fallback with statutory general election date
        const statutoryGeneralElectionDate = loadStatutoryGeneralElectionDate();
        let generalElectionDateString;

        if (statutoryGeneralElectionDate) {
          generalElectionDateString = statutoryGeneralElectionDate;
        } else {
          // Calculate fallback general election date if statutory date not available
          const generalElectionDate = Controller.cycle(
            new Date(expectedElectionYear, 0, 1)
          );
          generalElectionDateString = generalElectionDate
            .toISOString()
            .split('T')[0];
        }

        logger.warn(
          `Snapshot is for ${electionSnapshot.electionYear}, expected ${expectedElectionYear}, using fallback with statutory general date`
        );

        // Return fallback data keyed by state so client always gets result.data[stateCode]
        const fallbackDates = {
          primary: `${expectedElectionYear}-06-01`,
          general: generalElectionDateString,
          runoff: null,
          special: null,
        };
        const fallbackData = Object.fromEntries(
          Object.keys(electionSnapshot.dates).map((stateKey) => [
            stateKey,
            fallbackDates,
          ])
        );

        return res.json({
          success: true,
          data: fallbackData,
          source: 'fallback_with_statutory_general',
          timestamp: new Date().toISOString(),
          electionYear: expectedElectionYear,
          statutoryGeneralDate: generalElectionDateString,
          warning: `Snapshot outdated (${electionSnapshot.electionYear} vs ${expectedElectionYear})`,
        });
      }

      // Snapshot is current - prepare response data
      let responseData = state
        ? electionSnapshot.dates[state]
        : electionSnapshot.dates;

      // Override general election dates with statutory calculation for consistency
      const statutoryGeneralElectionDate = loadStatutoryGeneralElectionDate();
      let generalElectionDateString;

      if (statutoryGeneralElectionDate) {
        generalElectionDateString = statutoryGeneralElectionDate;
      } else {
        // Calculate general election date if statutory date not available
        const generalElectionDate = Controller.cycle(
          new Date(expectedElectionYear, 0, 1)
        );
        generalElectionDateString = generalElectionDate
          .toISOString()
          .split('T')[0];
      }

      // Update general election dates in response data
      if (state) {
        // Single state response - update general election date
        responseData.general = generalElectionDateString;
      } else {
        // All states response - update general election date for all states
        Object.keys(responseData).forEach((stateCode) => {
          responseData[stateCode].general = generalElectionDateString;
        });
      }

      // Return successful response with metadata
      res.json({
        success: true,
        data: responseData,
        source: 'snapshot_with_statutory_general',
        timestamp: new Date().toISOString(),
        lastUpdated: electionSnapshot.lastUpdated,
        electionYear: electionSnapshot.electionYear,
        metadata: electionSnapshot.metadata,
        statutoryGeneralDate: generalElectionDateString,
        ...(state && { filteredState: state }),
      });
    } catch (error) {
      logger.error('Error fetching election dates:', error);

      const currentYear = new Date().getFullYear();
      const expectedElectionYear =
        currentYear % 2 === 0 ? currentYear : currentYear + 1;

      // Fallback to statutory calculation if snapshot reading fails
      try {
        const statutoryGeneralElectionDate = loadStatutoryGeneralElectionDate();
        let generalElectionDateString;

        if (statutoryGeneralElectionDate) {
          generalElectionDateString = statutoryGeneralElectionDate;
        } else {
          // Calculate fallback general election date
          const generalElectionDate = Controller.cycle(
            new Date(expectedElectionYear, 0, 1)
          );
          generalElectionDateString = generalElectionDate
            .toISOString()
            .split('T')[0];
        }

        const fallbackDates = {
          primary: `${expectedElectionYear}-06-01`,
          general: generalElectionDateString,
          runoff: null,
          special: null,
        };

        // Return state-keyed map so client always gets result.data[stateCode]
        let stateKeys = [];
        try {
          const fallbackPath = path.join(
            getSnapshotsDir(),
            'electionDates.snapshot.json'
          );
          const raw = fs.readFileSync(fallbackPath, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed.dates && typeof parsed.dates === 'object') {
            stateKeys = Object.keys(parsed.dates);
          }
        } catch (_) {
          // Keep stateKeys empty; build minimal map below
        }

        const fallbackData =
          stateKeys.length > 0
            ? Object.fromEntries(
                stateKeys.map((stateKey) => [stateKey, fallbackDates])
              )
            : { US: fallbackDates };

        res.json({
          success: true,
          data: fallbackData,
          source: 'error_fallback_with_statutory_general',
          timestamp: new Date().toISOString(),
          electionYear: expectedElectionYear,
          statutoryGeneralDate: generalElectionDateString,
          warning:
            'Snapshot unavailable, using fallback data with statutory general date',
        });
      } catch (fallbackError) {
        // Complete failure - return error response
        res.status(500).json({
          success: false,
          error: 'Failed to fetch election dates',
          message: error.message,
        });
      }
    }
  }
);

module.exports = router;
