/**
 * @fileoverview Bill model schema for MongoDB
 *
 * This module defines the Bill schema, which represents a bill introduced in
 * the U.S. Congress. The schema stores comprehensive bill information including
 * sponsor details, legislative history, vote records, and status tracking.
 * Data is primarily sourced from the Congress.gov API.
 *
 * KEY FIELDS
 *
 * IDENTIFICATION
 * - bill_id: Unique bill identifier (e.g., 'hjres54-119')
 * - bill_slug: URL-friendly bill identifier
 * - congress: Congress number (e.g., "119" for 119th Congress)
 * - bill: Bill type and number (e.g., "H.J.Res.54")
 * - bill_type: Type of bill (e.g., "hjres" for House Joint Resolution)
 * - number: Bill number
 *
 * URLS AND RESOURCES
 * - bill_uri: Official bill URI
 * - gpo_pdf_uri: Government Publishing Office PDF link
 * - congressdotgov_url: Congress.gov URL
 * - govtrack_url: GovTrack.us URL
 * - cbo_estimate_url: Congressional Budget Office estimate URL
 *
 * BILL INFORMATION
 * - title: Full bill title
 * - short_title: Shortened bill title
 * - summary: Full bill summary
 * - summary_short: Abbreviated summary
 * - primary_subject: Main subject category (indexed for search)
 *
 * SPONSOR INFORMATION
 * - sponsor: Full sponsor object with details
 * - sponsor_id: Sponsor's bioguide ID
 * - sponsor_uri: Sponsor's URI
 * - sponsor_title: Sponsor's title
 * - sponsor_party: Sponsor's party
 * - sponsor_state: Sponsor's state
 *
 * LEGISLATIVE STATUS
 * - introduced_date: Date bill was introduced
 * - active: Whether bill is currently active
 * - last_vote: Date of last vote
 * - house_passage: Whether bill passed the House
 * - senate_passage: Whether bill passed the Senate
 * - enacted: Whether bill was enacted into law
 * - vetoed: Whether bill was vetoed
 *
 * VOTE INFORMATION
 * - house_passage_vote: House vote record
 * - senate_passage_vote: Senate vote record
 * - votes: Array of all vote records
 *
 * COMMITTEE INFORMATION
 * - committees: Committee assignment details
 * - committee_codes: Committee codes
 * - subcommittee_codes: Subcommittee codes
 *
 * LEGISLATIVE HISTORY
 * - latest_major_action: Most recent major action description
 * - latest_major_action_date: Date of most recent major action
 * - actions: Array of all legislative actions
 * - versions: Array of bill versions
 * - presidential_statements: Presidential statements related to bill
 *
 * COSPONSORSHIP
 * - houseMembers: Array of House cosponsors
 * - houseMembers_by_party: House cosponsors grouped by party
 * - withdrawn_houseMembers: House members who withdrew cosponsorship
 *
 * RELATIONSHIPS
 * - Referenced by: Celebration (bill_id field) - celebrations are tied to bills
 * - References: Pol (sponsor_id, houseMembers contain pol IDs)
 *
 * BUSINESS RULES
 * - bill_id is unique and indexed for fast lookups
 * - primary_subject is indexed for subject-based searches
 * - Celebrations are created with bill_id to track which bill triggers resolution
 * - Bill status changes trigger celebration status updates via background jobs
 *
 * DATA SOURCES
 * - Congress.gov API: Primary data source
 * - Updated via background jobs (checkHJRes54.js, houseWatcher.js)
 *
 * @module models/Bill
 * @requires mongoose
 */

const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const billSchema = new Schema(
  {
    bill_id: {
      type: 'string',
      index: { unique: true },
    },
    bill_slug: { type: 'string' },
    congress: { type: 'string' },
    bill: { type: 'string' },
    bill_type: { type: 'string' },
    number: { type: 'string' },
    bill_uri: { type: 'string' },
    title: { type: 'string' },
    short_title: { type: 'string' },
    sponsor_title: { type: 'string' },
    sponsor: { type: Schema.Types.Mixed },
    sponsor_id: { type: 'string' },
    sponsor_uri: { type: 'string' },
    sponsor_party: { type: 'string' },
    sponsor_state: { type: 'string' },
    gpo_pdf_uri: { type: 'string' },
    congressdotgov_url: { type: 'string' },
    govtrack_url: { type: 'string' },
    introduced_date: { type: 'string' },
    active: { type: 'boolean' },
    last_vote: { type: 'string' },
    house_passage: { type: 'boolean' },
    senate_passage: { type: 'boolean' },
    enacted: { type: 'boolean' },
    vetoed: { type: 'boolean' },
    houseMembers: { type: [Schema.Types.Mixed] },
    houseMembers_by_party: { type: [Schema.Types.Mixed] },
    withdrawn_houseMembers: { type: [Schema.Types.Mixed] },
    primary_subject: {
      type: 'string',
      index: { unique: false },
    },
    committees: { type: 'object' },
    committee_codes: { type: 'object' },
    subcommittee_codes: { type: 'object' },
    latest_major_action_date: { type: 'string' },
    latest_major_action: { type: 'string' },
    house_passage_vote: { type: 'string' },
    senate_passage_vote: { type: 'string' },
    summary: { type: 'string' },
    summary_short: { type: 'string' },
    cbo_estimate_url: { type: 'string' },
    versions: { type: [Schema.Types.Mixed] },
    actions: { type: [Schema.Types.Mixed] },
    presidential_statements: { type: [Schema.Types.Mixed] },
    votes: { type: [Schema.Types.Mixed] },
  },
  { timestamps: true }
);

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;
