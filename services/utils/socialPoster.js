/**
 * @fileoverview Posts watcher events to social/webhook automation (e.g. Make).
 * Rate limits: minimum delay between posts, per-run cap, per-event-type cap.
 * @module services/utils/socialPoster
 */

const logger = require('./logger')(__filename);

const MIN_DELAY_MS = Math.max(
  0,
  parseInt(process.env.SOCIAL_WEBHOOK_MIN_DELAY_MS, 10) || 10000
);
const MAX_PER_RUN = Math.max(
  0,
  parseInt(process.env.SOCIAL_WEBHOOK_MAX_PER_RUN, 10) || 30
);
const MAX_PER_EVENT_TYPE = Math.max(
  0,
  parseInt(process.env.SOCIAL_WEBHOOK_MAX_PER_EVENT_TYPE, 10) || 5
);
const DISABLED =
  process.env.SOCIAL_WEBHOOK_DISABLED === '1' ||
  process.env.SOCIAL_WEBHOOK_DISABLED === 'true';

let lastPostTime = 0;
let runPostCount = 0;
const runPostCountByType = Object.create(null);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resets per-run counters. Call at the start of each watcher run so caps apply per run.
 */
function resetSocialPostRunCount() {
  runPostCount = 0;
  Object.keys(runPostCountByType).forEach((k) => delete runPostCountByType[k]);
}

/**
 * Sends an event payload to the configured webhook. Caller is responsible for
 * dedupeKey so the automation can avoid duplicate posts (e.g. same run, retries).
 *
 * @param {Object} opts
 * @param {string} opts.eventType - Event kind (e.g. challengers, house_membership).
 * @param {string} opts.dedupeKey - Unique key for this occurrence; used to dedupe on automation side.
 * @param {boolean} [opts.committeesChanged] - Whether committee assignments changed for bill_status.
 * @param {number} [opts.convertedCount] - Number of Celebrations converted to defunct for session_end.
 * @param {string} [opts.lastActionText] - Latest action text for bill_status.
 * @param {string} [opts.previousStatus] - Previous bill status for bill_status.
 * @param {number} [opts.totalDonations] - Total escrowed for this pol this cycle (celebration event only).
 * @param {string[]} [opts.changeSummary] - Human-readable change lines for election_dates.
 * @param {string} [opts.sessionLabel] - Human-readable session (e.g. 118th Congress, 2nd Session) for session_end.
 * @param {string} [opts.updateDate] - Date of bill update (YYYY-MM-DD) for bill_status.
 * @param {string} [opts.billTitle] - Bill title for bill_status.
 * @param {string[]} [opts.committees] - Committee codes (e.g. HJUD) for bill_status.
 * @param {string} [opts.newStatus] - New bill status for bill_status.
 * @param {string} [opts.district] - Congressional district when applicable.
 * @param {number} [opts.donation] - Donation amount in dollars for celebration (no donor info sent).
 * @param {Object} [opts.handles] - Social handles (bluesky, mastodon, twitter, etc.) for linking.
 * @param {string} [opts.polName] - Display name of the politician.
 * @param {string} [opts.action] - Action for webhook branching (e.g. house_membership: 'added' | 'removed').
 * @param {string} [opts.billId] - Bill identifier (e.g. H.J.Res.54) for bill_status.
 * @param {string[]} [opts.states] - State codes with changes for election_dates.
 * @param {string} [opts.state] - State code when applicable.
 * @throws {Error} When SOCIAL_WEBHOOK_URL or SOCIAL_WEBHOOK_API_KEY is missing.
 */
async function postToSocial({
  committeesChanged,
  convertedCount,
  lastActionText,
  previousStatus,
  totalDonations,
  changeSummary,
  sessionLabel,
  updateDate,
  billTitle,
  committees,
  dedupeKey,
  eventType,
  newStatus,
  district,
  donation,
  handles,
  polName,
  action,
  billId,
  states,
  state,
}) {
  if (DISABLED) {
    return;
  }

  const key = process.env.SOCIAL_WEBHOOK_API_KEY;
  const url = process.env.SOCIAL_WEBHOOK_URL;

  if (!url || !key) {
    throw new Error('Missing SOCIAL_WEBHOOK_URL or SOCIAL_WEBHOOK_API_KEY');
  }

  if (MAX_PER_RUN > 0 && runPostCount >= MAX_PER_RUN) {
    logger.warn('Social post skipped: per-run cap reached', {
      cap: MAX_PER_RUN,
      eventType,
      dedupeKey,
    });
    return;
  }

  const typeCount = runPostCountByType[eventType] || 0;
  if (MAX_PER_EVENT_TYPE > 0 && typeCount >= MAX_PER_EVENT_TYPE) {
    logger.warn('Social post skipped: per-event-type cap reached', {
      eventType,
      cap: MAX_PER_EVENT_TYPE,
      dedupeKey,
    });
    return;
  }

  if (MIN_DELAY_MS > 0 && lastPostTime > 0) {
    const elapsed = Date.now() - lastPostTime;
    if (elapsed < MIN_DELAY_MS) {
      await sleep(MIN_DELAY_MS - elapsed);
    }
  }

  const body = {
    dedupe_key: dedupeKey,
    event_type: eventType,
    district,
    handles,
    polName,
    action,
    state,
  };

  if (billId != null) body.bill_id = billId;
  if (billTitle != null) body.bill_title = billTitle;
  if (previousStatus != null) body.previous_status = previousStatus;
  if (newStatus != null) body.new_status = newStatus;
  if (lastActionText != null) body.last_action_text = lastActionText;
  if (Array.isArray(states)) body.states = states;
  if (Array.isArray(changeSummary)) body.change_summary = changeSummary;
  if (sessionLabel != null) body.session_label = sessionLabel;
  if (convertedCount != null) body.converted_count = convertedCount;
  if (donation != null) body.donation = donation;
  if (totalDonations != null) body.total_donations = totalDonations;
  if (updateDate != null) body.update_date = updateDate;
  if (committeesChanged != null) body.committees_changed = committeesChanged;
  if (Array.isArray(committees)) body.committees = committees;

  // Never send house_membership with missing or invalid state/district/polName (avoids -NaN / blank name in Make)
  if (eventType === 'house_membership') {
    const ok =
      typeof state === 'string' &&
      state.trim() &&
      state !== 'NaN' &&
      typeof district === 'string' &&
      district.trim() &&
      district !== 'NaN' &&
      typeof polName === 'string' &&
      polName.trim();
    if (!ok) {
      throw new Error(
        'house_membership requires non-empty state, district, and polName'
      );
    }
  }

  await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-make-apikey': key,
    },
    body: JSON.stringify(body),
    method: 'POST',
  });

  lastPostTime = Date.now();
  runPostCount += 1;
  runPostCountByType[eventType] = typeCount + 1;
}

module.exports = { postToSocial, resetSocialPostRunCount };
