/**
 * @fileoverview House Membership Watcher
 *
 * This background job monitors changes in House of Representatives membership
 * from the Congress.gov API and OpenFEC API. It automatically adds new
 * politicians to the database, updates has_stakes flags based on competitive
 * race status, and sends email/SMS alerts about membership changes.
 *
 * KEY FEATURES
 *
 * MEMBERSHIP MONITORING
 * - Fetches current House members from Congress.gov API
 * - Compares with previous snapshot to detect changes
 * - Adds new members to database automatically
 * - Updates existing member records
 *
 * COMPETITIVE RACE DETECTION
 * - Fetches FEC candidate data for competitive races
 * - Determines has_stakes flag based on:
 *   - Seeking re-election
 *   - Has raised funds
 *   - Has serious challenger
 * - Updates has_stakes flag in database
 *
 * FEC API INTEGRATION
 * - Uses in-memory cache to reduce API calls
 * - Persists cache to disk for durability
 * - Rate limiting to prevent API abuse
 * - Handles API errors gracefully
 *
 * ALERT SYSTEM
 * - Sends email alerts for membership changes
 * - Optional SMS alerts (commented out)
 * - Notifies administrators of changes
 *
 * BUSINESS LOGIC
 *
 * SNAPSHOT SYSTEM
 * - Stores previous House membership in snapshot file
 * - Compares current vs previous to detect changes
 * - Saves new snapshot after processing
 *
 * FEC CACHE SYSTEM
 * - In-memory Map cache: `${state}-${ELECTION_YEAR}` → [candidates]
 * - Persisted to disk for durability
 * - Loaded on startup, saved after updates
 * - Reduces redundant API calls
 *
 * RATE LIMITING
 * - Minimum 300ms between FEC API calls
 * - Prevents rapid bursts
 * - Reduces risk of rate limiting
 *
 * DEPENDENCIES
 * - fs: File system operations
 * - path: Path manipulation
 * - axios: HTTP client for API calls
 * - node-cron: Cron scheduling
 * - nodemailer: Email sending
 * - models/Pol: Politician model
 * - services/utils: sendSMS, fixPolName, DockingManager
 * - services/utils/socialPoster: Social media webhook automation
 * - controller/congress/config: Session configuration
 * - controller/comms/sendEmail: Email configuration
 * - jobs/runCheck: Database connection wrapper
 * - jobs/snapshotManager: Snapshot diffing utilities
 *
 * @module jobs/houseWatcher
 * @requires fs
 * @requires path
 * @requires axios
 * @requires node-cron
 * @requires nodemailer
 * @requires ../models
 * @requires ../services
 * @requires ../services/utils/sendSMS
 * @requires ../services/utils/fixPolName
 * @requires ../controller/congress/config
 * @requires ../controller/comms/sendEmail
 * @requires ../services/utils/socialPoster
 * @requires ./runCheck
 * @requires ./snapshotManager
 */

// Twilio for phone pushes
// const TWILIO_SID = process.env.TWILIO_SID;
// const TWILIO_TOKEN =  process.env.TWILIO_TOKEN;
// const TO_SMS = process.env.TO_SMS; // "+15551234567"
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
// const twilio = require('twilio');

const nodemailer = require('nodemailer');
const { Pol } = require('../models');
const { getSnapshotsDir } = require('../constants/paths');
const { session } = require('../controller/congress/config');
const {
  // sendSMS,
  fixPolName,
} = require('../services/utils');

const { requireLogger } = require('../services/logger');

const logger = requireLogger(__filename);
const { CONFIG: MAIL_CONFIG } = require('../controller/comms/sendEmail');
const { DockingManager, postToSocial } = require('../services/utils');

const CHAMBER = 'House';
const LIMIT = 250; // max allowed by API
const CONGRESS = session(); // bump each new Congress
const SMTP_USER = process.env.EMAIL_JONATHAN_USER;
const SNAPSHOT = path.join(getSnapshotsDir(), 'house.snapshot.json');
const FEC_CACHE_PATH = path.join(getSnapshotsDir(), 'house.fec-cache.json');
const NEXT_START = require('../controller/congress').nextStart();
const runCheck = require('./runCheck');
const CONGRESS_API_BASE_URL = process.env.CONGRESS_API_BASE_URL;
const ELECTION_YEAR = Number(NEXT_START.slice(-4)) - 1;

// In-memory FEC cache: key = `${state}-${ELECTION_YEAR}` → [candidates]
let fecCache = new Map();

/**
 * Timestamp of the last outbound FEC API call.
 * Used by the simple in-process rate limiter.
 * @type {number}
 */
let lastFecCallAt = 0;

/**
 * Simple in-process rate limiter for FEC API calls.
 *
 * Ensures a minimum delay between outbound requests to the FEC API
 * to avoid rapid bursts and reduce the risk of rate limiting.
 *
 * @async
 * @function rateLimitFec
 * @returns {Promise<void>}
 */
async function rateLimitFec() {
  const MIN_INTERVAL_MS = 300;
  const now = Date.now();
  const elapsed = now - lastFecCallAt;

  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_INTERVAL_MS - elapsed)
    );
  }

  lastFecCallAt = Date.now();
}

/**
 * Loads the persisted FEC cache from disk into memory.
 *
 * The cache is stored as a plain object whose keys are `${state}-${year}`
 * and values are arrays of FEC candidate records. This function converts
 * that object into a Map for faster lookups.
 *
 * @function loadFecCache
 * @returns {Map<string, Object[]>} Map of cached FEC results
 */
function loadFecCache() {
  try {
    const raw = fs.readFileSync(FEC_CACHE_PATH, 'utf8');
    const obj = JSON.parse(raw);
    const map = new Map();
    Object.entries(obj).forEach(([key, value]) => {
      map.set(key, value);
    });
    logger.info(`Loaded FEC cache from disk with ${map.size} state entries`);
    return map;
  } catch {
    logger.info('No existing FEC cache found on disk; starting fresh');
    return new Map();
  }
}

/**
 * Persists the in-memory FEC cache to disk.
 *
 * Serializes the Map of `${state}-${year}` keys and candidate arrays
 * to a JSON file so subsequent runs can avoid re-hitting the FEC API
 * for the same state and election year.
 *
 * @function saveFecCache
 * @returns {void}
 */
function saveFecCache() {
  try {
    const obj = {};
    for (const [key, value] of fecCache.entries()) {
      obj[key] = value;
    }
    const { writeJsonAtomic } = require('../services/utils/writeJsonAtomic');
    writeJsonAtomic(FEC_CACHE_PATH, obj);
    logger.info('FEC cache saved to disk');
  } catch (err) {
    logger.error('Failed to save FEC cache:', err.message);
  }
}

/**
 * House Membership Watcher
 *
 * Sets up a cron job to monitor House membership changes and automatically
 * adds new politicians to the database. Sends alerts when membership changes.
 *
 * Also supports a single-member test mode when invoked with:
 *   node jobs/houseWatcher.js --single BIOGUIDE_ID
 *
 * @async
 * @function houseWatcher
 * @param {string} POLL_SCHEDULE - Cron schedule string for polling frequency
 * @returns {Promise<void>} Promise that resolves after initial check completes
 */
module.exports = async function houseWatcher(POLL_SCHEDULE) {
  // Parse CLI args for single-member test mode
  const args = process.argv.slice(2);
  const singleIdx = args.indexOf('--single');
  const singleBioguideId = singleIdx !== -1 ? args[singleIdx + 1] : null;

  // Initialize docking manager
  const dockingManager = new DockingManager();
  await dockingManager.connect();

  // Create docking collection for pols
  await dockingManager.createDockingCollection('pols');

  // Create DockingPol model
  const DockingPol = require('mongoose').model(
    'DockingPol',
    Pol.schema,
    'docking_pols'
  );

  // Load FEC cache from disk
  fecCache = loadFecCache();

  /**
   * Fetches all current House members from Congress.gov API
   *
   * @async
   * @function fetchAllMembers
   * @returns {Promise<string[]>} Array of bioguideId strings for all current House members
   */
  async function fetchAllMembers() {
    let offset = 0;
    let all = [];
    let total = Infinity;

    while (offset < total) {
      const url = `${CONGRESS_API_BASE_URL}/member/congress/${CONGRESS}?format=json&offset=${offset}&limit=${LIMIT}&currentMember=true&api_key=${process.env.CONGRESS_GOV_API_KEY}`;
      const { data } = await axios.get(url);
      const batch = data?.members || data?.memberList || [];
      total = data.pagination?.count ?? batch.length;
      all.push(...batch);
      offset += LIMIT;
    }
    return all.map((m) => m.bioguideId || m.memberId); // keep it simple
  }

  /**
   * Fetches detailed information for a specific House member
   *
   * @async
   * @function fetchMemberDetails
   * @param {string} id - The bioguideId of the member
   * @returns {Promise<Object>} Detailed member information from Congress.gov API
   */
  async function fetchMemberDetails(id) {
    const url = `${CONGRESS_API_BASE_URL}/member/${id}?format=json&api_key=${process.env.CONGRESS_GOV_API_KEY}`;
    const { data } = await axios.get(url);
    return data.member;
  }

  /**
   * Matches a Congress.gov name against an FEC candidate name.
   *
   * Normalizes both names, allows first-name initial patterns,
   * and requires last-name match.
   *
   * @function matchByName
   * @param {string} fecName - Full uppercase name from FEC API
   * @param {string} firstName - First name from Congress.gov (raw)
   * @param {string} lastName - Last name from Congress.gov (raw)
   * @returns {boolean} Whether names match
   */
  function matchByName(fecName, firstName, lastName) {
    if (!fecName) return false;

    const f = firstName.toUpperCase();
    const l = lastName.toUpperCase();
    const initial = f[0];

    // FEC style: "SMITH, JOHN"
    const parts = fecName.split(',');
    const fecLast = parts[0]?.trim() || '';
    const fecRest = parts[1]?.trim() || '';

    const lastMatch = fecName.includes(l) || fecLast === l;

    const firstMatch =
      fecName.includes(f) || // "JOHN"
      fecName.includes(`${initial}.`) || // "J."
      fecRest.startsWith(initial); // "J" in "SMITH, J"

    return lastMatch && firstMatch;
  }

  /**
   * Fetches FEC candidate ID for a politician using FEC API.
   *
   * Uses a per-state cache (keyed by `${state}-${ELECTION_YEAR}`) to avoid
   * repeated API calls. On first request for a given state/election year,
   * the FEC API is called with a state-wide search; subsequent lookups in
   * that state re-use the cached results.
   *
   * Also applies a minimal rate limiter between outbound FEC API calls.
   *
   * @async
   * @function fetchFecCandidateId
   * @param {string} state - Two-letter state code
   * @param {string|number} district - Congressional district number
   * @param {string} lastName - Politician's last name
   * @param {string} firstName - Politician's first name
   * @returns {Promise<string>} FEC candidate ID, 'NON_VOTING_DELEGATE', or empty string if not found
   */
  async function fetchFecCandidateId(state, district, lastName, firstName) {
    try {
      // Non-voting delegates and undefined districts
      if (
        !district ||
        district === '0' ||
        state === 'DC' ||
        state === 'PR' ||
        state === 'GU' ||
        state === 'VI' ||
        state === 'AS' ||
        state === 'MP'
      ) {
        logger.info(
          `Skipping non-voting delegate or invalid district for ${firstName} ${lastName} (${state}-${district})`
        );
        return 'NON_VOTING_DELEGATE';
      }

      const stateKey = `${state}-${ELECTION_YEAR}`;
      const normalizedDistrict = String(district).padStart(2, '0');

      // 1. Try cache first
      if (fecCache.has(stateKey)) {
        const cached = fecCache.get(stateKey);
        const candidate = cached.find(
          (c) =>
            c.state === state &&
            c.district === normalizedDistrict &&
            matchByName((c.name || '').toUpperCase(), firstName, lastName) &&
            c.active_through === String(ELECTION_YEAR) &&
            c.election_years?.at(-1) === String(ELECTION_YEAR) &&
            !c.candidate_inactive
        );
        if (candidate) {
          logger.info(
            `Matched cached FEC ID ${candidate.candidate_id} for ${firstName} ${lastName} (${state}-${normalizedDistrict})`
          );
          return candidate.candidate_id;
        }
      }

      // 2. If no cache or no match, fetch all House candidates for this state
      const base = process.env.FEC_API_CANDIDATES_ENDPOINT;
      const params = new URLSearchParams({
        page: 1,
        sort: 'name',
        office: 'H',
        state,
        per_page: 100,
        election_year: ELECTION_YEAR,
        candidate_status: 'C',
        is_active_candidate: 'true',
        api_key: process.env.FEC_API_KEY,
      });

      const url = `${base}search/?${params.toString()}`;
      logger.info(`FEC API request for state-wide candidates: ${url}`);

      await rateLimitFec();
      const { data } = await axios.get(url);
      const results = data.results || [];

      // Cache state-wide results (even if empty) to avoid repeat requests
      fecCache.set(stateKey, results);

      if (results.length === 0) {
        logger.warn(
          `FEC search returned zero candidates for state ${state} in ${ELECTION_YEAR}`
        );
        return '';
      }

      const candidate = results.find(
        (c) =>
          c.state === state &&
          c.district === normalizedDistrict &&
          matchByName((c.name || '').toUpperCase(), firstName, lastName) &&
          c.active_through === String(ELECTION_YEAR) &&
          c.election_years?.at(-1) === String(ELECTION_YEAR) &&
          !c.candidate_inactive
      );

      if (candidate) {
        logger.info(
          `Found FEC candidate ID ${candidate.candidate_id} for ${firstName} ${lastName} (${state}-${normalizedDistrict})`
        );
        return candidate.candidate_id;
      }

      logger.warn(
        `Name or district mismatch: no FEC candidate matched for ${firstName} ${lastName} (${state}-${normalizedDistrict})`
      );
      return '';
    } catch (err) {
      logger.error(
        `Failed to fetch FEC candidate ID for ${firstName} ${lastName}:`,
        err.message
      );
      return '';
    }
  }

  /**
   * Shapes Congress.gov member data to match Pol model schema
   *
   * @function shapeToHouseMember
   * @param {Object} m - Raw member data from Congress.gov API
   * @param {string} [fecCandidateId=''] - FEC candidate ID (optional)
   * @returns {Object} Shaped data object ready for database insertion
   */
  function shapeToHouseMember(m, fecCandidateId = '') {
    const lastName = fixPolName(m.lastName ?? '');
    const fixedLastName = fixPolName(lastName);

    if (lastName !== fixedLastName) {
      logger.info(
        `Fixing politician name: ${m.firstName} ${lastName} → ${fixedLastName}`
      );
    }
    return {
      id: m.bioguideId,
      last_name: fixedLastName,
      url: m.officialWebsiteUrl,
      last_updated: m.updateDate,
      // Only set API-provided social fields when they have actual values.
      // This prevents overwriting manually-curated handles with empty strings.
      ...(m.twitterId ? { twitter_account: m.twitterId } : {}),
      ...(m.youtubeId ? { youtube_account: m.youtubeId } : {}),
      ...(m.facebookId ? { facebook_account: m.facebookId } : {}),
      ...(m.instagramId ? { instagram_account: m.instagramId } : {}),
      // mastodon_account, bluesky_account, truth_social_account: Not available
      // from Congress.gov API. Intentionally omitted so $set does not overwrite
      // existing values maintained via social-handles gap-fill script.
      first_name: fixPolName(m.firstName ?? ''),
      middle_name: fixPolName(m.middleName ?? ''),
      current_party: m.partyHistory?.[0]?.partyAbbreviation || '',
      has_stakes: false, // Will be updated by challengersWatcher
      roles: [
        {
          chamber: CHAMBER,
          congress: CONGRESS,
          short_title: m.terms[m.terms.length - 1]?.shortTitle || '', // Add short_title
          committees:
            m.committees?.map((c) => ({
              name: c.name,
              code: c.code,
            })) || [],
          fec_candidate_id: fecCandidateId,
          district: m.terms[m.terms.length - 1].district,
          ocd_id:
            'ocd-division/country:us/state:' +
            m.terms[m.terms.length - 1].stateCode.toLowerCase() +
            '/cd:' +
            m.terms[m.terms.length - 1].district,
          state: m.terms[m.terms.length - 1].stateCode.toUpperCase(),
        },
      ],
    };
  }

  /**
   * Adds a new politician to the database with full details
   *
   * @async
   * @function addNewPoliticianToDatabase
   * @param {string} bioguideId - The bioguideId of the politician to add
   * @returns {Promise<Object|null>} The created politician document or null if failed
   */
  async function addNewPoliticianToDatabase(bioguideId) {
    try {
      logger.info(`Fetching details for new politician: ${bioguideId}`);

      // If pol already exists in docking_pols AND has FEC ID → reuse it
      const existing = await DockingPol.findOne({ id: bioguideId });

      if (existing && existing.roles?.[0]?.fec_candidate_id) {
        logger.info(
          `Reusing existing FEC ID for ${existing.first_name} ${existing.last_name}`
        );
        return existing; // no FEC API call, no overwrite
      }

      const memberData = await fetchMemberDetails(bioguideId);

      // Skip if it's a Senator (we only want House members)
      if (memberData.terms[memberData.terms.length - 1].chamber === 'Senate') {
        logger.info(`Skipping Senator: ${bioguideId}`);
        return null;
      }

      const state =
        memberData.terms[memberData.terms.length - 1].stateCode.toUpperCase();
      const district = memberData.terms[memberData.terms.length - 1].district;
      const firstName = fixPolName(memberData.firstName ?? '');
      const lastName = fixPolName(memberData.lastName ?? '');

      // Fetch FEC candidate ID
      logger.info(
        `Fetching FEC candidate ID for ${firstName} ${lastName} in ${state}-${district}`
      );
      const fecCandidateId = await fetchFecCandidateId(
        state,
        district,
        lastName,
        firstName
      );

      const shapedData = shapeToHouseMember(memberData, fecCandidateId);

      // Upsert to DOCKING database
      const result = await DockingPol.findOneAndUpdate(
        { id: shapedData.id },
        { $set: shapedData },
        { upsert: true, new: true, useFindAndModify: false }
      );

      logger.info(
        `Added new politician to DOCKING database: ${
          shapedData.first_name
        } ${shapedData.last_name} (${bioguideId}) with FEC ID: ${
          fecCandidateId || 'none'
        }`
      );
      return result;
    } catch (err) {
      logger.error(
        `Failed to add politician ${bioguideId} to database:`,
        err.message
      );
      return null;
    }
  }

  /**
   * Compares two arrays to find added and removed items
   *
   * @async
   * @function diff
   * @param {string[]} [oldIds=[]] - Previous array of IDs
   * @param {string[]} [newIds=[]] - Current array of IDs
   * @returns {Promise<Object>} Object with added and removed arrays
   * @returns {Promise<string[]>} returns.added - Array of newly added IDs
   * @returns {Promise<string[]>} returns.removed - Array of removed IDs
   */
  async function diff(oldIds = [], newIds = []) {
    const added = newIds.filter((id) => !oldIds.includes(id));
    const removed = oldIds.filter((id) => !newIds.includes(id));
    return { added, removed };
  }

  /**
   * Sends email alert about House membership changes
   *
   * @async
   * @function sendEmail
   * @param {string} subject - Email subject line
   * @param {string} html - HTML content of the email
   * @returns {Promise<void>}
   */
  async function sendEmail(subject, html) {
    const mailer = nodemailer.createTransport({
      auth: {
        user: process.env.EMAIL_NO_REPLY_USER,
        pass: process.env.EMAIL_NO_REPLY_PASS,
      },
      ...MAIL_CONFIG,
    });
    await mailer.sendMail({
      from: process.env.EMAIL_NO_REPLY_USER,
      to: SMTP_USER,
      subject,
      html,
    });
  }

  /**
   * Sends SMS-like alert via email (for testing)
   *
   * @async
   * @function mimicSMS
   * @param {string} subject - Email subject line
   * @param {string} html - HTML content of the email
   * @returns {Promise<void>}
   */
  async function mimicSMS(subject, html) {
    const mailer = nodemailer.createTransport({
      auth: {
        user: process.env.EMAIL_NO_REPLY_USER,
        pass: process.env.EMAIL_NO_REPLY_PASS,
      },
      ...MAIL_CONFIG,
    });
    await mailer.sendMail({
      from: process.env.EMAIL_NO_REPLY_USER,
      to: `${process.env.PHONE_NUMBER.replace('.', '')}@txt.att.net`,
      subject,
      html,
    });
  }

  /**
   * Loads the previous snapshot of House member IDs from file
   *
   * @function loadSnapshot
   * @returns {string[]} Array of bioguideId strings from previous snapshot
   */
  function loadSnapshot() {
    try {
      const data = JSON.parse(fs.readFileSync(SNAPSHOT));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Saves current House member IDs to snapshot file
   *
   * @function saveSnapshot
   * @param {string[]} ids - Array of bioguideId strings to save
   * @returns {void}
   */
  function saveSnapshot(ids) {
    const { writeJsonAtomic } = require('../services/utils/writeJsonAtomic');
    writeJsonAtomic(SNAPSHOT, ids);
  }
  /* --------------------------------------------------------------------------- */

  logger.info('houseWatcher booted'); // start-up heartbeat

  let snapshot = loadSnapshot();

  // If invoked in single-member test mode, add just that one pol and exit
  if (singleBioguideId) {
    logger.info(
      `Single-member test mode: adding bioguideId=${singleBioguideId}`
    );
    await addNewPoliticianToDatabase(singleBioguideId);
    saveFecCache();
    return;
  }

  /**
   * Builds payload for house_membership social post from a pol document.
   * @param {Object} pol - Pol document with roles, name fields, and social handles
   * @returns {{ state: string, district: string, polName: string, handles: Object } | null}
   */
  function buildHouseMemberSocialPayload(pol) {
    const role = pol.roles?.[0];
    const stateRaw = role?.state;
    const districtRaw = role?.district;
    const state =
      typeof stateRaw === 'string' && stateRaw.trim() && stateRaw !== 'NaN'
        ? stateRaw.trim()
        : null;
    const districtStr =
      districtRaw != null && !Number.isNaN(Number(districtRaw))
        ? String(districtRaw)
        : null;
    if (!state || !districtStr) return null;
    const fullName = [pol.first_name, pol.middle_name, pol.last_name]
      .filter(Boolean)
      .join(' ');
    return {
      state,
      district: districtStr,
      polName: fixPolName(fullName),
      handles: {
        bluesky: pol.bluesky_account || '',
        twitter: pol.twitter_account || '',
        youtube: pol.youtube_account || '',
        facebook: pol.facebook_account || '',
        mastodon: pol.mastodon_account || '',
        truth: pol.truth_social_account || '',
        instagram: pol.instagram_account || '',
      },
    };
  }

  /**
   * Posts house_membership to social webhook; no-op and logs if pol missing state/district.
   * @param {Object} pol - Pol document
   * @param {string} dedupeKey - Dedupe key for the post
   * @param {'added'|'removed'} action - Whether the member was added to or removed from the House; sent to webhook for branching.
   */
  async function postHouseMemberChange(pol, dedupeKey, action) {
    const payload = buildHouseMemberSocialPayload(pol);
    if (!payload) {
      logger.warn(
        `Skipping social post for ${pol?.id ?? dedupeKey}: missing state or district`
      );
      return;
    }
    try {
      await postToSocial({
        eventType: 'house_membership',
        ...payload,
        dedupeKey,
        action,
      });
    } catch (postErr) {
      logger.error('Failed to post social house_membership event:', {
        polId: pol?.id ?? dedupeKey,
        message: postErr.message,
      });
    }
  }

  /**
   * Main function that checks for House membership changes
   *
   * Fetches current House members, compares with previous snapshot,
   * adds new politicians to database, and sends alerts for changes.
   *
   * @async
   * @function checkMembership
   * @returns {Promise<void>}
   */
  async function checkMembership() {
    let newIds;
    try {
      newIds = await fetchAllMembers();
      logger.info(`fetched ${newIds.length} records`);
    } catch (err) {
      logger.error('fetchAllMembers failed: ', {
        message: err.message,
        stack: err.stack,
      });
      return;
    }
    const oldIds = snapshot;

    const { added, removed } = await diff(oldIds, newIds);
    if (!added.length && !removed.length) {
      logger.info('no changes - all quiet');
      return;
    }

    logger.info(`changes detected  ➜  +${added.length}  -${removed.length}`);

    // ADD NEW POLITICIANS TO DATABASE
    const addedPoliticians = [];
    if (added.length > 0) {
      logger.info(`Adding ${added.length} new politicians to database...`);
      for (const bioguideId of added) {
        const politician = await addNewPoliticianToDatabase(bioguideId);
        if (politician) addedPoliticians.push(politician);
      }
      logger.info(
        `Successfully added ${addedPoliticians.length} politicians to DOCKING database`
      );
    }

    // Show docking collection stats
    const stats = await dockingManager.getCollectionStats('pols');
    logger.info('Docking collection stats:', JSON.stringify(stats, null, 2));

    logger.info('\n📋 Next steps:');
    logger.info('1. Inspect the docking collection:');
    logger.info('   node dev/docking-manager.js stats pols');
    logger.info('2. Compare with live collection:');
    logger.info('   node dev/docking-manager.js compare pols');
    logger.info('3. When ready, promote to live:');
    logger.info('   node dev/docking-manager.js promote pols');

    // SEND ALERTS
    const politicianNames = addedPoliticians
      .map((p) => `${p.first_name} ${p.last_name}`)
      .join(', ');
    const html = `
      <h3>House roster changed</h3>
      ${
        added.length
          ? `<p>✅ Joined: ${politicianNames || added.join(', ')}</p>`
          : ''
      }
      ${removed.length ? `<p>❌ Left : ${removed.join(', ')}</p>` : ''}
      <small>${new Date().toISOString()}</small>`;

    try {
      await sendEmail('House membership change', html);
      logger.info('alert email sent');
    } catch (err) {
      logger.error('sendEmail failed', {
        message: err.message,
        stack: err.stack,
      });
    }

    // Social announcement per new House member
    for (const p of addedPoliticians) {
      await postHouseMemberChange(p, `house_membership:${p.id}`, 'added');
    }

    // Social announcement per departed House member
    for (const bioguideId of removed) {
      let p;
      try {
        p = await Pol.findOne({ id: bioguideId }).lean();
      } catch (err) {
        logger.error('Failed to look up removed pol for social post:', {
          bioguideId,
          message: err.message,
        });
        continue;
      }
      if (!p) {
        logger.warn(
          `Skipping social post for departed ${bioguideId}: not found in Pol collection`
        );
        continue;
      }
      await postHouseMemberChange(
        p,
        `house_membership:${bioguideId}`,
        'removed'
      );
    }

    // *** TOGGLE TEST SMS
    try {
      await mimicSMS('House membership change', html);
      logger.info('alert mimic SMS sent');
    } catch (err) {
      logger.error('mimicSMS failed', {
        message: err.message,
        stack: err.stack,
      });
    }

    // try {
    //   await sendSMS(
    //     `House changed. +${added.length} / -${removed.length}.`
    //   );
    //   logger.info('alert SMS sent'); // success
    // } catch (err) {
    //   logger.error('sendSMS failed: ', err);
    // }

    // save new snapshot
    try {
      saveSnapshot(newIds);
      snapshot = newIds;
      logger.info('snapshot updated');
    } catch (err) {
      logger.error('failed to save snapshot: ', {
        message: err.message,
        stack: err.stack,
      });
    }

    // persist FEC cache after each membership check
    saveFecCache();
  }

  // SCHEDULE ────────────────────────────────────────────────────────
  // Every 2 min. for testing
  // cron.schedule('*/2 * * * *', checkMembership);

  /**
   * Wrapper function to run the membership check with error handling
   *
   * @function bringDownTheHouse
   * @returns {Promise<void>}
   */
  const bringDownTheHouse = () => runCheck(logger, checkMembership);
  cron.schedule(POLL_SCHEDULE, async () => {
    logger.info('cron tick - fetching roster...'); // cycle start
    bringDownTheHouse();
  });

  // kick once at start-up and return promise
  return bringDownTheHouse();
};
