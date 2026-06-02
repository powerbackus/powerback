/**
 * @fileoverview Rally movement email subscribers — create, confirm, unsubscribe.
 *
 * Double opt-in: POST creates `pending` row + confirmation email; GET confirm
 * promotes to `subscribed` and issues unsubscribe token. Unsubscribe is
 * one-click via hashed token in email links.
 *
 * EXPORTS: createRallySubscriber, confirmRallySubscriber, unsubscribeRallySubscriber
 *
 * FLOW
 * 1. create — generic HTTP success always; confirmation email only when eligible
 * 2. confirm — verify token, set subscribed, clear confirm hash, set unsubscribe hash
 * 3. unsubscribe — verify token, set unsubscribed
 *
 * Privacy: do not log plaintext tokens or full email addresses in info logs.
 *
 * @module controller/rallySubscribers
 * @requires ../../models/RallySubscriber
 * @requires ../comms/emails
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { RallySubscriber } = require('../../models');
const { SERVER } = require('../../constants');
const { emails } = require('../comms/emails');
const { sendEmail } = require('../comms');
const { requireLogger } = require('../../services/logger');

const logger = requireLogger(__filename);

/** Same copy for every create outcome so callers cannot infer whether email exists. */
const GENERIC_SUCCESS_MESSAGE =
  'If this address is eligible, you will receive a confirmation email shortly.';

/** Min interval before resending confirmation to an existing pending address. */
const PENDING_CONFIRM_RESEND_COOLDOWN_MS =
  parseInt(process.env.RALLY_SUBSCRIBER_RESEND_COOLDOWN_MS, 10) ||
  15 * 60 * 1000;

/** Min interval before an unsubscribed address may restart double opt-in. */
const UNSUBSCRIBED_REACTIVATION_COOLDOWN_MS =
  parseInt(process.env.RALLY_SUBSCRIBER_REACTIVATION_COOLDOWN_MS, 10) ||
  24 * 60 * 60 * 1000;

/** Entropy for the secret segment of `{ObjectId}.{secret}` link tokens. */
const TOKEN_SECRET_BYTES = 24;

/** Inbound share attribution from Rally generate flow (pb:refShareCode / source_public_code). */
const PUBLIC_CODE_PATTERN = /^[A-Za-z0-9_-]{10,24}$/;

/** `{24-hex ObjectId}.{base64url secret}` — matches confirm/unsub URL segments. */
const TOKEN_PATTERN = /^[a-f0-9]{24}\.[A-Za-z0-9_-]{32,64}$/;

/**
 * App origin for confirmation/unsubscribe links in outbound email.
 *
 * @returns {string} Origin without trailing slash
 */
function getAppRootUrl() {
  return (
    process.env.ORIGIN ??
    (process.env.NODE_ENV === 'production'
      ? process.env.PROD_URL
      : process.env.DEV_URL) ??
    'https://powerback.us'
  ).replace(/\/$/, '');
}

/**
 * Trim display email and derive normalized lookup key.
 *
 * @param {string} email - Raw address from request body
 * @returns {{ email: string, email_normalized: string }}
 */
function normalizeEmail(email) {
  const trimmed = email.trim();
  return {
    email: trimmed,
    email_normalized: trimmed.toLowerCase(),
  };
}

/**
 * Build a one-time plaintext link token; only the bcrypt hash is persisted.
 *
 * @param {import('mongoose').Types.ObjectId | string} subscriberId
 * @returns {Promise<string>} Plaintext token for email (shown once)
 */
async function buildTokenForSubscriber(subscriberId) {
  const secret = crypto.randomBytes(TOKEN_SECRET_BYTES).toString('base64url');
  return `${subscriberId.toString()}.${secret}`;
}

/**
 * Parse and validate link token shape before DB lookup.
 *
 * @param {string} token - Path segment from confirm/unsub route
 * @returns {{ subscriberId: string, valid: boolean }}
 */
function parseToken(token) {
  if (!TOKEN_PATTERN.test(token)) {
    return { subscriberId: '', valid: false };
  }
  const dot = token.indexOf('.');
  const subscriberId = token.slice(0, dot);
  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    return { subscriberId: '', valid: false };
  }
  return { subscriberId, valid: true };
}

/**
 * Compare plaintext link token to stored bcrypt hash.
 *
 * @param {string} token - Plaintext from URL
 * @param {string | undefined} hash - Stored hash on subscriber doc
 * @returns {Promise<boolean>}
 */
async function tokenMatchesHash(token, hash) {
  if (!hash) {
    return false;
  }
  return bcrypt.compare(token, hash);
}

/**
 * Set inbound share attribution once (first touch wins; never overwrite).
 *
 * @param {import('mongoose').Document} doc - RallySubscriber document
 * @param {string | undefined} sourcePublicCode - Optional share public code from Rally
 */
function applySourcePublicCode(doc, sourcePublicCode) {
  if (
    sourcePublicCode &&
    PUBLIC_CODE_PATTERN.test(sourcePublicCode) &&
    !doc.source_public_code
  ) {
    doc.source_public_code = sourcePublicCode;
  }
}

/**
 * Rotate confirmation token on (re)signup while still pending.
 *
 * @param {import('mongoose').Document} doc - RallySubscriber document
 * @returns {Promise<string>} Plaintext confirmation token for email
 */
async function setConfirmToken(doc) {
  const token = await buildTokenForSubscriber(doc._id);
  doc.confirm_token_hash = await bcrypt.hash(token, SERVER.SALT_WORK_FACTOR);
  return token;
}

/**
 * Issue unsubscribe token after successful confirm (or on re-confirm path).
 *
 * @param {import('mongoose').Document} doc - RallySubscriber document
 * @returns {Promise<string>} Plaintext unsubscribe token for client URL
 */
async function setUnsubscribeToken(doc) {
  const token = await buildTokenForSubscriber(doc._id);
  doc.unsubscribe_token_hash = await bcrypt.hash(
    token,
    SERVER.SALT_WORK_FACTOR
  );
  return token;
}

/**
 * Queue Rally double opt-in email via comms layer.
 *
 * @param {string} toEmail - Recipient (not logged at info level)
 * @param {string} confirmToken - Plaintext token embedded in magic link
 * @returns {Promise<void>}
 */
async function sendConfirmationEmail(toEmail, confirmToken) {
  const uriRoot = getAppRootUrl();
  await sendEmail(toEmail, emails.RallyConfirm, confirmToken, uriRoot);
  logger.info('Rally confirmation email queued', {
    emailNormalizedLength: toEmail.trim().toLowerCase().length,
  });
}

/**
 * Whether enough time has passed since the last confirmation email to send again.
 *
 * @param {Date | undefined} lastSentAt - Prior send timestamp on subscriber doc
 * @param {number} cooldownMs - Required quiet period in milliseconds
 * @returns {boolean}
 */
function isEmailCooldownElapsed(lastSentAt, cooldownMs) {
  if (!lastSentAt) {
    return true;
  }
  return Date.now() - new Date(lastSentAt).getTime() >= cooldownMs;
}

/**
 * Rotate confirm token, persist, send confirmation email, and record send time.
 *
 * @param {import('mongoose').Document} doc - RallySubscriber document
 * @param {string} toEmail - Recipient address
 * @returns {Promise<void>}
 */
async function queueConfirmationEmail(doc, toEmail) {
  const confirmToken = await setConfirmToken(doc);
  await doc.save();
  try {
    await sendConfirmationEmail(toEmail, confirmToken);
    doc.last_email_sent_at = new Date();
    await doc.save();
  } catch (error) {
    logger.warn('Rally confirmation email failed', {
      error: error.message,
    });
  }
}

/**
 * POST /api/rally-subscribers — create or refresh pending; generic success always.
 *
 * Never reveals whether the address is new, pending, subscribed, or unsubscribed.
 * Sends confirmation only for: new pending, pending past resend cooldown, or
 * unsubscribed past reactivation cooldown. Never emails already subscribed rows.
 *
 * @param {{ email: string, source_public_code?: string }} body
 * @returns {Promise<{ message: string }>}
 */
async function createRallySubscriber(body) {
  const { email, source_public_code: sourcePublicCode } = body;
  const { email: trimmedEmail, email_normalized } = normalizeEmail(email);

  const existing = await RallySubscriber.findOne({ email_normalized }).exec();

  if (!existing) {
    const doc = new RallySubscriber({
      email: trimmedEmail,
      email_normalized,
      status: 'pending',
      source: 'rally',
      created_at: new Date(),
    });
    applySourcePublicCode(doc, sourcePublicCode);
    await queueConfirmationEmail(doc, trimmedEmail);
    return { message: GENERIC_SUCCESS_MESSAGE };
  }

  if (existing.status === 'subscribed') {
    return { message: GENERIC_SUCCESS_MESSAGE };
  }

  if (existing.status === 'pending') {
    if (
      !isEmailCooldownElapsed(
        existing.last_email_sent_at,
        PENDING_CONFIRM_RESEND_COOLDOWN_MS
      )
    ) {
      return { message: GENERIC_SUCCESS_MESSAGE };
    }
    applySourcePublicCode(existing, sourcePublicCode);
    await queueConfirmationEmail(existing, existing.email);
    return { message: GENERIC_SUCCESS_MESSAGE };
  }

  if (existing.status === 'unsubscribed') {
    if (
      !isEmailCooldownElapsed(
        existing.unsubscribed_at || existing.last_email_sent_at,
        UNSUBSCRIBED_REACTIVATION_COOLDOWN_MS
      )
    ) {
      return { message: GENERIC_SUCCESS_MESSAGE };
    }
    existing.status = 'pending';
    existing.set('unsubscribe_token_hash', undefined);
    existing.set('confirmed_at', undefined);
    existing.set('unsubscribed_at', undefined);
    applySourcePublicCode(existing, sourcePublicCode);
    await queueConfirmationEmail(existing, existing.email);
    return { message: GENERIC_SUCCESS_MESSAGE };
  }

  return { message: GENERIC_SUCCESS_MESSAGE };
}

/**
 * GET /api/rally-subscribers/confirm/:token — complete double opt-in.
 *
 * Invalid shape, wrong hash, missing doc, or unsubscribed → 404 (uniform error).
 * Already subscribed → 200 idempotent success without re-issuing tokens.
 *
 * @param {string} token - Confirmation token from email link
 * @returns {Promise<{ confirmed: boolean, message: string, unsubscribeUrl?: string }>}
 * @throws {Error} 404 when token or subscriber state is not confirmable
 */
async function confirmRallySubscriber(token) {
  const { subscriberId, valid } = parseToken(token);
  if (!valid) {
    const err = new Error('Invalid or expired confirmation link');
    err.status = 404;
    throw err;
  }

  const doc = await RallySubscriber.findById(subscriberId).exec();
  if (!doc) {
    const err = new Error('Invalid or expired confirmation link');
    err.status = 404;
    throw err;
  }

  if (doc.status === 'subscribed') {
    return {
      confirmed: true,
      message: 'You are already subscribed to POWERBACK updates. Thank you.',
    };
  }

  if (doc.status === 'unsubscribed') {
    const err = new Error('Invalid or expired confirmation link');
    err.status = 404;
    throw err;
  }

  const matches = await tokenMatchesHash(token, doc.confirm_token_hash);
  if (!matches) {
    const err = new Error('Invalid or expired confirmation link');
    err.status = 404;
    throw err;
  }

  doc.status = 'subscribed';
  doc.confirmed_at = new Date();
  doc.set('confirm_token_hash', undefined);
  const unsubToken = await setUnsubscribeToken(doc);
  await doc.save();

  const uriRoot = getAppRootUrl();
  const unsubscribeUrl = `${uriRoot}/rally-unsubscribe/${unsubToken}`;

  return {
    confirmed: true,
    message:
      'You are subscribed to POWERBACK updates. You can unsubscribe from any future email.',
    unsubscribeUrl,
  };
}

/**
 * POST /api/rally-subscribers/unsubscribe/:token — one-click movement email opt-out.
 *
 * @param {string} token - Unsubscribe token from confirmation success or future emails
 * @returns {Promise<{ unsubscribed: boolean, message: string }>}
 * @throws {Error} 404 when token or hash does not match
 */
async function unsubscribeRallySubscriber(token) {
  const { subscriberId, valid } = parseToken(token);
  if (!valid) {
    const err = new Error('Invalid unsubscribe link');
    err.status = 404;
    throw err;
  }

  const doc = await RallySubscriber.findById(subscriberId).exec();
  if (!doc) {
    const err = new Error('Invalid unsubscribe link');
    err.status = 404;
    throw err;
  }

  if (doc.status === 'unsubscribed') {
    return {
      unsubscribed: true,
      message: 'You are already unsubscribed from POWERBACK updates.',
    };
  }

  const matches = await tokenMatchesHash(token, doc.unsubscribe_token_hash);
  if (!matches) {
    const err = new Error('Invalid unsubscribe link');
    err.status = 404;
    throw err;
  }

  doc.status = 'unsubscribed';
  doc.unsubscribed_at = new Date();
  await doc.save();

  return {
    unsubscribed: true,
    message: 'You have been unsubscribed from POWERBACK updates.',
  };
}

module.exports = {
  createRallySubscriber,
  confirmRallySubscriber,
  unsubscribeRallySubscriber,
  GENERIC_SUCCESS_MESSAGE,
};
