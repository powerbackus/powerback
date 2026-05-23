/**
 * @fileoverview Rally email subscriber create, confirm, and unsubscribe.
 * @module controller/rallySubscribers
 *
 * EXPORTS: createRallySubscriber, confirmRallySubscriber, unsubscribeRallySubscriber
 * Privacy: do not log plaintext tokens or full email addresses in info logs.
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

const GENERIC_SUCCESS_MESSAGE =
  'If this address is eligible, you will receive a confirmation email shortly.';

const TOKEN_SECRET_BYTES = 24;
const PUBLIC_CODE_PATTERN = /^[A-Za-z0-9_-]{10,24}$/;
const TOKEN_PATTERN = /^[a-f0-9]{24}\.[A-Za-z0-9_-]{32,64}$/;

/**
 * @returns {string}
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
 * @param {string} email
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
 * @param {import('mongoose').Types.ObjectId | string} subscriberId
 * @returns {Promise<string>} Plaintext token for email (once)
 */
async function buildTokenForSubscriber(subscriberId) {
  const secret = crypto.randomBytes(TOKEN_SECRET_BYTES).toString('base64url');
  return `${subscriberId.toString()}.${secret}`;
}

/**
 * @param {string} token
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
 * @param {string} token
 * @param {string | undefined} hash
 * @returns {Promise<boolean>}
 */
async function tokenMatchesHash(token, hash) {
  if (!hash) {
    return false;
  }
  return bcrypt.compare(token, hash);
}

/**
 * @param {import('mongoose').Document} doc
 * @param {string | undefined} sourcePublicCode
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
 * @param {import('mongoose').Document} doc
 * @returns {Promise<string>} Confirmation plaintext token
 */
async function setConfirmToken(doc) {
  const token = await buildTokenForSubscriber(doc._id);
  doc.confirm_token_hash = await bcrypt.hash(token, SERVER.SALT_WORK_FACTOR);
  return token;
}

/**
 * @param {import('mongoose').Document} doc
 * @returns {Promise<string>} Unsubscribe plaintext token (new or existing hash kept)
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
 * @param {string} toEmail
 * @param {string} confirmToken
 */
async function sendConfirmationEmail(toEmail, confirmToken) {
  const uriRoot = getAppRootUrl();
  await sendEmail(toEmail, emails.RallyConfirm, confirmToken, uriRoot);
  logger.info('Rally confirmation email queued', {
    emailNormalizedLength: toEmail.trim().toLowerCase().length,
  });
}

/**
 * POST /api/rally-subscribers — create or refresh pending; generic success always.
 *
 * @param {{ email: string, source_public_code?: string }} body
 * @returns {Promise<{ message: string }>}
 */
async function createRallySubscriber(body) {
  const { email, source_public_code: sourcePublicCode } = body;
  const { email: trimmedEmail, email_normalized } = normalizeEmail(email);

  let existing = await RallySubscriber.findOne({ email_normalized }).exec();

  if (!existing) {
    const doc = new RallySubscriber({
      email: trimmedEmail,
      email_normalized,
      status: 'pending',
      source: 'rally',
      created_at: new Date(),
    });
    applySourcePublicCode(doc, sourcePublicCode);
    const confirmToken = await setConfirmToken(doc);
    await doc.save();
    try {
      await sendConfirmationEmail(trimmedEmail, confirmToken);
    } catch (error) {
      logger.warn('Rally confirmation email failed', {
        error: error.message,
      });
    }
    return { message: GENERIC_SUCCESS_MESSAGE };
  }

  if (existing.status === 'subscribed' || existing.status === 'unsubscribed') {
    return { message: GENERIC_SUCCESS_MESSAGE };
  }

  if (existing.status === 'pending') {
    applySourcePublicCode(existing, sourcePublicCode);
    const confirmToken = await setConfirmToken(existing);
    await existing.save();
    try {
      await sendConfirmationEmail(existing.email, confirmToken);
    } catch (error) {
      logger.warn('Rally confirmation email resend failed', {
        error: error.message,
      });
    }
  }

  return { message: GENERIC_SUCCESS_MESSAGE };
}

/**
 * GET /api/rally-subscribers/confirm/:token
 *
 * @param {string} token
 * @returns {Promise<{ confirmed: boolean, message: string }>}
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
      message:
        'You are already subscribed to POWERBACK movement updates. Thank you.',
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
      'You are subscribed to POWERBACK movement updates. You can unsubscribe from any future email.',
    unsubscribeUrl,
  };
}

/**
 * POST /api/rally-subscribers/unsubscribe/:token
 *
 * @param {string} token
 * @returns {Promise<{ unsubscribed: boolean, message: string }>}
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
      message: 'You are already unsubscribed from POWERBACK movement updates.',
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
    message: 'You have been unsubscribed from POWERBACK movement updates.',
  };
}

module.exports = {
  createRallySubscriber,
  confirmRallySubscriber,
  unsubscribeRallySubscriber,
  GENERIC_SUCCESS_MESSAGE,
};
