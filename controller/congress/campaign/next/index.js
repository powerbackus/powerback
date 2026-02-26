/**
 * @fileoverview Next Campaign Cycle Date Module
 *
 * This module provides functions to calculate the next campaign cycle start
 * and end dates. Used for determining future election cycle boundaries and
 * planning election-related operations.
 *
 * KEY FUNCTIONS
 *
 * nextStart()
 * - Calculates the start date of the next campaign cycle
 * - Returns January 1st of the next odd year
 *
 * nextEnd()
 * - Calculates the end date of the next campaign cycle
 * - Returns December 31st of the next even year
 *
 * DEPENDENCIES
 * - ./start: Next cycle start date calculation
 * - ./end: Next cycle end date calculation
 *
 * @module controller/congress/campaign/next
 * @requires ./start
 * @requires ./end
 */

const { nextStart } = require('./start'),
  { nextEnd } = require('./end');

module.exports = { nextEnd, nextStart };
