/**
 * @fileoverview Share link create, visit, and signup attribution for Rally anonymous links.
 * @module controller/shareLinks
 *
 * EXPORTS: createShareLink, recordShareLinkVisit, attributeShareLinkReferral
 * Privacy: do not log plaintext claim codes; attribution logs publicCodeLength only.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { ShareLink } = require('../../models');
const { SERVER } = require('../../constants');
const { requireLogger } = require('../../services/logger');

const logger = requireLogger(__filename);

const PUBLIC_CODE_BYTES = 9;
const CLAIM_CODE_BYTES = 24;
const PUBLIC_CODE_PATTERN = /^[A-Za-z0-9_-]{10,24}$/;

/**
 * Base URL for public share links (no trailing slash).
 * @returns {string}
 */
function getShareBaseUrl() {
  const base =
    process.env.PROD_URL ||
    process.env.REACT_APP_PROD_URL ||
    'https://powerback.us';
  return base.replace(/\/$/, '');
}

/**
 * @returns {Promise<string>}
 */
async function generateUniquePublicCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = crypto.randomBytes(PUBLIC_CODE_BYTES).toString('base64url');
    const existing = await ShareLink.findOne({ public_code: code })
      .select('_id')
      .lean()
      .exec();
    if (!existing) {
      return code;
    }
  }
  throw new Error('Unable to generate unique share link code');
}

/**
 * Create anonymous share link; returns one-time claim code plaintext.
 *
 * @returns {Promise<{ publicCode: string, shareUrl: string, claimCode: string }>}
 * @throws {Error} When unique public_code cannot be generated
 */
async function createShareLink() {
  const publicCode = await generateUniquePublicCode();
  const claimCode = crypto.randomBytes(CLAIM_CODE_BYTES).toString('base64url');
  const claimCodeHash = await bcrypt.hash(claimCode, SERVER.SALT_WORK_FACTOR);

  await ShareLink.create({
    public_code: publicCode,
    claim_code_hash: claimCodeHash,
    visit_count: 0,
    referred_users: [],
  });

  const shareUrl = `${getShareBaseUrl()}/?share=${publicCode}`;

  logger.info('Share link created', { publicCodeLength: publicCode.length });

  return {
    publicCode,
    shareUrl,
    claimCode,
  };
}

/**
 * Record a visit for a public share code (increments visit_count, sets visit timestamps).
 *
 * @param {string} publicCode - From ?share= query or route param
 * @returns {Promise<{ publicCode: string, visitCount: number }>}
 * @throws {Error} 404 when code missing or invalid pattern
 */
async function recordShareLinkVisit(publicCode) {
  if (!PUBLIC_CODE_PATTERN.test(publicCode)) {
    const err = new Error('Share link not found');
    err.status = 404;
    throw err;
  }

  const doc = await ShareLink.findOne({ public_code: publicCode }).exec();

  if (!doc) {
    const err = new Error('Share link not found');
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const update = {
    $inc: { visit_count: 1 },
    $set: { last_visit_at: now },
  };

  if (!doc.first_visit_at) {
    update.$set.first_visit_at = now;
  }

  await ShareLink.updateOne({ public_code: publicCode }, update).exec();

  const visitCount = (doc.visit_count || 0) + 1;

  return {
    publicCode,
    visitCount,
  };
}

/**
 * Append a new User to ShareLink.referred_users (best-effort, idempotent via $addToSet).
 * Called from account activation when Applicant.ref_share_code is set.
 *
 * @param {string} publicCode - Inbound referral code (not claim code)
 * @param {import('mongoose').Types.ObjectId} userId - Newly activated User _id
 * @returns {Promise<boolean>} Whether a matching ShareLink was updated
 */
async function attributeShareLinkReferral(publicCode, userId) {
  if (!PUBLIC_CODE_PATTERN.test(publicCode) || !userId) {
    return false;
  }

  try {
    const result = await ShareLink.updateOne(
      { public_code: publicCode },
      { $addToSet: { referred_users: userId } }
    ).exec();

    if (result.matchedCount === 0) {
      return false;
    }

    logger.info('Share link referral attributed', {
      publicCodeLength: publicCode.length,
    });
    return true;
  } catch (error) {
    logger.warn('Share link referral attribution failed', {
      publicCodeLength: publicCode.length,
      error: error.message,
    });
    return false;
  }
}

module.exports = {
  createShareLink,
  recordShareLinkVisit,
  attributeShareLinkReferral,
};
