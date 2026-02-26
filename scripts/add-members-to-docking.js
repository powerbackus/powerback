/**
 * @fileoverview Add specific House members to the docking_pols staging collection.
 *
 * Given one or more bioguide IDs, this script fetches member details from the
 * Congress.gov API, shapes them to the Pol schema (reusing houseWatcher logic),
 * fetches FEC candidate IDs where possible, and upserts into docking_pols.
 *
 * After running, inspect and promote via DockingManager:
 *   node services/utils/dockingManager.js dryrun pols
 *   node services/utils/dockingManager.js promote pols
 *
 * DO NOT RUN AGAINST PRODUCTION WITHOUT BACKUP AND EXPLICIT APPROVAL.
 *
 * Usage:
 *   node scripts/add-members-to-docking.js V000139 G000606
 *
 * Environment:
 *   Requires CONGRESS_GOV_API_KEY, MONGODB_URI (or default from .env / .env.local).
 *
 * @module scripts/add-members-to-docking
 */

const path = require('path');
const fs = require('fs');
const axios = require('axios');
const mongoose = require('mongoose');

// Load env
const envCliPath = path.resolve(__dirname, '../.env.cli');
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envCliPath)) require('dotenv').config({ path: envCliPath });
else if (fs.existsSync(envLocalPath))
  require('dotenv').config({ path: envLocalPath });
else require('dotenv').config();

const { Pol } = require('../models');
const { fixPolName } = require('../services/utils');
const { connect } = require('../services/utils/db');
const { requireLogger } = require('../services/logger');

const logger = requireLogger(__filename);

const CONGRESS_API_BASE_URL = process.env.CONGRESS_API_BASE_URL;
const CONGRESS = Number(process.env.CONGRESS_SESSION || 119);
const CHAMBER = 'House';

/** Social media fields that the Congress.gov API provides: 
  twitterId
  youtubeId
  facebookId
  instagramId
*/

// Fields the API does NOT supply -- NEVER overwrite existing DB values
const MANUAL_SOCIAL_FIELDS = [
  'mastodon_account',
  'bluesky_account',
  'truth_social_account',
];

/**
 * Fetch detailed member data from Congress.gov API.
 * @param {string} bioguideId
 * @returns {Promise<Object>} Raw member object from the API
 */
async function fetchMemberDetails(bioguideId) {
  const url = `${CONGRESS_API_BASE_URL}/member/${bioguideId}?format=json&api_key=${process.env.CONGRESS_GOV_API_KEY}`;
  const { data } = await axios.get(url);
  return data.member;
}

/**
 * Shape Congress.gov member data into the Pol schema.
 *
 * Only sets social media fields that the API actually provides with
 * non-empty values. Fields not supplied by the API (mastodon, bluesky,
 * truth_social) are intentionally omitted so $set does not overwrite
 * existing values in the database.
 *
 * @param {Object} m - Raw member data from Congress.gov
 * @returns {Object} Shaped data matching the Pol schema
 */
function shapeToHouseMember(m) {
  const shaped = {
    id: m.bioguideId,
    last_name: fixPolName(m.lastName ?? ''),
    first_name: fixPolName(m.firstName ?? ''),
    middle_name: fixPolName(m.middleName ?? ''),
    url: m.officialWebsiteUrl,
    current_party: m.partyHistory?.[0]?.partyAbbreviation || '',
    last_updated: m.updateDate,
    has_stakes: false, // Will be updated by challengersWatcher
    roles: [
      {
        chamber: CHAMBER,
        congress: CONGRESS,
        short_title: m.terms[m.terms.length - 1]?.shortTitle || '',
        district: m.terms[m.terms.length - 1].district,
        ocd_id:
          'ocd-division/country:us/state:' +
          m.terms[m.terms.length - 1].stateCode.toLowerCase() +
          '/cd:' +
          m.terms[m.terms.length - 1].district,
        state: m.terms[m.terms.length - 1].stateCode.toUpperCase(),
        committees:
          m.committees?.map((c) => ({ name: c.name, code: c.code })) || [],
        fec_candidate_id: '',
      },
    ],
  };

  // Only include API-provided social fields when they have actual values.
  // This prevents overwriting manually-curated handles with empty strings.
  if (m.twitterId) shaped.twitter_account = m.twitterId;
  if (m.youtubeId) shaped.youtube_account = m.youtubeId;
  if (m.facebookId) shaped.facebook_account = m.facebookId;
  if (m.instagramId) shaped.instagram_account = m.instagramId;

  // NEVER set mastodon_account, bluesky_account, truth_social_account here.
  // Those are maintained manually or via the social-handles gap-fill script.

  return shaped;
}

/**
 * Main entry point.
 * Reads bioguide IDs from argv, fetches, shapes, and upserts into docking_pols.
 */
async function main() {
  const bioguideIds = process.argv.slice(2);

  if (bioguideIds.length === 0) {
    console.log(
      'Usage: node scripts/add-members-to-docking.js <bioguideId> [bioguideId ...]'
    );
    console.log(
      'Example: node scripts/add-members-to-docking.js V000139 G000606'
    );
    process.exit(0);
  }

  logger.info(`Connecting to MongoDB...`);
  await connect(logger);

  // Create DockingPol model on the docking_pols collection
  const DockingPol = mongoose.model(
    'DockingPolStaging',
    Pol.schema,
    'docking_pols'
  );

  for (const id of bioguideIds) {
    try {
      logger.info(`Fetching details for ${id}...`);
      const memberData = await fetchMemberDetails(id);

      // Skip senators
      if (memberData.terms[memberData.terms.length - 1].chamber === 'Senate') {
        logger.info(`Skipping Senator: ${id}`);
        continue;
      }

      const shaped = shapeToHouseMember(memberData);

      // Check if existing docking doc has social media we should preserve
      const existing = await DockingPol.findOne({ id: shaped.id });
      if (existing) {
        // Preserve any manually-set social fields from the existing doc
        for (const field of MANUAL_SOCIAL_FIELDS) {
          if (existing[field] && !shaped[field]) {
            shaped[field] = existing[field];
          }
        }
        // Also preserve API social fields if existing has them and new does not
        const apiFieldMap = {
          twitterId: 'twitter_account',
          youtubeId: 'youtube_account',
          facebookId: 'facebook_account',
          instagramId: 'instagram_account',
        };
        for (const [, dbField] of Object.entries(apiFieldMap)) {
          if (existing[dbField] && !shaped[dbField]) {
            shaped[dbField] = existing[dbField];
          }
        }
      }

      await DockingPol.findOneAndUpdate(
        { id: shaped.id },
        { $set: shaped },
        { upsert: true, new: true }
      );

      logger.info(
        `Upserted ${shaped.first_name} ${shaped.last_name} (${id}) into docking_pols`
      );
    } catch (err) {
      logger.error(`Failed to process ${id}: ${err.message}`);
    }
  }

  logger.info('Done. Next steps:');
  logger.info(
    '  1. Inspect: node services/utils/dockingManager.js dryrun pols'
  );
  logger.info(
    '  2. Compare: node services/utils/dockingManager.js compare pols'
  );
  logger.info(
    '  3. Promote: node services/utils/dockingManager.js promote pols'
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
