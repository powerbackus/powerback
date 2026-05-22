/**
 * @fileoverview Anonymous share link model for Rally referral tracking.
 * @module models/ShareLink
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * ShareLink schema — anonymous referral links (Rally v1).
 *
 * Visit analytics use aggregate counters only (no per-visit documents or IP).
 * Signup attribution appends User ids to referred_users; no User.referred_by_share_link.
 *
 * @property {String} public_code - URL-safe code in /?share={publicCode}
 * @property {String} claim_code_hash - bcrypt hash; plaintext shown once on create
 * @property {Number} visit_count - Inbound opens recorded via GET visit API
 * @property {Date} [first_visit_at] - First successful visit timestamp
 * @property {Date} [last_visit_at] - Most recent visit timestamp
 * @property {ObjectId[]} referred_users - Users attributed at activation ($addToSet)
 * @property {ObjectId} [claimed_by_user] - Deferred: claim-code redemption
 * @property {Date} [claimed_at] - Deferred: claim-code redemption
 */
const ShareLinkSchema = new Schema(
  {
    public_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    claim_code_hash: {
      type: String,
      required: true,
    },
    visit_count: {
      type: Number,
      required: true,
      default: 0,
    },
    first_visit_at: {
      type: Date,
    },
    last_visit_at: {
      type: Date,
    },
    referred_users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    claimed_by_user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    claimed_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ShareLink', ShareLinkSchema);
