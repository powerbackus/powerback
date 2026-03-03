/**
 * @fileoverview Applicant model schema for MongoDB
 *
 * This module defines the Applicant schema, which represents a user in the
 * process of creating a new account, awaiting email verification. Applicants
 * are temporary records that are converted to User records upon account
 * activation via email hash verification.
 *
 * ACCOUNT CREATION FLOW
 *
 * 1. User submits registration form → Applicant record created
 * 2. System generates joinHash and sends activation email
 * 3. User clicks activation link → Account activated
 * 4. Applicant record converted to User record
 * 5. Applicant record deleted (or retained for audit)
 *
 * KEY FIELDS
 *
 * ACCOUNT CREATION
 * - joinHash: Secure hash for account activation email link
 * - joinHashIssueDate: When activation hash was generated
 * - joinHashExpires: Expiration date for activation link
 *
 * AUTHENTICATION (Same as User model)
 * - username, password: Login credentials
 * - locked: Account lock status
 * - tokenVersion: JWT token version for invalidation
 * - tryPasswordAttempts: Failed login attempt counter
 * - resetPasswordHash: Password reset hash (if reset requested)
 *
 * PROFILE INFORMATION (Same as User model)
 * - Contact, address, employment information
 * - FEC compliance tier
 *
 * PASSWORD HASHING
 * Uses bcrypt with pre-save hook to automatically hash passwords before saving.
 * Only hashes if password has been modified (new or updated).
 *
 * RELATIONSHIPS
 * - Converted to: User (upon activation)
 * - References: None (temporary record)
 *
 * BUSINESS RULES
 * - joinHash expires after set time period
 * - Password is automatically hashed on save
 * - Applicant records are typically deleted after conversion to User
 * - All profile fields match User schema structure for seamless conversion
 *
 * @module models/Applicant
 * @requires mongoose
 * @requires ../constants
 * @requires bcryptjs
 * @requires ../shared
 */

const mongoose = require('mongoose'),
  bcrypt = require('bcryptjs'),
  { SERVER, FEC } = require('../constants'),
  Schema = mongoose.Schema;

const { countries, states } = require('../shared');

const SALT = SERVER.SALT_WORK_FACTOR;

const ApplicantSchema = new Schema(
  {
    // login
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
    // confirm join pass
    joinHash: {
      type: String,
    },
    joinHashIssueDate: {
      type: Date,
    },
    joinHashExpires: {
      type: Date,
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
      required: true,
      default: new Date(),
      type: Date,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      required: true,
    },
    // profile
    email: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    passport: {
      type: String,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
      enum: states,
    },
    zip: {
      type: String,
    },
    country: {
      type: String,
      enum: countries,
      default: 'United States',
    },
    isEmployed: {
      type: Boolean,
    },
    occupation: {
      type: String,
    },
    employer: {
      type: String,
    },
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
      type: Object,
    },
  },
  { timestamps: true }
);

ApplicantSchema.pre('save', function (next) {
  const applicant = this;

  // only hash the password if it has been modified (or is new)
  if (!applicant.isModified('password')) {
    return next();
  }

  // generate a salt
  bcrypt.genSalt(SALT, (err, salt) => {
    if (err) {
      return next(err);
    }

    // hash the password using our new salt
    bcrypt.hash(applicant.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }

      // override the cleartext password with the hashed one
      applicant.password = hash;
      next();
    });
  });
});

const Applicant = mongoose.model('Applicant', ApplicantSchema);

module.exports = Applicant;
