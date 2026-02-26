/**
 * @fileoverview Celebration model schema for MongoDB
 *
 * This module defines the Celebration schema, which represents an escrowed
 * donation (pledge) in the POWERBACK application. Celebrations are donations
 * that are held in escrow until specific conditions are met (e.g., a bill is
 * brought to the House floor for a vote).
 *
 * KEY CONCEPTS
 *
 * ESCROW SYSTEM
 * Celebrations are escrowed donations that remain in "active" status until
 * the associated bill meets its trigger condition (e.g., Medicare For All
 * brought to House floor). Funds are only charged and released when the
 * celebration is "resolved".
 *
 * STATUS LIFECYCLE
 * - active: Default status when created, awaiting trigger condition
 * - paused: Temporarily paused (e.g., bill status change)
 * - resolved: Trigger condition met, funds charged and released to politician
 * - defunct: Celebration expired or cancelled, funds never move to the campaign
 *
 * KEY FIELDS
 *
 * PAYMENT PROCESSING
 * - fee: Stripe processing fee calculated at creation
 * - payment_intent: Stripe payment intent ID (created but not charged)
 * - charge_id: Stripe charge ID (set only after payment succeeds on resolve)
 *
 * STATUS MANAGEMENT
 * - resolved, paused, defunct: Legacy boolean flags for status
 * - current_status: Current status enum ('active', 'paused', 'resolved', 'defunct')
 * - status_ledger: Detailed audit trail of all status changes with metadata
 *
 * DONATION DETAILS
 * - donation: Donation amount in dollars
 * - tip: PAC tip amount (separate from donation, has $5,000 annual limit)
 * - pol_id: Politician receiving the donation
 * - pol_name: Politician name (cached for receipts)
 * - FEC_id: FEC candidate ID for compliance
 * - bill_id: Bill ID that triggers resolution (e.g., 'hjres54-119')
 *
 * DONOR INFORMATION
 * - donatedBy: Reference to User who made the donation
 * - donorInfo: Snapshot of donor information at time of donation for FEC
 *   compliance and audit purposes. Includes:
 *   - Basic identification (firstName, lastName)
 *   - Address information (address, city, state, zip, country, passport)
 *   - Employment information (isEmployed, occupation, employer)
 *   - Compliance tier at donation time
 *   - Validation flags from donor validation system
 *
 * IDEMPOTENCY
 * - idempotencyKey: Unique key to prevent duplicate donations
 *
 * COMPLEX FIELDS
 *
 * status_ledger: Array of status change records providing complete audit trail
 *   - Status change details (previous_status, new_status, change_datetime, reason)
 *   - Trigger information (triggered_by, triggered_by_id, triggered_by_name)
 *   - Metadata for specific status types:
 *     * congressional_session: Session info for defunct celebrations
 *     * resolution_details: Bill action details for resolved celebrations
 *     * pause_details: Pause reason and expected resume date
 *   - Compliance tracking (compliance_tier_at_time, fec_compliant)
 *   - Audit trail (ip_address, user_agent, session_id)
 *
 * donorInfo.validationFlags: Donor validation results captured at donation time
 *   - isFlagged: Boolean indicating if donor info was flagged
 *   - summary: Overall validation summary (totalFlags)
 *   - flags: Array of detailed flag information (field, reason, match, originalValue)
 *   - validatedAt: Timestamp of validation
 *   - validationVersion: Version of validation rules used
 *
 * RELATIONSHIPS
 * - References: User (donatedBy field)
 *
 * BUSINESS RULES
 * - Celebrations are created with payment_intent but not charged until resolved
 * - charge_id is only set after successful payment on resolution
 * - Status changes must be recorded in status_ledger for audit compliance
 * - donorInfo is immutable snapshot captured at donation creation time
 * - FEC compliance validation occurs before celebration creation
 *
 * @module models/Celebration
 * @requires mongoose
 */

const mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  { CELEBRATION_STATUSES } = require('../shared/celebrationStatus');

const celebrationSchema = new Schema(
  {
    fee: {
      type: Number,
      required: true,
    },
    payment_intent: {
      type: String,
    },
    charge_id: {
      type: String,
      required: false, // set only after payment succeeds
      default: null,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    paused: {
      type: Boolean,
      default: false,
    },
    defunct: {
      type: Boolean,
      default: false,
    },
    defunct_date: {
      type: Date,
    },
    defunct_reason: {
      type: String,
    },
    // Current status field for easy querying
    current_status: {
      type: String,
      enum: CELEBRATION_STATUSES,
      default: 'active',
      required: true,
    },
    // Detailed status ledger for compliance and audit purposes
    status_ledger: {
      type: [
        {
          // Status change details
          status_change_id: { type: String, required: true }, // Unique identifier for this status change
          previous_status: { type: String, required: true }, // Previous status
          new_status: { type: String, required: true }, // New status
          change_datetime: {
            type: Date,
            required: true,
            default: Date.now,
          }, // When the change occurred
          reason: { type: String, required: true }, // Reason for the status change

          // Trigger information
          triggered_by: {
            type: String,
            required: true,
            enum: ['system', 'admin', 'user', 'api', 'congressional_session'],
          }, // Who/what triggered the change
          triggered_by_id: { type: String }, // ID of the user/admin/system that triggered it
          triggered_by_name: { type: String }, // Human-readable name of the trigger

          // Metadata for specific status changes
          metadata: {
            // For defunct status
            congressional_session: {
              session_number: { type: String }, // e.g., "118th Congress, 1st Session"
              session_end_date: { type: Date },
              session_type: { type: String }, // "regular", "special", etc.
            },
            // For resolved status
            resolution_details: {
              bill_action_date: { type: Date },
              bill_action_type: { type: String }, // "vote", "signature", etc.
              bill_action_result: { type: String }, // "passed", "failed", etc.
              house_vote_date: { type: Date },
              senate_vote_date: { type: Date },
            },
            // For paused status
            pause_details: {
              pause_reason: { type: String }, // Specific reason for pause
              expected_resume_date: { type: Date }, // If known
              related_bill_status: { type: String }, // Current bill status
            },
            // For admin actions
            admin_notes: { type: String }, // Administrative notes
            admin_reason: { type: String }, // Administrative reason
          },

          // Compliance and audit fields
          compliance_tier_at_time: { type: String, required: true }, // User's compliance tier when change occurred
          fec_compliant: { type: Boolean, default: true }, // Whether this change complies with FEC regulations
          audit_trail: {
            ip_address: { type: String }, // IP address if applicable
            user_agent: { type: String }, // User agent if applicable
            session_id: { type: String }, // Session ID if applicable
          },
        },
      ],
      default: [],
    },
    twitter: { type: String },
    tip: { type: Number, required: true },
    FEC_id: { type: String, required: true },
    pol_id: { type: String, required: true },
    bill_id: { type: String, required: true },
    donation: { type: Number, required: true },
    pol_name: { type: String, required: true },
    idempotencyKey: { type: String, required: true },
    donatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    // Capture donor information at time of donation for FEC compliance and audit trail
    donorInfo: {
      // Basic identification (required for Silver/Gold tiers)
      firstName: { type: String, default: '' },
      lastName: { type: String, default: '' },
      // Address information (required for Silver/Gold tiers)
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: 'United States' },
      passport: { type: String, default: '' },
      // Employment information (required for Gold tier)
      isEmployed: { type: Boolean, default: true },
      occupation: { type: String, default: '' },
      employer: { type: String, default: '' },
      // Compliance tier at time of donation
      compliance: { type: String, required: true },
      // Contact information for receipts
      email: { type: String, default: '' },
      username: { type: String, default: '' }, // Username as email fallback
      phoneNumber: { type: String, default: '' },
      // Additional validation and audit fields
      ocd_id: { type: String, default: '' }, // Congressional district mapping
      locked: { type: Boolean, default: false }, // Account lock status at donation time
      understands: { type: Boolean, default: false }, // Terms understanding at donation time

      // Validation flags captured at donation time
      validationFlags: {
        // Simple boolean flag
        isFlagged: { type: Boolean, default: false },

        // Overall validation summary
        summary: {
          totalFlags: { type: Number, default: 0 },
        },

        // Detailed flag information (only populated if isFlagged is true)
        flags: [
          {
            field: { type: String, required: true }, // e.g., 'name', 'address', 'occupation'
            reason: { type: String, required: true }, // Human-readable reason for flag
            match: { type: String, required: true }, // Type of match (e.g., 'missing', 'placeholder', 'profanity')
            originalValue: { type: String, required: true }, // Original value that was flagged
          },
        ],

        // Validation metadata
        validatedAt: { type: Date, default: Date.now },
        validationVersion: { type: String, default: '1.0' }, // For future validation rule changes
      },
    },
  },
  { timestamps: true }
);

const Celebration = mongoose.model('Celebration', celebrationSchema);

module.exports = Celebration;
