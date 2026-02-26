/**
 * @fileoverview Key model schema for MongoDB
 *
 * This module defines the Key schema, which represents API keys used for
 * external service integrations. Keys are stored with usage tracking to
 * monitor API consumption and rate limiting.
 *
 * KEY FIELDS
 *
 * IDENTIFICATION
 * - name: Key name/identifier (unique, indexed, lowercase)
 * - value: Actual API key value (unique, indexed, case-sensitive)
 *
 * USAGE TRACKING
 * - hitCounts: Array tracking API key usage per user
 *   - hits: Number of API calls made
 *   - user: Reference to User who made the calls
 *
 * RELATIONSHIPS
 * - References: User (hitCounts[].user field)
 * - Referenced by: None (standalone key storage)
 *
 * BUSINESS RULES
 * - Key names are stored lowercase for consistency
 * - Key values are case-sensitive and unique
 * - Usage tracking allows monitoring of API consumption per user
 * - Used for rate limiting and API quota management
 *
 * @module models/Key
 * @requires mongoose
 */

const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const keySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      index: { unique: true },
    },
    value: {
      type: String,
      require: true,
      lowercase: false,
      index: { unique: true },
    },
    hitCounts: {
      type: Array,
      hitCount: [
        {
          hits: { type: Number },
          user: { type: Schema.Types.ObjectId, ref: 'User' },
        },
      ],
    },
  },
  { timestamps: true }
);

const Key = mongoose.model('Key', keySchema);

module.exports = Key;
