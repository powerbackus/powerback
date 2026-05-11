/**
 * @fileoverview Policy layer for politicians who must not receive new Celebrations
 *
 * Roster exclusion is independent of has_stakes (watcher/FEC competitive set).
 * Use these helpers for API validation and roster queries; do not overload
 * has_stakes for policy-driven exclusions.
 *
 * @module services/congress/polRosterEligibility
 */

const { requireLogger } = require('../logger');

const logger = requireLogger(__filename);

/** User-facing copy when a Pol is blocked from new celebrations */
const POL_ROSTER_EXCLUDED_USER_MESSAGE =
  'That representative is not available for new celebrations. Please choose another member from the list.';

/**
 * Allowed values for Pol.roster_exclusion_category (admin / tooling).
 * @type {readonly string[]}
 */
const ROSTER_EXCLUSION_CATEGORIES = Object.freeze([
  'delegate_or_non_voting',
  'manual_admin_exclusion',
  'data_integrity_hold',
  'speaker_of_house',
  'left_office',
  'deceased',
  'resigned',
]);

const ROSTER_EXCLUSION_LABELS = Object.freeze({
  delegate_or_non_voting: 'Non-voting delegate',
  manual_admin_exclusion: 'Unavailable by platform review',
  data_integrity_hold: 'Pending data review',
  speaker_of_house: 'Speaker of the House',
  left_office: 'No longer in office',
  deceased: 'No longer serving',
  resigned: 'Resigned from office',
});

/**
 * Whether a Pol document is roster-excluded for new celebrations.
 * @param {{ roster_excluded?: boolean } | null | undefined} pol - Lean Pol or null
 * @returns {boolean}
 */
function isPolDocumentRosterExcluded(pol) {
  return pol != null && pol.roster_excluded === true;
}

/**
 * True when the bioguide id refers to a Pol marked roster_excluded.
 * Missing Pol is treated as not excluded (other flows handle unknown ids).
 *
 * @param {Object} Pol - Mongoose Pol model
 * @param {string} [bioguideId] - Bioguide id (Celebration.pol_id)
 * @returns {Promise<boolean>}
 */
async function isPolRosterExcludedByBioguide(Pol, bioguideId) {
  if (!bioguideId || typeof bioguideId !== 'string') {
    return false;
  }
  try {
    const pol = await Pol.findOne({ id: bioguideId })
      .select('roster_excluded')
      .lean()
      .exec();
    return isPolDocumentRosterExcluded(pol);
  } catch (err) {
    logger.error('roster exclusion lookup failed', {
      error: err.message,
    });
    throw err;
  }
}

module.exports = {
  POL_ROSTER_EXCLUDED_USER_MESSAGE,
  ROSTER_EXCLUSION_CATEGORIES,
  ROSTER_EXCLUSION_LABELS,
  isPolDocumentRosterExcluded,
  isPolRosterExcludedByBioguide,
};
