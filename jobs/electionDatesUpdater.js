/**
 * @fileoverview Election Dates Updater Job
 *
 * This background job periodically fetches and updates election dates from the
 * OpenFEC API to ensure accurate election cycle resets for Gold tier compliance.
 * It maintains a snapshot of election dates and detects changes to trigger
 * notifications to users.
 *
 * KEY FEATURES
 *
 * ELECTION DATE FETCHING
 * - Fetches election dates from OpenFEC API for current election year
 * - Groups dates by state (primary, general, runoff)
 * - Handles pagination for large result sets
 *
 * SNAPSHOT MANAGEMENT
 * - Maintains election dates snapshot file
 * - Compares current vs previous to detect changes
 * - Saves new snapshot after updates
 *
 * CHANGE DETECTION
 * - Detects changes in election dates
 * - Tracks which states had date changes
 * - Triggers notification service for affected users
 *
 * FALLBACK HANDLING
 * - Uses existing snapshot if API unavailable
 * - Handles API errors gracefully
 * - Logs warnings for monitoring
 *
 * BUSINESS LOGIC
 *
 * ELECTION YEAR CALCULATION
 * - Current year if even (election year)
 * - Next even year if odd (upcoming election year)
 *
 * DATE GROUPING
 * - Groups by state abbreviation
 * - Tracks primary, general, and runoff dates
 * - Handles multiple elections per state
 *
 * STATUTORY GENERAL ELECTION
 * - Loads from snapshot for fallback
 * - Used for Gold tier per-election limit calculations
 * - First Tuesday after first Monday in November
 *
 * DEPENDENCIES
 * - fs: File system operations
 * - path: Path manipulation
 * - axios: HTTP client for OpenFEC API
 * - constants/FEC: FEC API configuration
 * - services/congress/electionDateNotificationService: Notification service
 * - controller/congress: Election cycle calculations
 * - services/utils/logger: Logging
 * - constants/paths: Snapshot directory paths
 *
 * @module jobs/electionDatesUpdater
 * @requires fs
 * @requires path
 * @requires axios
 * @requires ../constants
 * @requires ../services/congress
 * @requires ../controller/congress
 * @requires ../services/utils/logger
 * @requires ../constants/paths
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { FEC } = require('../constants');
const { ...electionDateNotificationService } = require('../services/congress');
const { cycle: computeCycleDate } = require('../controller/congress');
const logger = require('../services/utils/logger')(__filename);
const { postToSocial } = require('../services/utils');

const { getSnapshotsDir } = require('../constants/paths');

/**
 * Load statutory general election date from election dates snapshot
 * @returns {string|null} Statutory general election date or null if not found
 */
function loadStatutoryGeneralElectionDate() {
  try {
    const snapshotPath = path.join(
      getSnapshotsDir(),
      'electionDates.snapshot.json'
    );

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

/**
 * Election Dates Updater Job
 *
 * This job periodically fetches and updates election dates from the OpenFEC API
 * to ensure accurate election cycle resets for Gold tier compliance.
 *
 * The job runs on a schedule to:
 * - Fetch current and upcoming election dates for all states
 * - Update the election dates snapshot file
 * - Log any changes or API failures
 * - Use existing snapshot as fallback when API is unavailable
 */

/**
 * Get the current election year
 * @returns {number} Current election year
 */
function getCurrentElectionYear() {
  const currentYear = new Date().getFullYear();
  // Election years are even years
  return currentYear % 2 === 0 ? currentYear : currentYear + 1;
}

/**
 * Fetch all election dates for a specific year from OpenFEC API
 * @param {number} electionYear - Election year
 * @returns {Promise<Object|null>} Object with all states' election dates, or null if failed
 */
async function fetchAllElectionDates(electionYear) {
  try {
    const apiKey = process.env.FEC_API_KEY;
    if (!apiKey) {
      logger.warn('FEC API key not configured, skipping API fetch');
      return null;
    }

    const url = `${FEC.ELECTION_CYCLE.API_BASE}${FEC.ELECTION_CYCLE.ELECTION_ENDPOINT}`;
    const params = {
      per_page: 100, // More reasonable page size for API
      api_key: apiKey,
      election_year: electionYear,
      office: 'H', // House elections
    };

    const response = await axios.get(url, { params });

    if (response.data && response.data.results) {
      const elections = response.data.results;
      const allDates = {};

      logger.info(`Processing ${elections.length} elections from API response`);

      // Load existing snapshot for comparison
      const existingDates = loadExistingElectionDates();
      const changes = [];

      // Group elections by state
      elections.forEach((election) => {
        const state = election.election_state;
        if (!allDates[state]) {
          allDates[state] = {
            primary: null,
            general: null,
            runoff: null,
            special: null,
          };
        }

        // Extract all election types EXCEPT general (which is calculated statutorily)
        if (
          election.election_type_id ===
          FEC.ELECTION_CYCLE.ELECTION_TYPES.PRIMARY
        ) {
          allDates[state].primary = election.election_date;
          // Only log if this is a change from existing snapshot
          if (
            existingDates &&
            existingDates[state] &&
            existingDates[state].primary !== election.election_date
          ) {
            changes.push(
              `Primary election for ${state}: ${
                existingDates[state].primary || 'null'
              } → ${election.election_date}`
            );
          }
        } else if (
          election.election_type_id ===
          FEC.ELECTION_CYCLE.ELECTION_TYPES.GENERAL_RUNOFF
        ) {
          // GR (general runoff) maps to runoff; always set so GR overrides R when both exist
          allDates[state].runoff = election.election_date;
          if (
            existingDates &&
            existingDates[state] &&
            existingDates[state].runoff !== election.election_date
          ) {
            changes.push(
              `Runoff (general) for ${state}: ${
                existingDates[state].runoff || 'null'
              } → ${election.election_date}`
            );
          }
        } else if (
          election.election_type_id === FEC.ELECTION_CYCLE.ELECTION_TYPES.RUNOFF
        ) {
          // R (primary runoff) maps to runoff; set only if not already set (GR takes precedence)
          if (allDates[state].runoff == null) {
            allDates[state].runoff = election.election_date;
            if (
              existingDates &&
              existingDates[state] &&
              existingDates[state].runoff !== election.election_date
            ) {
              changes.push(
                `Runoff (primary) for ${state}: ${
                  existingDates[state].runoff || 'null'
                } → ${election.election_date}`
              );
            }
          }
        } else if (
          election.election_type_id ===
          FEC.ELECTION_CYCLE.ELECTION_TYPES.SPECIAL_GENERAL
        ) {
          // SG (special general) maps to special; always set so SG overrides S when both exist
          allDates[state].special = election.election_date;
          if (
            existingDates &&
            existingDates[state] &&
            existingDates[state].special !== election.election_date
          ) {
            changes.push(
              `Special (general) for ${state}: ${
                existingDates[state].special || 'null'
              } → ${election.election_date}`
            );
          }
        } else if (
          election.election_type_id ===
          FEC.ELECTION_CYCLE.ELECTION_TYPES.SPECIAL
        ) {
          // S (special) maps to special; set only if not already set (SG takes precedence)
          if (allDates[state].special == null) {
            allDates[state].special = election.election_date;
            if (
              existingDates &&
              existingDates[state] &&
              existingDates[state].special !== election.election_date
            ) {
              changes.push(
                `Special election for ${state}: ${
                  existingDates[state].special || 'null'
                } → ${election.election_date}`
              );
            }
          }
        } else if (
          election.election_type_id ===
          FEC.ELECTION_CYCLE.ELECTION_TYPES.GENERAL
        ) {
          // Skip general elections from API - they are calculated statutorily
          // Only log if this is a change from existing snapshot
          if (
            existingDates &&
            existingDates[state] &&
            existingDates[state].general !== null
          ) {
            changes.push(
              `Removing general election from API for ${state} - using statutory calculation`
            );
          }
        } else {
          // Only log unknown election types if they're new
          if (
            !existingDates ||
            !existingDates[state] ||
            !existingDates[state][election.election_type_id]
          ) {
            logger.debug(
              `Skipping unknown election type ${election.election_type_id} for ${state}`
            );
          }
        }
      });

      // Get statutory general election date from consolidated snapshot
      const statutoryGeneralElectionDate = loadStatutoryGeneralElectionDate();
      let generalElectionDateString;

      if (statutoryGeneralElectionDate) {
        generalElectionDateString = statutoryGeneralElectionDate;
        logger.info(
          `Using statutory general election date from snapshot: ${generalElectionDateString}`
        );
      } else {
        // Fallback to calculation if snapshot not available
        const currentYear = new Date().getFullYear();
        const electionYear =
          currentYear % 2 === 0 ? currentYear : currentYear + 1;
        const generalElectionDate = computeCycleDate(
          new Date(electionYear, 0, 1)
        );
        generalElectionDateString = generalElectionDate
          .toISOString()
          .split('T')[0];
        logger.warn(
          `Statutory general election date not available in snapshot, calculated: ${generalElectionDateString}`
        );
      }

      // Add statutory general election date to all states
      Object.keys(allDates).forEach((state) => {
        allDates[state].general = generalElectionDateString;
        // Only log if this is a change from existing snapshot
        if (
          existingDates &&
          existingDates[state] &&
          existingDates[state].general !== generalElectionDateString
        ) {
          changes.push(
            `General election for ${state}: ${
              existingDates[state].general || 'null'
            } → ${generalElectionDateString} (statutory)`
          );
        }
      });

      // Log changes if any
      if (changes.length > 0) {
        logger.info(`Election date changes detected (${changes.length}):`);
        changes.forEach((change) => logger.info(`  ${change}`));
      }

      // Filter out states with no valid dates
      const validDates = {};
      Object.keys(allDates).forEach((state) => {
        const dates = allDates[state];
        if (dates.primary || dates.general || dates.runoff || dates.special) {
          validDates[state] = dates;
        }
      });

      logger.info(
        `Fetched election dates for ${
          Object.keys(validDates).length
        } states from API`
      );
      return validDates;
    }
  } catch (error) {
    logger.error(
      `Failed to fetch election dates for ${electionYear}:`,
      error.message
    );
    logger.error('Error stack:', error.stack);
  }

  return null;
}

/**
 * Load existing election dates from snapshot
 * @returns {Object|null} Existing election dates or null if not found
 */
function loadExistingElectionDates() {
  try {
    const snapshotPath = path.join(
      getSnapshotsDir(),
      'electionDates.snapshot.json'
    );

    if (fs.existsSync(snapshotPath)) {
      const data = fs.readFileSync(snapshotPath, 'utf8');
      const snapshot = JSON.parse(data);
      return snapshot.dates || null;
    }
  } catch (error) {
    logger.error('Failed to load existing election dates:', error);
  }

  return null;
}

/**
 * Update election dates for all states
 * @param {number} electionYear - Election year to update
 * @returns {Promise<Object>} Updated election dates object
 */
async function updateElectionDates(electionYear) {
  logger.info(`Starting election dates update for ${electionYear}`);

  try {
    // Fetch all election dates in a single API call
    const apiDates = await fetchAllElectionDates(electionYear);

    if (apiDates && Object.keys(apiDates).length > 0) {
      // Use API data for states that have it, existing snapshot for others
      const existingDates = loadExistingElectionDates();
      const updatedDates = {};
      let apiSuccessCount = 0;
      let fallbackCount = 0;

      // Get all states from API response and existing snapshot
      const allStates = new Set([
        ...Object.keys(apiDates),
        ...(existingDates ? Object.keys(existingDates) : []),
      ]);

      for (const state of allStates) {
        if (apiDates[state]) {
          updatedDates[state] = apiDates[state];
          apiSuccessCount++;
        } else if (existingDates && existingDates[state]) {
          // Use existing snapshot data for states not returned by API
          updatedDates[state] = existingDates[state];
          fallbackCount++;
        }
      }

      logger.info(`Election dates update completed for ${electionYear}:`, {
        totalStates: Object.keys(updatedDates).length,
        apiSuccessCount,
        fallbackCount,
      });

      return updatedDates;
    } else {
      // If API call failed, use existing snapshot
      logger.warn('API fetch failed, using existing snapshot as fallback');
      const existingDates = loadExistingElectionDates();
      if (existingDates) {
        logger.info(
          `Using existing snapshot with ${
            Object.keys(existingDates).length
          } states`
        );
        return existingDates;
      } else {
        logger.error('No API data and no existing snapshot available');
        return {};
      }
    }
  } catch (error) {
    logger.error(`Error updating election dates for ${electionYear}:`, error);
    // Try to use existing snapshot as last resort
    const existingDates = loadExistingElectionDates();
    if (existingDates) {
      logger.info(`Using existing snapshot as fallback after error`);
      return existingDates;
    }
    return {};
  }
}

/**
 * Main job function to update election dates
 */
async function electionDatesUpdater() {
  logger.info('Election dates updater job started');

  try {
    const currentElectionYear = getCurrentElectionYear();

    // Update dates for current election cycle only
    const currentDates = await updateElectionDates(currentElectionYear);

    // Save the updated dates to snapshot file
    await saveElectionDatesToSnapshot(currentElectionYear, currentDates);
  } catch (error) {
    logger.error('Election dates updater job failed:', error);
  }
}

/**
 * Save election dates to snapshot file
 * @param {number} currentYear - Current election year
 * @param {Object} currentDates - Current election cycle dates
 * @returns {Promise<void>}
 */
async function saveElectionDatesToSnapshot(currentYear, currentDates) {
  try {
    const snapshotPath = path.join(
      getSnapshotsDir(),
      'electionDates.snapshot.json'
    );

    // Read existing snapshot to compare
    let existingSnapshot = null;
    let changes = [];

    try {
      const existingData = fs.readFileSync(snapshotPath, 'utf8');
      existingSnapshot = JSON.parse(existingData);
    } catch (readError) {
      logger.info('No existing snapshot found, creating new one');
    }

    // Compare dates and log differences
    const statesWithChanges = [];

    if (existingSnapshot && existingSnapshot.dates) {
      Object.keys(currentDates).forEach((state) => {
        const newDates = currentDates[state];
        const oldDates = existingSnapshot.dates[state];

        if (!oldDates) {
          changes.push(
            `Added ${state}: ${newDates.primary}/${newDates.general}`
          );
        } else if (
          oldDates.primary !== newDates.primary ||
          oldDates.general !== newDates.general
        ) {
          changes.push(
            `Updated ${state}: ${oldDates.primary}/${oldDates.general} → ${newDates.primary}/${newDates.general}`
          );

          // Track states with changes for notifications
          statesWithChanges.push({
            state,
            oldDates,
            newDates,
          });
        }
      });

      // Check for removed states
      Object.keys(existingSnapshot.dates).forEach((state) => {
        if (!currentDates[state]) {
          changes.push(
            `Removed ${state}: ${existingSnapshot.dates[state].primary}/${existingSnapshot.dates[state].general}`
          );
        }
      });
    }

    // Determine statutory general election date from existing snapshot or compute
    let statutoryGeneralElectionDate = null;
    if (existingSnapshot && existingSnapshot.statutoryGeneralElectionDate) {
      statutoryGeneralElectionDate =
        existingSnapshot.statutoryGeneralElectionDate;
    } else {
      const computed = computeCycleDate(new Date(currentYear, 0, 1));
      statutoryGeneralElectionDate = computed.toISOString().split('T')[0];
    }

    // Create snapshot structure with only current election year
    const snapshot = {
      electionYear: currentYear,
      statutoryGeneralElectionDate,
      dates: currentDates,
      lastUpdated: new Date().toISOString(),
      source: existingSnapshot?.source || 'OpenFEC API',
      metadata: {
        generatedBy: 'electionDatesUpdater',
        version: '1.0.0',
        description:
          'Election dates for House of Representatives primaries and general elections',
      },
    };

    // Write updated snapshot
    const { writeJsonAtomic } = require('../services/utils/writeJsonAtomic');
    writeJsonAtomic(snapshotPath, snapshot);
    logger.info(`Election dates snapshot updated: ${snapshotPath}`);

    // Log changes if any
    if (changes.length > 0) {
      logger.info(`Election date changes detected (${changes.length}):`);
      changes.forEach((change) => logger.info(`  ${change}`));
    }

    // Send notifications for states with changes
    if (statesWithChanges.length > 0) {
      logger.info(
        `Sending notifications for ${statesWithChanges.length} states with changes`
      );

      const notificationResults = [];
      for (const change of statesWithChanges) {
        try {
          const result =
            await electionDateNotificationService.handleElectionDateChange(
              change.state,
              change.oldDates,
              change.newDates
            );
          notificationResults.push(result);
        } catch (error) {
          logger.error(
            `Failed to send notifications for ${change.state}:`,
            error
          );
        }
      }

      // Log notification summary
      const totalEmailsSent = notificationResults.reduce(
        (sum, result) => sum + result.totalEmailsSent,
        0
      );
      logger.info(
        `Election date change notifications completed: ${totalEmailsSent} emails sent across ${notificationResults.length} states`
      );

      try {
        await postToSocial({
          eventType: 'election_dates',
          dedupeKey: `election_dates:${currentYear}:${Date.now()}`,
          states: statesWithChanges.map((c) => c.state),
          changeSummary: changes,
        });
        logger.info('Posted social election_dates event');
      } catch (postErr) {
        logger.error('Failed to post social election_dates event:', {
          message: postErr.message,
        });
      }
    }

    // Log summary
    const totalStates = Object.keys(currentDates).length;
    logger.info(
      `Snapshot contains election dates for ${totalStates} states for ${currentYear} election cycle`
    );
  } catch (error) {
    logger.error('Failed to save election dates snapshot:', error);
    throw error;
  }
}

/**
 * Manual trigger function for immediate update
 * @returns {Promise<void>}
 */
async function triggerElectionDatesUpdate() {
  logger.info('Manual election dates update triggered');
  await electionDatesUpdater();
}

module.exports = {
  electionDatesUpdater,
  triggerElectionDatesUpdate,
  updateElectionDates,
  fetchAllElectionDates,
};
