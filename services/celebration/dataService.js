/**
 * @fileoverview Celebration Data Service
 *
 * This service provides data access and query functions for celebrations and
 * related entities (politicians, users, districts). It handles complex queries
 * for finding users with active celebrations, updating politician stake flags,
 * and district-based lookups.
 *
 * KEY FUNCTIONS
 *
 * getDistrictForCandidate(fec_candidate_id)
 * - Looks up congressional district and state for a given FEC candidate ID
 * - Queries Pol model to find politician with matching FEC candidate ID
 * - Returns district and state information
 *
 * updateHasStakes(finalIds)
 * - Updates has_stakes on Pol documents from a competitive FEC id list
 * - Sets has_stakes: true when `roles[0].fec_candidate_id` is in finalIds
 * - Sets has_stakes: false for all other Pols (second updateMany)
 *
 * getUsersInDistrict({ state, district })
 * - Finds all users in a specific congressional district
 * - Uses ocd_id: numbered districts match `state:xx/cd:NN`; at-large (`00`) matches
 *   state-only ids `ocd-division/country:us/state:xx` or legacy `cd:0` / `cd:00`
 * - Returns array of User documents
 *
 * getUsersWithActiveCelebration(fec_candidate_id)
 * - Finds all users with active celebrations for a specific candidate
 * - Excludes resolved, defunct, paused, and seeded celebrations
 * - Returns array of unique User documents
 *
 * getTotalActiveDonationsForBill(billId)
 * - Sums donation for a bill across all users and candidates
 * - Only includes Celebrations with current_status 'active'
 * - Returns total in dollars (0 if none)
 *
 * cancelCelebrationsForCandidate(candidateId)
 * - Marks all active celebrations for a candidate as inactive
 * - Used when candidate drops out or becomes ineligible
 *
 * getEscrowedTotalsByPol(baseMatch, model)
 * - Aggregates escrowed donation totals per politician (active, current cycle, has_stakes)
 * - Used by GET escrowed API and by celebration social post (total_donations)
 * - Returns array of { pol_id, donation, count }
 *
 * BUSINESS LOGIC
 *
 * DISTRICT LOOKUP
 * - Numbered House: "ocd-division/country:us/state:XX/cd:YY"
 * - At-large House: "ocd-division/country:us/state:XX" (no cd segment)
 * - Pads district numbers to 2 digits for cd matching; case-insensitive
 *
 * HAS_STAKES FLAG
 * - Indicates politician is seeking re-election, has raised funds, and has
 *   serious challenger
 * - Used for donation targeting and prioritization
 * - Updated from `roles[0].fec_candidate_id` competitive set (current House role)
 *
 * ACTIVE CELEBRATION FILTERING
 * - Excludes resolved, defunct, and paused celebrations
 * - Excludes seeded celebrations (idempotencyKey starting with "seed:")
 * - Only includes celebrations awaiting trigger condition
 *
 * DEPENDENCIES
 * - models/User: User data access
 * - models/Pol: Politician data access
 * - models/Celebration: Celebration data access
 *
 * @module services/celebration/dataService
 * @requires ../../models
 * @requires ../utils/logger
 */

const { User, Pol, Celebration } = require('../../models');
const { HOUSE_AT_LARGE_STORAGE } = require('../utils/normalizeHouseDistrict');
const logger = require('../utils/logger')(__filename);

/**
 * Lookup the district and state for a given FEC candidate ID
 * by querying the local Pol model directly.
 * @param {string} fec_candidate_id
 * @returns {{ district: string, state: string }}
 */
async function getDistrictForCandidate(fec_candidate_id) {
  const polDoc = await Pol.findOne({
    'roles.fec_candidate_id': fec_candidate_id,
  }).exec();
  if (!polDoc)
    throw new Error(`Pol record not found for ID ${fec_candidate_id}`);

  const role = polDoc.roles.find(
    (r) => r.fec_candidate_id === fec_candidate_id
  );
  if (!role) throw new Error(`Role not found for ID ${fec_candidate_id}`);

  return { district: role.district, state: role.state };
}

/**
 * Atomically sets the `has_stakes` flag on every Pol document.
 * Documents whose **current** House role (`roles[0]`) has `fec_candidate_id` in
 * `finalIds` get `has_stakes: true`; all others get `has_stakes: false`.
 * Uses two `updateMany` calls (true then false) for a full recompute.
 *
 * @param {string[]} finalIds - Array of FEC candidate IDs to flag (current role only)
 * @returns {Promise<Object>} - update result (matchedCount, modifiedCount) for the true pass
 */
async function updateHasStakes(finalIds) {
  // diagnostic: count docs where current role matches
  const toFlagCount = await Pol.countDocuments({
    'roles.0.fec_candidate_id': { $in: finalIds },
  });
  logger.info(`CelebrationDataService: ${toFlagCount} documents to flag true`);

  const resultTrue = await Pol.updateMany(
    {
      'roles.0.fec_candidate_id': { $in: finalIds },
      has_stakes: { $ne: true },
    },
    { $set: { has_stakes: true } }
  );

  await Pol.updateMany(
    {
      'roles.0.fec_candidate_id': { $nin: finalIds },
      has_stakes: { $ne: false },
    },
    { $set: { has_stakes: false } }
  );

  const matched = resultTrue.matchedCount ?? resultTrue.n;
  const modified = resultTrue.modifiedCount ?? resultTrue.nModified;
  const note =
    finalIds.length === 0
      ? 'no competitive ids'
      : matched === 0
        ? 'all targets already has_stakes true'
        : 'applied true flips';
  logger.info(
    `CelebrationDataService: updateHasStakes completed (matched=${matched}, modified=${modified}; ${note})`
  );

  return resultTrue;
}

/**
 * Returns all users in a given congressional district.
 * @param {Object} districtInfo - { state: 'TX', district: '5' }
 */
async function getUsersInDistrict({ state, district }) {
  if (!state || !district) return [];

  const paddedDistrict = Number(district).toString().padStart(2, '0');
  const st = state.toLowerCase();

  if (paddedDistrict === HOUSE_AT_LARGE_STORAGE) {
    const stateOnly = `ocd-division/country:us/state:${st}`;
    const legacyCd = new RegExp(`state:${st}/cd:(?:0|00)$`, 'i');
    return User.find({
      $or: [
        { ocd_id: { $regex: new RegExp(`^${stateOnly}$`, 'i') } },
        { ocd_id: { $regex: legacyCd } },
      ],
    }).exec();
  }

  const regex = new RegExp(`state:${st}/cd:${paddedDistrict}$`, 'i');

  return User.find({
    ocd_id: { $regex: regex },
  }).exec();
}

/**
 * Returns distinct users with active Celebrations for a given candidate.
 * @param {string} fec_candidate_id - FEC Candidate ID
 */
async function getUsersWithActiveCelebration(fec_candidate_id) {
  const celebrations = await Celebration.find({
    idempotencyKey: { $not: /^seed:/ },
    FEC_id: fec_candidate_id,
    resolved: false,
    defunct: false,
    paused: false,
  }).select('donatedBy');

  const donors = [...new Set(celebrations.map((c) => c.donatedBy.toString()))];
  return User.find({ _id: { $in: donors } }).exec();
}

/**
 * Mark all active Celebrations for the candidate as defunct (cancelled).
 */
async function cancelCelebrationsForCandidate(fecCandidateId) {
  await Celebration.updateMany(
    { FEC_id: fecCandidateId, resolved: false, defunct: false },
    { $set: { defunct: true, current_status: 'defunct' } }
  );
}

/**
 * Aggregates escrowed donation totals per politician.
 *
 * Rules:
 * - Only includes Celebrations with current_status 'active' (escrowed)
 * - Excludes defunct and paused celebrations for safety
 * - Restricts to politicians with has_stakes: true
 * - Supports optional baseMatch filters (e.g. { pol_id }) merged into the match stage
 *
 * @param {Object} baseMatch - Base $match conditions (e.g. { pol_id })
 * @param {mongoose.Model} model - Celebration model to aggregate on
 * @returns {Promise<Array<{ pol_id: string, donation: number, count: number }>>}
 */
async function getEscrowedTotalsByPol(baseMatch = {}, model = Celebration) {
  const celebrationMatch = {
    current_status: 'active',
    defunct: false,
    paused: false,
    ...baseMatch,
  };

  const pipeline = [
    { $match: celebrationMatch },
    {
      $lookup: {
        from: 'pols',
        localField: 'pol_id',
        foreignField: 'id',
        as: 'pol',
      },
    },
    { $unwind: '$pol' },
    { $match: { 'pol.has_stakes': true } },
    {
      $group: {
        _id: '$pol_id',
        donation: { $sum: '$donation' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        pol_id: '$_id',
        donation: 1,
        count: 1,
      },
    },
  ];

  const results = await model.aggregate(pipeline).exec();
  return results;
}

/**
 * Sum of donation amounts for a bill across all users and all candidates.
 * Only includes Celebrations with current_status 'active' (escrowed, not yet resolved/defunct/paused).
 *
 * @param {string} billId - Bill identifier (e.g. 'hjres54-119')
 * @returns {Promise<number>} Total donation amount in dollars, or 0 if none
 */
async function getTotalActiveDonationsForBill(billId) {
  const result = await Celebration.aggregate([
    { $match: { bill_id: billId, current_status: 'active' } },
    { $group: { _id: null, total: { $sum: '$donation' } } },
  ]).exec();
  if (!result.length) return 0;
  return result[0].total ?? 0;
}

module.exports = {
  updateHasStakes,
  getUsersInDistrict,
  getEscrowedTotalsByPol,
  getDistrictForCandidate,
  getUsersWithActiveCelebration,
  cancelCelebrationsForCandidate,
  getTotalActiveDonationsForBill,
};
