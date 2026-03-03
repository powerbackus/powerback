/**
 * @fileoverview ExUser (Deleted User) model schema for MongoDB
 *
 * This module defines the ExUser schema, which represents a user who has
 * deleted their account. ExUser records are created to prevent the same
 * username from being used again for account creation, maintaining data
 * integrity and preventing account reuse after deletion.
 *
 * PURPOSE
 *
 * When a user deletes their account:
 * 1. User record is removed from User collection
 * 2. ExUser record is created with username and exId (original User _id)
 * 3. Username is blocked from future account creation
 * 4. Profile data is preserved for audit/compliance purposes
 *
 * KEY FIELDS
 *
 * IDENTIFICATION
 * - username: Deleted user's username (unique, indexed) - prevents reuse
 * - exId: Reference to original User _id (unique, indexed) - links to deleted account
 *
 * PRESERVED DATA
 * - All profile fields from original User record are preserved:
 *   * Contact information (email, firstName, lastName, phoneNumber)
 *   * Address information (address, city, state, zip, country, passport)
 *   * Employment information (isEmployed, occupation, employer)
 *   * Compliance tier and eligibility flags
 *   * ocd_id (congressional district mapping)
 *
 * RELATIONSHIPS
 * - exId references: Original User record (now deleted)
 * - Referenced by: None (standalone deleted user record)
 *
 * BUSINESS RULES
 * - Username cannot be reused after account deletion
 * - exId provides link to original account for audit purposes
 * - Profile data preserved for FEC compliance and audit requirements
 *
 * @module models/ExUser
 * @requires mongoose
 * @requires ../constants
 * @requires ../shared
 */

const mongoose = require('mongoose'),
  { FEC } = require('../constants'),
  Schema = mongoose.Schema;

const { countries, states } = require('../shared');

const ExUserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      index: { unique: true },
    },
    exId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: { unique: true },
    },
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
      // Google Civics response code for congressional district mapping
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const ExUser = mongoose.model('ExUser', ExUserSchema);

module.exports = ExUser;
