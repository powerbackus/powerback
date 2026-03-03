/**
 * @fileoverview Celebrations Controller Module
 *
 * This module provides controller functions for managing donation celebrations
 * (escrowed donations). It handles celebration creation, resolution, receipt
 * generation, and data queries. Celebrations are donations held in escrow until
 * specific conditions are met (e.g., a bill is brought to the House floor).
 *
 * KEY FUNCTIONS
 *
 * CREATION & MANAGEMENT
 * - create: Creates new celebration record in database
 * - resolve: Resolves celebration (releases escrowed funds)
 * - receipt: Generates and sends celebration receipt email
 *
 * DATA QUERIES
 * - byUserId: Gets all celebrations for a specific user
 * - asyncUser: Gets user's celebrations asynchronously
 * - escrowed: Gets aggregated escrow data by politician
 * - byMostPopularBills: Gets celebrations grouped by bill popularity
 * - count: Counts celebrations matching criteria
 *
 * BUSINESS LOGIC
 *
 * CELEBRATION LIFECYCLE
 * - Created: Celebration created with payment_intent (not charged)
 * - Active: Awaiting trigger condition
 * - Resolved: Trigger condition met, funds charged and released
 * - Defunct: Expired or cancelled, funds never move to the campaign
 *
 * ESCROW SYSTEM
 * - Funds held in escrow until trigger condition met
 * - Payment intent created but not charged until resolution
 * - Status tracked in status_ledger for audit compliance
 *
 * DEPENDENCIES
 * - ./receipt: Receipt generation
 * - ./resolve: Celebration resolution
 * - ./create: Celebration creation
 * - ./count: Celebration counting
 * - ./find: Celebration queries
 *
 * @module controller/celebrations
 * @requires ./receipt
 * @requires ./resolve
 * @requires ./create
 * @requires ./count
 * @requires ./find
 */

const { receipt } = require('./receipt'),
  { resolve } = require('./resolve'),
  { create } = require('./create'),
  { count } = require('./count');

const { byUserId, escrowed, asyncUser, byMostPopularBills } = require('./find');

module.exports = {
  byMostPopularBills,
  asyncUser,
  escrowed,
  byUserId,
  resolve,
  receipt,
  create,
  count,
};
