/**
 * @fileoverview H.J.Res.54 Bill Watcher
 *
 * Monitors and tracks changes to H.J.Res.54 (We The People Amendment) from the
 * Congress.gov API. This script fetches bill data, compares it to previous
 * snapshots, and updates the database when changes are detected.
 *
 * @module jobs/checkHJRes54
 * @requires path
 * @requires axios
 * @requires node-cron
 * @requires ../models
 * @requires ./runCheck
 * @requires ../services/logger
 * @requires ./snapshotManager
 * @requires ../controller/congress/config
 *
 * @description
 * CURRENT LIMITATION: This script is hardcoded to monitor only H.J.Res.54.
 * The bill number, type, and Congress ID are defined as constants at the top
 * of the file.
 *
 * FUTURE ENHANCEMENT: This should be refactored to accept bill parameters
 * dynamically (bill number, bill type, Congress ID) to support monitoring
 * any bill. Consider:
 * - Converting to a class-based approach with configurable bill parameters
 * - Accepting bill identifiers as function parameters or configuration object
 * - Supporting multiple bills in a single watcher instance
 * - Making the snapshot name and comparison logic bill-agnostic
 */

const axios = require('axios');
const cron = require('node-cron');
const { Bill, User } = require('../models');
const { EMAIL_TOPICS } = require('../constants');
const {
  getTotalActiveDonationsForBill,
} = require('../services/celebration/dataService');
const { session } = require('../controller/congress/config');
const logger = require('../services/utils/logger')(__filename);
const {
  Hjres54BillUpdated,
} = require('../controller/comms/emails/alerts/Hjres54BillUpdated');
const { sendEmail, filterUnsubscribed } = require('../controller/comms');
const { postToSocial } = require('../services/utils');
const { diffSnapshot } = require('./snapshotManager');
const runCheck = require('./runCheck');

/** @constant {number} BILL_NUMBER - The bill number to monitor (currently hardcoded to 54) */
const BILL_NUMBER = 54;

/** @constant {string} BILL_TYPE - The bill type identifier (currently hardcoded to 'hjres' for House Joint Resolution) */
const BILL_TYPE = 'hjres';

/** @constant {number} HJRES54_CONGRESS_ID - Current Congress number (must be bumped each new Congress) */
const HJRES54_CONGRESS_ID = session(); // bump each new Congress;

/** @constant {string|undefined} API_URI - Base URL for Congress.gov API from environment variable */
const API_URI = process.env.CONGRESS_API_BASE_URL;

/**
 * Helper function to safely extract nested properties from objects
 * Handles missing properties, null values, and invalid paths gracefully
 *
 * @param {Object|null|undefined} obj - The object to extract from
 * @param {string} path - Dot-separated path to the property (e.g., 'sponsor.name')
 * @param {*} [defaultValue=null] - Value to return if path doesn't exist
 * @returns {*} The value at the path, or defaultValue if not found
 *
 * @example
 * get(bill, 'sponsor.name', 'Unknown') // Returns sponsor name or 'Unknown'
 * get(bill, 'committees.items', []) // Returns committees array or empty array
 */
const get = (obj, path, defaultValue = null) => {
  if (!obj || !path) return defaultValue;
  try {
    return path
      .split('.')
      .reduce((curr, key) => curr?.[key] ?? defaultValue, obj);
  } catch {
    return defaultValue;
  }
};

/**
 * Fetches bill data from Congress.gov API and processes changes
 *
 * This function:
 * 1. Fetches current bill data from the API
 * 2. Creates a simplified tracking object with key fields
 * 3. Compares against previous snapshot to detect changes
 * 4. Updates the database with latest bill information
 * 5. Logs specific changes (status, actions, committees)
 *
 * @async
 * @function checkBill
 * @returns {Promise<void>} Resolves when bill check completes (or rejects on error)
 *
 * @throws {Error} If required bill data is missing from API response
 * @throws {Error} If API request fails
 */
async function checkBill() {
  // Normalize base URL to remove trailing slash to avoid double slashes
  const baseUrl = API_URI?.replace(/\/+$/, '') || 'https://api.congress.gov/v3';
  const url = `${baseUrl}/bill/${HJRES54_CONGRESS_ID}/${BILL_TYPE}/${BILL_NUMBER}?api_key=${process.env.CONGRESS_GOV_API_KEY}`;

  try {
    const { data } = await axios.get(url);
    // Handle potential nesting in API response (some endpoints wrap data in 'bill' property)
    const bill = get(data, 'bill', data);
    logger.info('Checking H.J.Res.54');
    logger.info(`Title: ${get(bill, 'title')}`);

    /**
     * Create a simplified bill object with only the fields we want to track for change detection
     * This is separate from the full database object to keep snapshot comparisons lightweight
     */
    const billData = {
      id: `${HJRES54_CONGRESS_ID}${BILL_TYPE}${BILL_NUMBER}`,
      committees: get(bill, 'committees.items', []),
      lastAction: get(bill, 'latestAction', {}),
      actions: get(bill, 'actions.items', []),
      updateDate: get(bill, 'updateDate'),
      status: get(bill, 'status'),
      title: get(bill, 'title'),
    };

    // Validate required fields before proceeding
    if (!billData.title || !billData.updateDate) {
      throw new Error('Missing required bill data from API response');
    }

    /**
     * Compare current bill state against previous snapshot to detect changes
     * Uses diffSnapshot utility to track changes in key fields
     */
    const { changes } = diffSnapshot({
      name: 'hjres54', // Snapshot name (hardcoded - should be dynamic in future)
      current: [billData],
      keyFn: (bill) => bill.id, // Function to generate unique key for bill
      /**
       * Comparison function that determines if bill has changed
       * Returns true if any tracked field differs between current and previous state
       * Order matters for performance: simple comparisons first, then JSON.stringify
       *
       * @param {Object} curr - Current bill state
       * @param {Object} prev - Previous bill state from snapshot
       * @returns {boolean} True if bill has changed, false otherwise
       */
      compareFn: (curr, prev) => {
        // Compare specific fields we care about
        // Simple comparisons first for performance (short-circuit evaluation)
        return (
          curr.updateDate !== prev.updateDate ||
          curr.status !== prev.status ||
          // Deep comparisons using JSON.stringify for complex objects
          JSON.stringify(curr.lastAction) !== JSON.stringify(prev.lastAction) ||
          JSON.stringify(curr.actions) !== JSON.stringify(prev.actions) ||
          JSON.stringify(curr.committees) !== JSON.stringify(prev.committees)
        );
      },
    });

    /**
     * Format complete bill data for database storage
     * This includes all fields needed for the Bill model, not just change-tracking fields
     * Includes sponsor info, dates, passage status, committees, actions, versions, etc.
     */
    const dbBillData = {
      bill_id: `${BILL_TYPE}${BILL_NUMBER}-${HJRES54_CONGRESS_ID}`,
      bill_slug: `${BILL_TYPE}${BILL_NUMBER}`,
      congress: HJRES54_CONGRESS_ID.toString(),
      bill: `H.J.RES.${BILL_NUMBER}`,
      bill_type: BILL_TYPE,
      number: `H.J.RES.${BILL_NUMBER}`,
      bill_uri: url,
      title: get(bill, 'title'),
      short_title: get(bill, 'shortTitle', 'We The People Amendment'),
      sponsor_title: get(bill, 'sponsor.title'),
      sponsor: get(bill, 'sponsor.name'),
      sponsor_id: get(bill, 'sponsor.bioguideId'),
      sponsor_uri: get(bill, 'sponsor.url'),
      sponsor_party: get(bill, 'sponsor.party'),
      sponsor_state: get(bill, 'sponsor.state'),
      gpo_pdf_uri: get(bill, 'textVersions[0].formats[0].url'),
      congressdotgov_url: `https://www.congress.gov/bill/${HJRES54_CONGRESS_ID}th-congress/house-joint-resolution/${BILL_NUMBER}`,
      govtrack_url: `https://www.govtrack.us/congress/bills/${HJRES54_CONGRESS_ID}/hjres${BILL_NUMBER}`,
      introduced_date: get(bill, 'introducedDate'),
      active: get(bill, 'active', false),
      last_vote: get(bill, 'lastVoteDate'),
      house_passage: get(bill, 'housePassage'),
      senate_passage: get(bill, 'senatePassage'),
      enacted: get(bill, 'enacted'),
      vetoed: get(bill, 'vetoed'),
      committees: get(bill, 'committees.items', []),
      /**
       * Extract committee system codes as array
       * Uses IIFE to safely handle cases where committees.items might not be an array
       */
      committee_codes: (() => {
        const items = get(bill, 'committees.items', []);
        return Array.isArray(items) ? items.map((c) => c.systemCode) : [];
      })(),
      /**
       * Extract subcommittee system codes as array
       * Uses IIFE to safely handle cases where subcommittees.items might not be an array
       */
      subcommittee_codes: (() => {
        const items = get(bill, 'subcommittees.items', []);
        return Array.isArray(items) ? items.map((c) => c.systemCode) : [];
      })(),
      latest_major_action_date: get(bill, 'latestAction.actionDate'),
      latest_major_action: get(bill, 'latestAction.text'),
      summary: get(bill, 'summary'),
      summary_short: get(bill, 'summaryShort', ''),
      /**
       * Transform text versions array into simplified format
       * Safely handles non-array values from API
       */
      versions: (() => {
        const items = get(bill, 'textVersions', []);
        return Array.isArray(items)
          ? items.map((v) => ({
              status: v.type,
              title: v.type,
              url: v.formats?.[0]?.url,
              congressdotgov_url: v.formats?.[0]?.url,
            }))
          : [];
      })(),
      /**
       * Transform actions array into simplified format with sequential IDs
       * Safely handles non-array values from API
       * Defaults chamber to 'House' if not specified
       */
      actions: (() => {
        const items = get(bill, 'actions.items', []);
        return Array.isArray(items)
          ? items.map((a, idx) => ({
              id: idx + 1,
              chamber: a.chamber || 'House',
              action_type: a.type,
              datetime: a.actionDate,
              description: a.text,
            }))
          : [];
      })(),
    };

    /**
     * Update database with latest bill information
     * Uses upsert to create new record if bill doesn't exist, or update existing one
     */
    try {
      await Bill.findOneAndUpdate({ bill_id: dbBillData.bill_id }, dbBillData, {
        upsert: true,
        new: true,
      });
      logger.info('Database updated successfully');
    } catch (dbErr) {
      logger.error('Failed to update database:', dbErr.message);
    }

    /**
     * Process and log detected changes
     * Only proceeds if changes were detected in the snapshot comparison
     */
    if (changes.length > 0) {
      const change = changes[0]; // We only track one bill (hardcoded limitation)
      logger.info('Bill updated');

      // First time tracking this bill - no previous state to compare
      if (!change.old) {
        logger.info('First time tracking this bill');
        return;
      }

      /**
       * Log specific field changes for monitoring and alerting
       * Each change type is logged separately for clarity
       */
      if (change.new.updateDate !== change.old.updateDate) {
        logger.info(
          `Update date changed: ${change.old.updateDate} -> ${change.new.updateDate}`
        );
      }

      if (change.new.status !== change.old.status) {
        logger.info(
          `Status changed: ${change.old.status} -> ${change.new.status}`
        );
      }

      if (
        JSON.stringify(change.new.lastAction) !==
        JSON.stringify(change.old.lastAction)
      ) {
        logger.info('New action:', change.new.lastAction);
      }

      /**
       * Compare and log committee assignment changes
       * Extracts system codes or names, sorts for comparison, logs old vs new
       */
      if (
        JSON.stringify(change.new.committees) !==
        JSON.stringify(change.old.committees)
      ) {
        const oldCommittees = change.old.committees
          .map((c) => c.systemCode || c.name)
          .sort();
        const newCommittees = change.new.committees
          .map((c) => c.systemCode || c.name)
          .sort();
        logger.info('Committee changes:');
        logger.info('- Old:', oldCommittees);
        logger.info('- New:', newCommittees);
      }

      const newCommitteeCodes = (change.new.committees || [])
        .map((c) => c.systemCode || c.name)
        .sort();

      const billId = `${BILL_TYPE}${BILL_NUMBER}-${HJRES54_CONGRESS_ID}`;
      const totalDonations = await getTotalActiveDonationsForBill(billId);

      const changeSummary = {
        statusOld: change.old.status,
        statusNew: change.new.status,
        lastAction: change.new.lastAction,
        committeesNew: newCommitteeCodes,
        totalDonations,
      };

      // Email: all users not unsubscribed from billUpdates
      try {
        const users = await User.find()
          .select('email username firstName settings.unsubscribedFrom')
          .lean();
        const subscribed = filterUnsubscribed(users, EMAIL_TOPICS.billUpdates);
        for (const user of subscribed) {
          const recipient = (user.email || user.username || '').trim();
          if (!recipient) continue;
          try {
            await sendEmail(
              recipient,
              Hjres54BillUpdated,
              user.firstName || '',
              changeSummary
            );
          } catch (sendErr) {
            logger.error('HJRes54 email send failed', {
              recipient,
              error: sendErr.message,
            });
          }
        }
        logger.info('HJRes54 bill-update emails sent', {
          total: subscribed.length,
        });
      } catch (emailErr) {
        logger.error('HJRes54 email step failed', { error: emailErr.message });
      }

      // Webhook: optional Make.com (or other) integration (flat payload for scenario mapping)
      const webhookUrl = process.env.HJRES54_WEBHOOK_URL;
      if (webhookUrl) {
        const timestamp = new Date().toISOString();
        const changeSummaryLines = [];
        if (change.old.status != null && change.new.status != null) {
          changeSummaryLines.push(
            `Status: ${change.old.status} → ${change.new.status}`
          );
        }
        if (
          change.new.lastAction &&
          typeof change.new.lastAction === 'object'
        ) {
          const text =
            change.new.lastAction.text || JSON.stringify(change.new.lastAction);
          changeSummaryLines.push(`Latest action: ${text}`);
        }
        if (newCommitteeCodes.length) {
          changeSummaryLines.push(
            `Committees: ${newCommitteeCodes.join(', ')}`
          );
        }
        const committeesChanged =
          JSON.stringify(change.new.committees) !==
          JSON.stringify(change.old.committees);
        const payload = {
          event_type: 'bill_updated',
          change_summary: changeSummaryLines,
          session_label: `${HJRES54_CONGRESS_ID}th Congress`,
          bill_id: `H.J.Res.${BILL_NUMBER}`,
          bill_title:
            get(bill, 'shortTitle', change.new.title) || change.new.title,
          previous_status: change.old.status || '',
          new_status: change.new.status || '',
          last_action_text:
            (change.new.lastAction && change.new.lastAction.text) || '',
          update_date: change.new.updateDate,
          total_donations: totalDonations,
          dedupe_key: `${timestamp}-${billId}`,
          committees_changed: committeesChanged,
          committees: newCommitteeCodes,
        };

        // Social webhook: bill_status event for general social announcements
        try {
          await postToSocial({
            eventType: 'bill_status',
            dedupeKey: payload.dedupe_key,
            billId: payload.bill_id,
            billTitle: payload.bill_title,
            previousStatus: payload.previous_status,
            newStatus: payload.new_status,
            lastActionText: payload.last_action_text,
            updateDate: payload.update_date,
            committeesChanged,
            committees: newCommitteeCodes,
          });
          logger.info('Posted social bill_status event for H.J.Res.54');
        } catch (postErr) {
          logger.error('Failed to post social bill_status event:', {
            error: postErr.message,
          });
        }

        try {
          await axios.post(webhookUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          });
          logger.info('HJRes54 webhook POST succeeded');
        } catch (webhookErr) {
          logger.error('HJRes54 webhook POST failed', {
            error: webhookErr.message,
            status: webhookErr.response?.status,
          });
        }
      }
    } else {
      logger.info('No new activity.');
    }
  } catch (err) {
    logger.error('Failed to check bill:', err.message);
    if (err.response?.data) {
      logger.error('API Error Details:', err.response.data);
    }
  }
}

/**
 * Main watcher function that sets up scheduled bill monitoring
 *
 * This function:
 * 1. Sets up a cron job to run checkBill on the specified schedule
 * 2. Runs an initial check immediately on startup
 * 3. Returns a promise that resolves when the initial check completes
 *
 * @function hjres54Watcher
 * @param {string} POLL_SCHEDULE - Cron schedule string (e.g., '0 2 * * *' for daily at 2 AM)
 * @returns {Promise<void>} Promise that resolves when initial check completes
 *
 * @example
 * // Run every day at 3 PM Eastern
 * hjres54Watcher('0 15 * * *');
 */
module.exports = function hjres54Watcher(POLL_SCHEDULE) {
  logger.info('HJRes54 watcher booted');

  /**
   * Schedule recurring checks using cron
   * The schedule is provided as a parameter to allow flexibility in deployment
   */
  cron.schedule(POLL_SCHEDULE, () => {
    logger.info('cron tick - checking HJRes54');
    runCheck(logger, checkBill);
  });

  /**
   * Run initial check immediately on startup
   * This ensures we have current data even if the next cron run is hours away
   */
  const initialRun = runCheck(logger, checkBill);
  initialRun.catch((err) => logger.error('initial HJRes54 run failed', err));
  return initialRun;
};
