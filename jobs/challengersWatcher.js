/**
 * @fileoverview Challengers Status Watcher
 *
 * This background job monitors challenger status for House races using the
 * OpenFEC API. It tracks when challengers appear, disappear, or reappear,
 * and when incumbents drop out. The job updates has_stakes flags and sends
 * email alerts to users in affected districts.
 *
 * KEY FEATURES
 *
 * CHALLENGER MONITORING
 * - Fetches incumbent and challenger data from OpenFEC API
 * - Tracks challenger status changes (appeared, disappeared, reappeared)
 * - Tracks incumbent dropouts
 * - Updates has_stakes flags based on competitive race status
 *
 * EMAIL ALERTS
 * - Sends alerts to users in affected districts
 * - Respects user unsubscribe preferences
 * - Different email templates for different event types:
 *   - ChallengerAppeared: New challenger entered race
 *   - ChallengerDisappeared: Challenger dropped out
 *   - ChallengerReappeared: Challenger re-entered race
 *   - IncumbentDroppedOut: Incumbent dropped out
 *
 * CELEBRATION CANCELLATION
 * - Cancels or defuncts active celebrations for candidates who drop out
 * - Updates celebration status via StatusService
 *
 * BUSINESS LOGIC
 *
 * SNAPSHOT SYSTEM
 * - Stores previous challenger status in snapshot file
 * - Compares current vs previous to detect changes
 * - Tracks has_stakes flag per candidate
 *
 * PAGING
 * - Fetches data in pages of 100 candidates
 * - Handles pagination from OpenFEC API
 * - Processes all pages before comparing
 *
 * DISTRICT MAPPING
 * - Maps candidates to congressional districts
 * - Finds users in affected districts
 * - Sends targeted alerts to relevant users
 *
 * DEPENDENCIES
 * - fs: File system operations
 * - path: Path manipulation
 * - axios: HTTP client for OpenFEC API
 * - node-cron: Cron scheduling
 * - nodemailer: Email sending
 * - models: Pol, Celebration, User
 * - services/celebration/statusService: Status management
 * - controller/comms: Email sending and filtering
 * - jobs/snapshotManager: Snapshot diffing
 * - jobs/runCheck: Database connection wrapper
 *
 * @module jobs/challengersWatcher
 * @requires fs
 * @requires path
 * @requires axios
 * @requires node-cron
 * @requires nodemailer
 * @requires ../models
 * @requires ../services/celebration/statusService
 * @requires ../controller/comms
 * @requires ./snapshotManager
 * @requires ./runCheck
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const { Pol, Celebration } = require('../models');
const { getSnapshotsDir } = require('../constants/paths');
const { CONFIG: MAIL_CONFIG } = require('../controller/comms/sendEmail');
const { StatusService } = require('../services/celebration/statusService');

// const twilio = require('twilio');
// const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
// const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// const TO_SMS = process.env.PHONE_NUMBER;

// Service layer for user/celebration logic
const {
  sendSMS,
  getUsersInDistrict,
  getDistrictForCandidate,
  getUsersWithActiveCelebration,
  cancelCelebrationsForCandidate,
} = require('../services');
const { filterUnsubscribed } = require('../controller/comms');
const { postToSocial } = require('../services/utils');
const { EMAIL_TOPICS } = require('../constants');
const {
  ChallengerAppeared,
  ChallengerReappeared,
  ChallengerDisappeared,
  IncumbentDroppedOut,
} = require('../controller/comms/emails/alerts');
const { getEmailAddress } = require('../controller/comms/addresses');
const logger = require('../services/utils/logger')(__filename);

const SNAPSHOT = path.join(getSnapshotsDir(), 'challengers.snapshot.json');
const NEXT_START = require('../controller/congress').nextStart();
const ELECTION_YEAR = Number(NEXT_START.slice(-4)) - 1;
const { fixPolName } = require('../services/utils/fixPolName');
const { diffSnapshot } = require('./snapshotManager');
const runCheck = require('./runCheck');

const FROM_ADDRESS = getEmailAddress(6);
const PAGE_SIZE = 100;

function loadSnapshot() {
  try {
    const data = JSON.parse(fs.readFileSync(SNAPSHOT));
    return Object.entries(data).map(([id, info]) => ({
      fec_candidate_id: id,
      has_stakes: info.has_stakes,
    }));
  } catch (err) {
    logger.error('Failed to load snapshot:', err);
    return [];
  }
}

function getFecUrl({ page, challengeTypes }) {
  const base = process.env.FEC_API_CANDIDATES_ENDPOINT;
  const query = new URLSearchParams({
    page,
    office: 'H',
    sort: 'name',
    per_page: PAGE_SIZE,
    candidate_status: 'C',
    has_raised_funds: 'true',
    is_active_candidate: 'true',
    election_year: ELECTION_YEAR,
    api_key: process.env.FEC_API_KEY,
  });

  challengeTypes.forEach((type) => query.append('incumbent_challenge', type));
  return `${base}?${query.toString()}`;
}

async function fetchIncumbents() {
  // For testing: use snapshot
  if (process.env.NODE_ENV === 'test') {
    const snapshot = loadSnapshot();
    return snapshot;
  }

  const ids = [];
  let page = 1;
  while (true) {
    const url = getFecUrl({ page, challengeTypes: ['I'] });
    const { data } = await axios.get(url);
    ids.push(...data.results.map((c) => c.candidate_id));
    if (page >= data.pagination.pages) break;
    page++;
  }
  return ids;
}

async function fetchChallengers() {
  // For testing: use snapshot
  if (process.env.NODE_ENV === 'test') {
    const snapshot = loadSnapshot();
    return snapshot.map((id) => ({
      candidate_id: id,
      election_years: [ELECTION_YEAR],
      election_districts: ['26'],
      state: 'TX',
    }));
  }

  const challengers = [];
  let page = 1;
  while (true) {
    const url = getFecUrl({ page, challengeTypes: ['C', 'O'] });
    const { data } = await axios.get(url);
    challengers.push(...data.results);
    if (page >= data.pagination.pages) break;
    page++;
  }
  return challengers;
}

async function sendEmail(to, subject, html) {
  logger.info(`Attempting to send email: subject="${subject}" to="${to}"`);
  const mailer = nodemailer.createTransport({
    auth: {
      user: process.env.EMAIL_NO_REPLY_USER,
      pass: process.env.EMAIL_NO_REPLY_PASS,
    },
    ...MAIL_CONFIG,
  });
  try {
    const result = await mailer.sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    logger.info(`Email sent successfully: ${result.messageId}`);
    return result;
  } catch (err) {
    logger.error(`Failed to send email: ${err.message}`, {
      to,
      subject,
      error: err,
    });
    throw err;
  }
}

module.exports = async function challengersWatcher(POLL_SCHEDULE) {
  let snapshot = loadSnapshot();
  logger.info('challengersWatcher booted');
  logger.info(`Using election year: ${ELECTION_YEAR}`);
  logger.info(`Current snapshot contains ${snapshot.length} IDs`);

  async function checkChallengers() {
    let incumbents, challengers;
    try {
      incumbents = await fetchIncumbents();
      logger.info(`fetched ${incumbents.length} running incumbents`);
      challengers = await fetchChallengers();
      logger.info(`fetched ${challengers.length} serious challengers`);
    } catch (err) {
      logger.error('fetch failed:', err);
      return;
    }

    const challengerDistricts = new Set(
      challengers.map((c) => {
        const idx = c.election_years.findIndex((y) => y === ELECTION_YEAR);
        const dist = c.election_districts[idx];
        return `${c.state}-${dist}`;
      })
    );
    logger.info(
      `matching ${incumbents.length} incumbents against ${challengerDistricts.size} districts`
    );

    const finalIds = [];
    for (const incId of incumbents) {
      let info;
      try {
        info = await getDistrictForCandidate(incId);
      } catch (err) {
        logger.warn(`skipping ${incId}: ${err.message}`);
        continue;
      }
      const key = `${info.state}-${info.district}`;
      if (challengerDistricts.has(key)) {
        finalIds.push(incId);
      }
    }
    logger.info(`found ${finalIds.length} incumbents with challengers`);

    const resultTrue = await Pol.updateMany(
      {
        'roles.0.fec_candidate_id': { $in: finalIds },
        has_stakes: { $ne: true },
      },
      { $set: { has_stakes: true } }
    );
    const resultFalse = await Pol.updateMany(
      {
        'roles.0.fec_candidate_id': { $nin: finalIds },
        has_stakes: { $ne: false },
      },
      { $set: { has_stakes: false } }
    );

    logger.info(
      `updateHasStakes → true: matched=${
        resultTrue.matchedCount ?? resultTrue.n
      } modified=${
        resultTrue.modifiedCount ?? resultTrue.nModified
      } | false: matched=${
        resultFalse.matchedCount ?? resultFalse.n
      } modified=${resultFalse.modifiedCount ?? resultFalse.nModified}`
    );

    // Convert finalIds array into array of objects with has_stakes property
    const polsArray = finalIds.map((id) => ({
      fec_candidate_id: id,
      has_stakes: true,
    }));

    // Track current incumbents for distinguishing dropout types
    const currentIncumbentIds = new Set(incumbents);

    // Diff incumbents snapshot to detect newly running incumbents
    const { changes: incumbentChanges } = diffSnapshot({
      name: 'incumbents',
      current: incumbents.map((id) => ({ fec_candidate_id: id })),
      keyFn: (pol) => pol.fec_candidate_id,
      // Incumbent entries have no evolving fields today; treat only new keys as changes
      compareFn: () => false,
    });
    const addedIncumbents = incumbentChanges.filter((change) => !change.old);
    if (addedIncumbents.length > 0) {
      logger.info(`${addedIncumbents.length} incumbents added.`);
    }

    const { changes, removals } = diffSnapshot({
      name: 'challengers',
      current: polsArray,
      keyFn: (pol) => pol.fec_candidate_id,
      compareFn: (curr, prev) => curr.has_stakes !== prev.has_stakes,
    });

    if (changes.length > 0) {
      logger.info(`${changes.length} challengers changed.`);
    }
    if (removals.length > 0) {
      logger.info(`${removals.length} candidates removed from snapshot.`);
    }

    // Process added challengers
    const added = changes.filter(
      (change) => !change.old || !change.old.has_stakes
    );
    const removed = changes.filter(
      (change) => change.old && change.old.has_stakes
    );

    for (const change of added) {
      const polId = change.key;
      try {
        const polDoc = await Pol.findOne({
          'roles.fec_candidate_id': polId,
        });
        if (!polDoc) {
          logger.warn(`Pol not found for ${polId}`);
          continue;
        }
        const { state, district } =
          polDoc.roles.find((r) => r.fec_candidate_id === polId) || {};
        if (!state || !district) {
          logger.warn(`Missing state/district for ${polId}`);
          continue;
        }

        logger.info(`Processing added pol: ${polId} (${state}-${district})`);

        // Social announcement for the new challenger event
        try {
          const polFullName = [
            polDoc.first_name,
            polDoc.middle_name,
            polDoc.last_name,
          ]
            .filter(Boolean)
            .join(' ');
          const polName = fixPolName(polFullName);
          await postToSocial({
            eventType: 'challengers',
            action: 'added',
            polName: polName,
            handles: {
              bluesky: polDoc.bluesky_account || '',
              twitter: polDoc.twitter_account || '',
              youtube: polDoc.youtube_account || '',
              facebook: polDoc.facebook_account || '',
              mastodon: polDoc.mastodon_account || '',
              truth: polDoc.truth_social_account || '',
              instagram: polDoc.instagram_account || '',
            },
            dedupeKey: `challenger:${polId}`,
            district: district,
            state: state,
          });
          logger.info(
            `Posted social challenger event for ${state}-${district}`
          );
        } catch (postErr) {
          logger.error('Failed to post social challenger event:', postErr);
        }

        // Check if this is a reappearance by looking for users who have previously made celebrations
        const usersWithCelebrations =
          await getUsersWithActiveCelebration(polId);
        const isReappearance = usersWithCelebrations.length > 0;

        if (isReappearance) {
          logger.info(
            `Found ${usersWithCelebrations.length} users with celebrations for ${polId}`
          );

          // Filter out users unsubscribed from district updates
          const subscribedUsers = await filterUnsubscribed(
            usersWithCelebrations,
            EMAIL_TOPICS.districtUpdates
          );

          // Notify users with celebrations
          for (const user of subscribedUsers) {
            const recipient = (user.email || user.username || '').trim();
            if (!recipient) {
              logger.warn(
                `Skipped email for user ${user._id} - no valid email or username`
              );
              continue;
            }

            try {
              await sendEmail(
                recipient,
                'Your Representative Has a New Challenger!',
                ChallengerReappeared(
                  user.first_name,
                  state,
                  district,
                  polDoc.name
                )
              );
            } catch (err) {
              logger.error(
                `Failed to send ChallengerReappeared email to ${recipient}:`,
                err
              );
            }
          }
        } else {
          // Handle new challenger appearance (existing code)
          const districtUsers = await getUsersInDistrict(state, district);
          logger.info(
            `Found ${districtUsers.length} users in district ${state}-${district}`
          );

          try {
            await sendSMS(
              `New challenger in ${state}-${district}. ${districtUsers.length} users notified.`
            );
            logger.info('Alert SMS sent');
          } catch (err) {
            logger.error('Failed to send SMS alert:', err);
          }

          if (!districtUsers.length) {
            logger.info(
              `No users found in ${state}-${district}, skipping notifications`
            );
            continue;
          }

          // Filter out users unsubscribed from district updates
          const subscribedUsers = await filterUnsubscribed(
            districtUsers,
            EMAIL_TOPICS.districtUpdates
          );

          for (const user of subscribedUsers) {
            const recipient = (user.email || user.username || '').trim();
            if (!recipient) {
              logger.warn(
                `Skipped email for user ${user._id} - no valid email or username`
              );
              continue;
            }

            try {
              await sendEmail(
                recipient,
                'A New Challenger Has Appeared in Your District!',
                ChallengerAppeared(
                  user.first_name,
                  state,
                  district,
                  polDoc.name
                )
              );
            } catch (err) {
              logger.error(
                `Failed to send ChallengerAppeared email to ${recipient}:`,
                err
              );
            }
          }
        }
      } catch (err) {
        logger.error(`Failed notifications for ${polId}: ${err.message}`);
      }
    }

    // Process removed challengers
    for (const change of removed) {
      const polId = change.key;
      try {
        const polDoc = await Pol.findOne({
          'roles.fec_candidate_id': polId,
        });
        if (!polDoc) {
          logger.warn(`Pol not found for ${polId}`);
          continue;
        }
        const { state, district } =
          polDoc.roles.find((r) => r.fec_candidate_id === polId) || {};
        if (!state || !district) {
          logger.warn(`Missing state/district for ${polId}`);
          continue;
        }

        logger.info(`Processing removed pol: ${polId} (${state}-${district})`);

        const celebrationUsers = await getUsersWithActiveCelebration(polId);
        logger.info(
          `Found ${celebrationUsers.length} users with active celebrations for removed pol ${polId}`
        );

        try {
          await sendSMS(
            `Challenger left race in ${state}-${district}. ${celebrationUsers.length} celebrations paused.`
          );
          logger.info('Alert SMS sent');
        } catch (err) {
          logger.error('Failed to send SMS alert:', err);
        }

        if (!celebrationUsers.length) {
          logger.info(
            `No active celebrations found for ${polId}, skipping notifications`
          );
          continue;
        }

        await cancelCelebrationsForCandidate(polId);
        logger.info(`Cancelled celebrations for ${polId}`);

        await Celebration.updateMany(
          {
            'donee.roles.fec_candidate_id': polId,
            idempotencyKey: { $not: /^seed:/ },
          },
          { $set: { paused: true } }
        );
        logger.info(`Paused celebrations for ${polId}`);

        // Filter out users unsubscribed from district updates
        const subscribedUsers = await filterUnsubscribed(
          celebrationUsers,
          EMAIL_TOPICS.districtUpdates
        );

        for (const user of subscribedUsers) {
          const recipient = (user.email || user.username || '').trim();
          if (!recipient) {
            logger.warn(
              `Skipped email for user ${user._id} - no valid email or username`
            );
            continue;
          }

          try {
            const challengerEmailData = ChallengerDisappeared(
              user.first_name,
              state,
              district,
              polDoc.name
            );
            await sendEmail(
              recipient,
              challengerEmailData[1], // subject
              challengerEmailData[2] // html
            );
          } catch (err) {
            logger.error(
              `Failed to send ChallengerDisappeared email to ${recipient}:`,
              err
            );
          }
        }
      } catch (err) {
        logger.error(`Failed cleanup for ${polId}: ${err.message}`);
      }
    }

    // Process incumbent dropouts (removed from snapshot and no longer in incumbents list)
    for (const removal of removals) {
      const polId = removal.key;

      // Check if this is an incumbent dropout (not in current incumbents list)
      const isIncumbentDropout = !currentIncumbentIds.has(polId);

      if (!isIncumbentDropout) {
        // Still an incumbent, so this is a challenger dropout (already handled above)
        continue;
      }

      try {
        const polDoc = await Pol.findOne({
          'roles.fec_candidate_id': polId,
        });
        if (!polDoc) {
          logger.warn(`Pol not found for ${polId}`);
          continue;
        }
        const { state, district } =
          polDoc.roles.find((r) => r.fec_candidate_id === polId) || {};
        if (!state || !district) {
          logger.warn(`Missing state/district for ${polId}`);
          continue;
        }

        logger.info(
          `Processing incumbent dropout: ${polId} (${state}-${district})`
        );

        // Social announcement for incumbent dropout (incumbent removed from race)
        try {
          const polFullName = [
            polDoc.first_name,
            polDoc.middle_name,
            polDoc.last_name,
          ]
            .filter(Boolean)
            .join(' ');
          const polName = fixPolName(polFullName || polDoc.name);
          await postToSocial({
            polName,
            eventType: 'incumbents',
            action: 'removed',
            handles: {
              bluesky: polDoc.bluesky_account || '',
              twitter: polDoc.twitter_account || '',
              youtube: polDoc.youtube_account || '',
              facebook: polDoc.facebook_account || '',
              mastodon: polDoc.mastodon_account || '',
              truth: polDoc.truth_social_account || '',
              instagram: polDoc.instagram_account || '',
            },
            dedupeKey: `incumbent_dropout:${polId}`,
            district,
            state,
          });
          logger.info(
            `Posted social incumbents event (removed) for ${state}-${district}`
          );
        } catch (postErr) {
          logger.error('Failed to post social incumbents event:', postErr);
        }

        // Find users with active Celebrations for this incumbent
        const celebrationUsers = await getUsersWithActiveCelebration(polId);
        logger.info(
          `Found ${celebrationUsers.length} users with active celebrations for dropped-out incumbent ${polId}`
        );

        try {
          await sendSMS(
            `Incumbent dropped out in ${state}-${district}. ${celebrationUsers.length} celebrations defuncted.`
          );
          logger.info('Alert SMS sent');
        } catch (err) {
          logger.error('Failed to send SMS alert:', err);
        }

        if (!celebrationUsers.length) {
          logger.info(
            `No active celebrations found for ${polId}, skipping processing`
          );
          continue;
        }

        // Process each user's Celebrations
        for (const user of celebrationUsers) {
          try {
            // Find active Celebrations for this user and incumbent
            const activeCelebrations = await Celebration.find({
              'donee.roles.fec_candidate_id': polId,
              donatedBy: user._id,
              resolved: false,
              defunct: false,
              paused: false,
              idempotencyKey: { $not: /^seed:/ },
            });

            if (!activeCelebrations.length) {
              continue;
            }

            // Convert each Celebration to defunct
            for (const celebration of activeCelebrations) {
              try {
                // Make Celebration defunct
                await StatusService.makeDefunct(
                  celebration,
                  'Incumbent is no longer seeking re-election',
                  {},
                  {
                    triggeredBy: 'incumbent_dropout',
                    triggeredByName: 'Incumbent Dropout',
                    metadata: {
                      incumbent_id: polId,
                      state,
                      district,
                    },
                  },
                  Celebration
                );

                logger.debug(
                  `Converted celebration ${celebration._id} to defunct`
                );
              } catch (error) {
                logger.error(
                  `Error converting celebration ${celebration._id}:`,
                  error
                );
              }
            }
          } catch (error) {
            logger.error(
              `Error processing Celebrations for user ${user._id}:`,
              error
            );
          }
        }

        // Filter out users unsubscribed from district updates
        const subscribedUsers = await filterUnsubscribed(
          celebrationUsers,
          EMAIL_TOPICS.districtUpdates
        );

        // Send email notifications
        for (const user of subscribedUsers) {
          const recipient = (user.email || user.username || '').trim();
          if (!recipient) {
            logger.warn(
              `Skipped email for user ${user._id} - no valid email or username`
            );
            continue;
          }

          try {
            const emailData = IncumbentDroppedOut(
              user.first_name || user.firstName,
              state,
              district,
              polDoc.name
            );
            await sendEmail(
              recipient,
              emailData[1], // subject
              emailData[2] // html
            );
          } catch (err) {
            logger.error(
              `Failed to send IncumbentDroppedOut email to ${recipient}:`,
              err
            );
          }
        }
      } catch (err) {
        logger.error(
          `Failed processing for incumbent dropout ${polId}: ${err.message}`
        );
      }
    }

    // Process newly added incumbents (now running this cycle) for social announcements
    for (const change of addedIncumbents) {
      const polId = change.key;
      try {
        const polDoc = await Pol.findOne({
          'roles.fec_candidate_id': polId,
        });
        if (!polDoc) {
          logger.warn(`Pol not found for newly added incumbent ${polId}`);
          continue;
        }
        const { state, district } =
          polDoc.roles.find((r) => r.fec_candidate_id === polId) || {};
        if (!state || !district) {
          logger.warn(
            `Missing state/district for newly added incumbent ${polId}`
          );
          continue;
        }

        logger.info(
          `Processing newly added incumbent: ${polId} (${state}-${district})`
        );

        try {
          const polFullName = [
            polDoc.first_name,
            polDoc.middle_name,
            polDoc.last_name,
          ]
            .filter(Boolean)
            .join(' ');
          const polName = fixPolName(polFullName || polDoc.name);
          await postToSocial({
            polName,
            eventType: 'incumbents',
            action: 'added',
            handles: {
              bluesky: polDoc.bluesky_account || '',
              twitter: polDoc.twitter_account || '',
              youtube: polDoc.youtube_account || '',
              facebook: polDoc.facebook_account || '',
              mastodon: polDoc.mastodon_account || '',
              truth: polDoc.truth_social_account || '',
              instagram: polDoc.instagram_account || '',
            },
            dedupeKey: `incumbent:${polId}`,
            district,
            state,
          });
          logger.info(
            `Posted social incumbents event (added) for ${state}-${district}`
          );
        } catch (postErr) {
          logger.error(
            'Failed to post social incumbents added event:',
            postErr
          );
        }
      } catch (err) {
        logger.error(
          `Failed processing for newly added incumbent ${polId}: ${err.message}`
        );
      }
    }

    // Snapshot is already saved by diffSnapshot above, so we only update in-memory state
    snapshot = polsArray;
  }

  cron.schedule(
    POLL_SCHEDULE,
    () => {
      logger.info('cron tick - checking challengers');
      runCheck(logger, checkChallengers);
    },
    { timezone: 'America/New_York' } // Eastern Time (Washington DC timezone)
  );

  const initialRun = runCheck(logger, checkChallengers);
  initialRun.catch((err) => logger.error(err));
  return initialRun;
};
