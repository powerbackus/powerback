const fs = require('fs');
const path = require('path');
const { FEC, getSnapshotsDir } = require('../../constants');
const { requireLogger } = require('../logger');

const logger = requireLogger(__filename);

/**
 * Election Cycle Service
 *
 * This service handles the complex logic for resetting donation limits based on:
 * - Annual resets for Guest tier (midnight EST on Dec 31st/Jan 1st)
 * - Election cycle resets for Compliant tier (state-specific primary/general election dates)
 *
 * The service integrates with the OpenFEC API to get accurate election dates
 * and provides fallback dates when the API is unavailable.
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
 * Check if a date is within the current calendar year
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is in current calendar year
 */
function isInCurrentCalendarYear(date) {
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();
  return dateYear === currentYear;
}

/**
 * Check if a date is within the current election cycle
 * @param {Date} date - Date to check
 * @param {string} state - State code (e.g., 'CA', 'NY')
 * @param {string} electionType - Type of election ('primary' or 'general')
 * @returns {Promise<boolean>} True if date is in current election cycle
 */
async function isInCurrentElectionCycle(
  date,
  state,
  electionType = 'general'
) {
  try {
    const electionDates = await getElectionDates(state);
    const currentDate = new Date();

    // Resolve target date: prefer requested type; if missing primary, use general
    let targetIso = electionDates[electionType];
    if (!targetIso && electionType === 'primary') {
      targetIso = electionDates.general;
    }
    // If still missing, compute statutory general as a conservative boundary
    let targetDate;
    if (targetIso) {
      targetDate = new Date(targetIso);
    } else {
      const { cycle } = require('../controller/congress');
      targetDate = cycle(new Date(getCurrentElectionYear(), 0, 1));
    }

    // Validate date objects
    if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
      // If no reliable boundary, fall back to legacy cutoff logic
      return fallbackElectionCycleCheck(date);
    }

    // Check if the donation date is before the boundary and we're currently before it
    return new Date(date) < targetDate && currentDate < targetDate;
  } catch (error) {
    logger.error(`Error checking election cycle for ${state}:`, error);
    // Fallback: use default election cycle logic
    return fallbackElectionCycleCheck(date);
  }
}

/**
 * Get election dates for a specific state from snapshot or fallback
 * @param {string} state - State code (e.g., 'CA', 'NY')
 * @param {number} electionYear - Election year (optional, defaults to current)
 * @returns {Promise<Object>} Object with primary and general election dates
 */
async function getElectionDates(state, electionYear = null) {
  const year = electionYear || getCurrentElectionYear();

  try {
    // Try to get election dates from snapshot first
    const snapshotPath = path.join(
      getSnapshotsDir(),
      'electionDates.snapshot.json'
    );

    const snapshotData = fs.readFileSync(snapshotPath, 'utf8');
    const electionSnapshot = JSON.parse(snapshotData);

    // Check if snapshot is for the requested year and has the state
    if (
      electionSnapshot.electionYear === year &&
      electionSnapshot.dates[state]
    ) {
      logger.info(
        `Retrieved election dates for ${state} in ${year} from snapshot:`,
        {
          primary: electionSnapshot.dates[state].primary,
          general: electionSnapshot.dates[state].general,
        }
      );
      return electionSnapshot.dates[state];
    } else {
      logger.warn(
        `No snapshot data found for ${state} in ${year} (snapshot year: ${electionSnapshot.electionYear}), using fallback`
      );
    }
  } catch (snapshotError) {
    logger.warn(
      `Failed to read election dates snapshot: ${snapshotError.message}, using fallback`
    );
  }

  // Fallback to default dates from constants
  const defaultDates = getDefaultElectionDates(state, year);
  logger.info(
    `Retrieved election dates for ${state} in ${year} from fallback:`,
    {
      primary: defaultDates.primary,
      general: defaultDates.general,
    }
  );

  return defaultDates;
}

/**
 * Get default election dates for a state (fallback when API is unavailable)
 * @param {string} state - State code
 * @param {number} year - Election year
 * @returns {Object} Object with primary and general election dates
 */
function getDefaultElectionDates(state, year) {
  const defaultDates = FEC.ELECTION_CYCLE.DEFAULT_DATES[state];

  if (!defaultDates) {
    logger.warn(`No default election dates found for state: ${state}`);
    // Compute statutory general election date; leave primary unknown
    const { cycle } = require('../controller/congress');
    const generalDate = cycle(new Date(year, 0, 1));
    return {
      primary: null,
      general: generalDate.toISOString().split('T')[0],
    };
  }

  // Update the year in the default dates
  const primaryDate = new Date(defaultDates.primary);
  const generalDate = new Date(defaultDates.general);

  primaryDate.setFullYear(year);
  generalDate.setFullYear(year);

  return {
    primary: primaryDate.toISOString().split('T')[0],
    general: generalDate.toISOString().split('T')[0],
  };
}

/**
 * Fallback election cycle check using the existing cutoff logic
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is in current election cycle
 */
function fallbackElectionCycleCheck(date) {
  // Use the existing cutoff logic as fallback
  const { cutoff } = require('../controller/congress');
  return cutoff(date);
}

/**
 * Check if annual reset should occur (midnight EST on Dec 31st/Jan 1st)
 * @param {Date} date - Date to check
 * @returns {boolean} True if annual reset should occur
 */
function shouldAnnualReset(date) {
  const estOffset = -5; // EST is UTC-5
  const utcDate = new Date(date);
  const estDate = new Date(utcDate.getTime() + estOffset * 60 * 60 * 1000);

  const month = estDate.getUTCMonth();
  const day = estDate.getUTCDate();
  const hour = estDate.getUTCHours();

  // Check if it's December 31st at or after midnight EST
  // or January 1st before midnight EST
  return (
    (month === 11 && day === 31 && hour >= 0) ||
    (month === 0 && day === 1 && hour < 24)
  );
}

/**
 * Get the effective donation limit for a user based on their compliance tier
 * and current reset status
 * @param {string} complianceTier - User's compliance tier ('guest' or 'compliant')
 * @param {Array} donations - User's donation history
 * @param {string} polId - Politician ID (for Compliant tier)
 * @param {string} state - State code (for Compliant tier)
 * @returns {Promise<Object>} Object with effective limits and reset information
 */
async function getEffectiveLimits(
  complianceTier,
  donations,
  polId = null,
  state = null
) {
  const tierInfo = FEC.COMPLIANCE_TIERS[complianceTier];

  if (!tierInfo) {
    throw new Error(`Invalid compliance tier: ${complianceTier}`);
  }

  const currentDate = new Date();
  const result = {
    complianceTier,
    resetType: tierInfo.resetType,
    resetTime: tierInfo.resetTime,
    effectiveLimit: 0,
    remainingLimit: 0,
    resetDate: null,
    nextResetDate: null,
  };

  if (tierInfo.resetType === 'annual') {
    // Guest: Annual reset at midnight EST on Dec 31st/Jan 1st
    const currentYear = currentDate.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Check if we should reset (it's after midnight EST on Dec 31st)
    if (shouldAnnualReset(currentDate)) {
      result.effectiveLimit = tierInfo.annualCap;
      result.remainingLimit = tierInfo.annualCap;
      result.resetDate = startOfYear;
      result.nextResetDate = new Date(currentYear + 1, 0, 1);
    } else {
      // Calculate remaining limit based on current year donations
      const donationsThisYear = donations.filter((d) => {
        if (d.resolved || d.defunct || d.paused) return false;
        const donationDate = new Date(d.createdAt);
        return donationDate >= startOfYear && donationDate <= endOfYear;
      });

      const currentAnnualTotal = donationsThisYear
        .map((d) => d.donation)
        .reduce((a, b) => a + b, 0);

      result.effectiveLimit = tierInfo.annualCap;
      result.remainingLimit = Math.max(
        0,
        tierInfo.annualCap - currentAnnualTotal
      );
      result.resetDate = startOfYear;
      result.nextResetDate = new Date(currentYear + 1, 0, 1);
    }
  } else if (tierInfo.resetType === 'election_cycle') {
    // Compliant: Election cycle reset based on state-specific election dates
    if (!state) {
      throw new Error(
        'State is required for Compliant tier election cycle limits'
      );
    }

    try {
      const electionDates = await getElectionDates(state);

      // Ensure we always have a valid general election date
      let generalDate;
      if (electionDates.general) {
        generalDate = new Date(electionDates.general);
      } else {
        const { cycle } = require('../controller/congress');
        generalDate = cycle(new Date(getCurrentElectionYear(), 0, 1));
      }

      // Primary may be absent; handle gracefully
      const primaryDate = electionDates.primary
        ? new Date(electionDates.primary)
        : null;

      // Determine which election cycle we're in
      let currentElectionDate, nextElectionDate;
      if (primaryDate && currentDate < primaryDate) {
        // Before primary election
        currentElectionDate = primaryDate;
        nextElectionDate = generalDate;
      } else if (currentDate < generalDate) {
        // Between primary and general election
        currentElectionDate = generalDate;
        nextElectionDate = null; // No next election in this cycle
      } else {
        // After general election - move to next cycle
        const nextYear = getCurrentElectionYear() + 2;
        const nextElectionDates = await getElectionDates(state, nextYear);
        // If primary missing for next cycle, use general as current reset
        currentElectionDate = nextElectionDates.primary
          ? new Date(nextElectionDates.primary)
          : nextElectionDates.general
          ? new Date(nextElectionDates.general)
          : new Date(getCurrentElectionYear() + 2, 0, 1);
        nextElectionDate = nextElectionDates.general
          ? new Date(nextElectionDates.general)
          : null;
      }

      // Calculate remaining limit based on current election cycle donations
      // For Compliant tier, count donations to this specific candidate in the election cycle
      const donationsThisElection = donations.filter((d) => {
        if (d.resolved || d.defunct || d.paused) return false;
        // Compliant tier limit applies per candidate - filter by pol_id
        if (d.pol_id !== polId) return false;

        const donationDate = new Date(d.createdAt);
        return donationDate < currentElectionDate;
      });

      const currentElectionTotal = donationsThisElection
        .map((d) => d.donation)
        .reduce((a, b) => a + b, 0);

      result.effectiveLimit = tierInfo.perElectionLimit;
      result.remainingLimit = Math.max(
        0,
        tierInfo.perElectionLimit - currentElectionTotal
      );
      result.resetDate = currentElectionDate;
      result.nextResetDate = nextElectionDate;
    } catch (error) {
      logger.error(
        `Error calculating election cycle limits for ${state}:`,
        error
      );
      // Fallback to basic per-election limit
      result.effectiveLimit = tierInfo.perElectionLimit;
      result.remainingLimit = tierInfo.perElectionLimit;
    }
  }

  return result;
}

/**
 * Validate if a donation would exceed limits considering resets
 * @param {string} complianceTier - User's compliance tier
 * @param {Array} donations - User's donation history
 * @param {number} attemptedAmount - Amount user wants to donate
 * @param {string} polId - Politician ID (for Compliant tier, limit applies per candidate)
 * @param {string} state - State code (for Compliant tier)
 * @returns {Promise<boolean>} True if donation would not exceed limits
 */
async function validateDonationLimits(
  complianceTier,
  donations,
  attemptedAmount,
  polId = null,
  state = null
) {
  try {
    const limits = await getEffectiveLimits(
      complianceTier,
      donations,
      polId,
      state
    );
    return attemptedAmount <= limits.remainingLimit;
  } catch (error) {
    logger.error('Error validating donation limits:', error);
    return false;
  }
}

module.exports = {
  getCurrentElectionYear,
  isInCurrentCalendarYear,
  isInCurrentElectionCycle,
  getElectionDates,
  getDefaultElectionDates,
  shouldAnnualReset,
  getEffectiveLimits,
  validateDonationLimits,
};
