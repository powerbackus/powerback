/**
 * @fileoverview Pol (Politician) model schema for MongoDB
 *
 * This module defines the Pol schema, which represents a politician serving
 * in the U.S. Congress. The schema stores biographical information, social
 * media accounts, current party affiliation, and congressional role history.
 * Data is primarily sourced from the OpenFEC API and Congress.gov API.
 *
 * KEY FIELDS
 *
 * IDENTIFICATION
 * - id: Bioguide ID (unique identifier for members of Congress)
 * - url: Official URL for the politician
 * - first_name, middle_name, last_name: Name components
 *
 * SOCIAL MEDIA
 * - twitter_account, instagram_account, mastodon_account, facebook_account,
 *   youtube_account, bluesky_account, truth_social_account: Social media handles
 *
 * POLITICAL INFORMATION
 * - current_party: Current political party affiliation
 * - last_updated: Timestamp of last data update
 * - has_stakes: Boolean indicating if politician is seeking re-election,
 *   has raised funds, and has a serious challenger (used for donation targeting)
 *
 * CONGRESSIONAL ROLES
 * - roles: Array of RoleSchema objects representing different congressional
 *   terms and positions held by the politician
 *
 * COMPLEX FIELDS
 *
 * roles: Array of role objects, each representing a congressional term/position
 *   - fec_candidate_id: FEC candidate identifier for this role
 *   - short_title: Title (e.g., "Rep.", "Sen.")
 *   - congress: Congress number (e.g., 118 for 118th Congress)
 *   - district: Congressional district (for House members)
 *   - chamber: "house" or "senate"
 *   - ocd_id: Open Civic Data identifier for district/state
 *   - state: State code (e.g., "CA", "NY")
 *   - committees: Array of committee assignments with code and name
 *
 * RELATIONSHIPS
 * - Referenced by: Celebration (pol_id field)
 * - References: None (standalone politician data)
 *
 * DATA SOURCES
 * - OpenFEC API: FEC candidate IDs, campaign finance data
 * - Congress.gov API: Congressional roles, committee assignments
 * - Updated via background jobs (houseWatcher.js)
 *
 * @module models/Pol
 * @requires mongoose
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleSchema = new Schema(
  {
    fec_candidate_id: String,
    short_title: String,
    congress: Number,
    district: String,
    chamber: String,
    ocd_id: String,
    state: String,
    committees: [
      {
        code: String,
        name: String,
      },
    ],
  },
  { _id: false }
); // No extra _id on nested array items

const PolSchema = new Schema(
  {
    id: { type: String, required: true, unique: true }, // bioguideId
    url: String,
    last_name: String,
    first_name: String,
    middle_name: String,
    twitter_account: String,
    instagram_account: String,
    mastodon_account: String,
    facebook_account: String,
    youtube_account: String,
    bluesky_account: String,
    truth_social_account: String,
    current_party: String,
    last_updated: String,
    has_stakes: Boolean, // are they seeking re-election, have they raised funds, and do they have a serious challenger?
    roles: [RoleSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pol', PolSchema);
