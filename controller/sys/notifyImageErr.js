/**
 * @fileoverview Image error notification controller
 *
 * Reports client-side pfp load failures (bioguide) to admins with throttling:
 * skips email when the WebP already exists on disk, and dedupes alerts per
 * bioguide within a 24h window using `PfpImageErrorAlert`.
 *
 * @module controller/sys/notifyImageErr
 */

const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const mongoose = require('mongoose');

const { emails } = require('../comms/emails');
const { sendEmail } = require('../comms');
const { requireLogger } = require('../../services/logger');
const { getResolvedPfpOutDir } = require('../../services/utils/pfpOutDir');
const { PfpImageErrorAlert } = require('../../models');

const logger = requireLogger(__filename);

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../.env.local'),
  });
}

const FIRST_CITIZEN = process.env.EMAIL_JONATHAN_USER;

/** Duplicate image-error emails for the same bioguide are suppressed within this window. */
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const BIOGUIDE_RE = /^[A-Z]\d{6}$/;

/**
 * @param {string} raw
 * @returns {string|null} Uppercase bioguide or null if invalid
 */
function normalizePolId(raw) {
  const s = String(raw || '')
    .trim()
    .toUpperCase();
  if (!BIOGUIDE_RE.test(s)) {
    return null;
  }
  return s;
}

/**
 * @param {string} polId
 * @param {string} pfpDir
 * @returns {Promise<boolean>}
 */
async function servedWebpExists(polId, pfpDir) {
  try {
    const st = await fsp.stat(path.join(pfpDir, `${polId}.webp`));
    return st.size > 0;
  } catch {
    return false;
  }
}

module.exports = {
  /**
   * Sends image error notification to administrator when appropriate.
   *
   * @param {Object} req - Express request
   * @param {Object} req.body
   * @param {string} req.body.pol - Bioguide ID (validated by Joi)
   * @param {Object} res - Express response
   * @returns {Promise<void>}
   */
  notifyImageErr: async (req, res, next) => {
    try {
      const polId = normalizePolId(req.body.pol);
      if (!polId) {
        logger.warn(
          'notifyImageErr: invalid or missing pol id after normalize',
          {
            raw: req.body.pol,
          }
        );
        res.json(true);
        return;
      }

      const pfpDir = getResolvedPfpOutDir();

      if (await servedWebpExists(polId, pfpDir)) {
        logger.info(
          'notifyImageErr: suppressed (webp already exists on disk)',
          {
            polId,
            pfpDir,
          }
        );
        res.json(true);
        return;
      }

      const dbReady = mongoose.connection.readyState === 1;
      if (dbReady) {
        const prior = await PfpImageErrorAlert.findOne({ polId })
          .select('lastSentAt')
          .lean()
          .exec();
        if (
          prior?.lastSentAt &&
          Date.now() - new Date(prior.lastSentAt).getTime() < ALERT_COOLDOWN_MS
        ) {
          logger.info('notifyImageErr: suppressed (cooldown)', {
            polId,
            lastSentAt: prior.lastSentAt,
          });
          res.json(true);
          return;
        }
      } else {
        logger.warn(
          'notifyImageErr: MongoDB not connected; skipping cooldown dedupe'
        );
      }

      if (!FIRST_CITIZEN) {
        logger.warn('notifyImageErr: EMAIL_JONATHAN_USER not set; skip send');
        res.json(true);
        return;
      }

      await sendEmail(FIRST_CITIZEN, emails.Image, polId);

      if (dbReady) {
        try {
          await PfpImageErrorAlert.findOneAndUpdate(
            { polId },
            { $set: { lastSentAt: new Date() } },
            { upsert: true, new: true }
          );
        } catch (persistErr) {
          logger.error('notifyImageErr: failed to persist alert cooldown row', {
            polId,
            error: persistErr.message,
          });
        }
      }

      res.json(true);
    } catch (err) {
      next(err);
    }
  },
};
