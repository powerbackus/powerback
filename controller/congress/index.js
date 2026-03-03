/**
 * @fileoverview Congress Controller Module
 *
 * This module provides controller functions for managing congressional data,
 * including politician information, bill lookups, campaign cycle calculations,
 * and congressional session management. Data is primarily sourced from the
 * OpenFEC API and Congress.gov API.
 *
 * KEY FUNCTIONS
 *
 * POLITICIAN DATA
 * - getPols: Retrieves all politicians (filtered by has_stakes)
 * - getPol: Retrieves specific politician by ID
 * - lookupPol: Looks up politician data from external APIs
 *
 * BILL DATA
 * - lookupBill: Looks up bill data from Congress.gov API
 *
 * CAMPAIGN CYCLE CALCULATIONS
 * - thisCampaign: Gets current campaign cycle information
 * - nextStart: Gets next campaign cycle start date
 * - nextEnd: Gets next campaign cycle end date
 * - cutoff: Determines if date is within current election cycle
 * - cycle: Calculates election cycle dates
 *
 * CONGRESSIONAL SESSION
 * - config: Gets congressional session configuration
 * - vest: Congressional vesting/authorization functions
 *
 * BUSINESS LOGIC
 *
 * ELECTION CYCLE CALCULATIONS
 * - Uses cutoff() to determine if donations are in current election cycle
 * - Primary and general elections are separate cycles
 * - Cycle dates based on state-specific election dates
 *
 * POLITICIAN FILTERING
 * - getPols filters by has_stakes flag (competitive races)
 * - Used for donation targeting and prioritization
 *
 * DATA SOURCES
 * - OpenFEC API: FEC candidate IDs, campaign finance data
 * - Congress.gov API: Bill data, congressional roles
 * - Local storage: Cached politician and bill data
 *
 * DEPENDENCIES
 * - ./storage: Bill and politician lookup from external APIs
 * - ./config: Congressional session configuration
 * - ./pols: Politician list retrieval
 * - ./pol: Single politician retrieval
 * - ./vest: Congressional vesting functions
 * - ./campaign: Campaign cycle calculations
 *
 * @module controller/congress
 * @requires ./storage
 * @requires ./config
 * @requires ./pols
 * @requires ./pol
 * @requires ./vest
 * @requires ./campaign
 */

const { lookupBill, lookupPol } = require('./storage'),
  { config } = require('./config'),
  { getPols } = require('./pols'),
  { getPol } = require('./pol'),
  { vest } = require('./vest'),
  {
    thisCampaign,
    nextStart,
    nextEnd,
    cutoff,
    cycle,
  } = require('./campaign');

module.exports = {
  thisCampaign,
  lookupBill,
  lookupPol,
  nextStart,
  nextEnd,
  getPols,
  config,
  cutoff,
  getPol,
  cycle,
  vest,
};
