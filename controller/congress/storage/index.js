/**
 * @fileoverview Congressional Data Storage Controller Module
 *
 * This module provides data lookup functions for congressional data stored
 * in the local database. It handles looking up politicians and bills from
 * cached data that was originally sourced from external APIs (OpenFEC, Congress.gov).
 *
 * KEY FUNCTIONS
 *
 * lookupPol(polId, model)
 * - Looks up politician by bioguide ID in local database
 * - Returns full politician document with roles and social media
 *
 * lookupBill(bill_id)
 * - Looks up bill by bill_id in local database
 * - Returns full bill document with legislative history
 *
 * BUSINESS LOGIC
 *
 * DATA SOURCES
 * - Local database (cached data)
 * - Originally sourced from OpenFEC API and Congress.gov API
 * - Updated via background jobs (houseWatcher.js, checkHJRes54.js)
 *
 * LOOKUP PERFORMANCE
 * - Fast local database queries
 * - No external API calls
 * - Used when data is already cached
 *
 * DEPENDENCIES
 * - ./lookupPol: Politician lookup
 * - ./lookupBill: Bill lookup
 * - models/Pol: Politician model
 * - models/Bill: Bill model
 *
 * @module controller/congress/storage
 * @requires ./lookupPol
 * @requires ./lookupBill
 * @requires ../../../models/Pol
 * @requires ../../../models/Bill
 */

const { lookupPol } = require('./lookupPol'),
  { lookupBill } = require('./lookupBill');

module.exports = { lookupPol, lookupBill };
