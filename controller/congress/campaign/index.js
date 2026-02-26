/**
 * @fileoverview Campaign Cycle Calculation Module
 *
 * This module provides functions for calculating campaign cycle dates and
 * determining election cycle boundaries. Campaign cycles are 2-year periods
 * used for Compliant tier per-election limit calculations and election-related
 * operations.
 *
 * KEY FUNCTIONS
 *
 * CYCLE CALCULATIONS
 * - thisCampaign: Current campaign cycle date range
 * - nextStart: Next campaign cycle start date
 * - nextEnd: Next campaign cycle end date
 * - cycle: General election date calculator
 * - cutoff: Election cycle cutoff date checker
 *
 * BUSINESS LOGIC
 *
 * CAMPAIGN CYCLES
 * - 2-year periods: Jan 1 (odd year) to Dec 31 (even year)
 * - Used for Compliant tier per-election limit calculations
 * - Primary and general elections are separate cycles
 *
 * ELECTION DATES
 * - General election: First Tuesday after first Monday in November (even years)
 * - Used to determine election cycle boundaries
 * - State-specific dates for Compliant tier limits
 *
 * DEPENDENCIES
 * - ./this: Current campaign cycle
 * - ./next: Next campaign cycle
 * - ./cycle: General election date calculation
 * - ./cutoff: Election cycle cutoff checking
 *
 * @module controller/congress/campaign
 * @requires ./this
 * @requires ./next
 * @requires ./cycle
 * @requires ./cutoff
 */

const { nextEnd, nextStart } = require('./next'),
  { thisCampaign } = require('./this'),
  { cutoff } = require('./cutoff'),
  { cycle } = require('./cycle');

module.exports = { cycle, cutoff, nextEnd, nextStart, thisCampaign };
