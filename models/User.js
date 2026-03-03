/**
 * @fileoverview User model schema for MongoDB
 *
 * This module defines the User schema, which represents an approved user account
 * in the POWERBACK application. The schema includes account authentication,
 * profile information, FEC compliance tracking, payment integration, and
 * user preferences.
 *
 * KEY SECTIONS
 *
 * ACCOUNT MANAGEMENT
 * - Authentication fields (username, password, tokenVersion)
 * - Account security (locked, tryPasswordAttempts)
 * - Password reset flow (resetPasswordHash, resetPasswordHashExpires)
 * - Email unsubscribe management (unsubscribeHash, unsubscribeHashExpires)
 *
 * PROFILE INFORMATION
 * - Contact information (email, firstName, lastName, phoneNumber)
 * - Address information (address, city, state, zip, country, passport)
 * - Employment information (isEmployed, occupation, employer)
 * - Congressional district mapping (ocd_id)
 *
 * FEC COMPLIANCE
 * - Compliance tier (bronze, silver, gold) - determines donation limits
 * - Eligibility understanding flag (understands)
 * - PAC tip limit tracking (tipLimitReached)
 *
 * PAYMENT INTEGRATION
 * - Stripe customer and payment method storage (payment)
 *
 * USER PREFERENCES
 * - Application settings (settings) - email receipts, auto-tweet, tooltips,
 *   email topic unsubscriptions
 *
 * RELATIONSHIPS
 * - Referenced by: Celebration (donatedBy field)
 * - References: None (standalone user account)
 *
 * @module models/User
 * @requires mongoose
 * @requires ../constants
 * @requires bcryptjs
 * @requires ../shared
 */

const mongoose = require('mongoose'),
  bcrypt = require('bcryptjs'),
  { FEC } = require('../constants'),
  Schema = mongoose.Schema;

const { countries, states } = require('../shared');

const UserSchema = new Schema(
  {
    // ** ACCOUNT
    username: {
      type: String,
      required: true,
      lowercase: true,
      index: { unique: true },
    },
    password: {
      type: String,
      required: true,
    },
    locked: {
      type: Boolean,
      default: false,
      required: true,
    },
    // confirm reset pass
    resetPasswordHash: {
      type: String,
    },
    resetPasswordHashIssueDate: {
      type: Date,
    },
    resetPasswordHashExpires: {
      type: Date,
    },
    tryPasswordAttempts: {
      type: Number,
      default: 0,
      required: true,
    },
    lastTimeUpdatedPassword: {
      type: Date,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      required: true,
    },
    // ** UNSUBSCRIBE
    unsubscribeHash: {
      type: String,
    },
    unsubscribeHashIssueDate: {
      type: Date,
    },
    unsubscribeHashExpires: {
      type: Date,
    },
    // ** PROFILE
    email: {
      type: String,
      default: '',
    },
    firstName: {
      type: String,
      default: '',
    },
    lastName: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    passport: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      enum: states,
      default: '',
    },
    zip: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      enum: countries,
      default: 'United States',
    },
    isEmployed: {
      type: Boolean,
      default: true,
    },
    occupation: {
      type: String,
      default: '',
    },
    employer: {
      type: String,
      default: '',
    },
    // ** STATUS
    compliance: {
      type: String,
      enum: FEC.COMPLIANCE_TIER_NAMES,
      default: FEC.COMPLIANCE_TIER_NAMES[0],
    },
    understands: {
      // "understands" eligibility requirements
      type: Boolean,
      default: false,
    },
    tipLimitReached: {
      // True if user has reached PAC tip limit; set/reset by API per election cycle.
      type: Boolean,
      default: false,
    },
    ocd_id: {
      // Google Civics response code that links a user to a Representative by the former's provided address
      type: String,
      default: '',
    },
    // ** stripe
    payment: {
      customer_id: {
        type: String,
      },
      payment_method: {
        type: String,
      },
      type: Object,
    },
    // user preferences
    settings: {
      emailReceipts: {
        type: Boolean,
        default: true,
      },
      autoTweet: {
        type: Boolean,
        default: false,
      },
      showToolTips: {
        type: Boolean,
        default: true,
      },
      unsubscribedFrom: {
        type: [String],
        default: [],
      },
      type: Object,
    },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
