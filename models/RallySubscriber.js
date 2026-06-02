/**
 * @fileoverview Rally email subscriber model (double opt-in, unsubscribe).
 * @module models/RallySubscriber
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const STATUS = ['pending', 'subscribed', 'unsubscribed'];

/**
 * RallySubscriber schema — movement email list from Rally page (v1).
 *
 * No IP/UA/referrer metadata. Token fields store bcrypt hashes only.
 *
 * @property {String} email - As submitted (trimmed)
 * @property {String} email_normalized - Unique; lowercase trimmed dedupe key
 * @property {String} status - pending | subscribed | unsubscribed
 * @property {String} source - v1: rally
 * @property {String} [source_public_code] - Inbound share code at signup
 * @property {String} [confirm_token_hash] - bcrypt; cleared after confirm
 * @property {String} [unsubscribe_token_hash] - bcrypt; set on confirm
 * @property {Date} created_at - First capture
 * @property {Date} [confirmed_at] - When status became subscribed
 * @property {Date} [unsubscribed_at] - When status became unsubscribed
 * @property {Date} [last_email_sent_at] - Last confirmation email queued (resend cooldown)
 */
const RallySubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    email_normalized: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: STATUS,
      default: 'pending',
    },
    source: {
      type: String,
      required: true,
      default: 'rally',
    },
    source_public_code: {
      type: String,
    },
    confirm_token_hash: {
      type: String,
    },
    unsubscribe_token_hash: {
      type: String,
    },
    created_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    confirmed_at: {
      type: Date,
    },
    unsubscribed_at: {
      type: Date,
    },
    last_email_sent_at: {
      type: Date,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('RallySubscriber', RallySubscriberSchema);
